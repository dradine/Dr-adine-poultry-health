# Broiler Performance Intelligence V2 — Scientific Methodology

## Scope

This layer is analytical and read-only. The canonical weekly records, official broiler standards registry, FCR engine, weight calculations, mortality/livability calculations, uniformity calculations, report tabs and bottom navigation remain authoritative.

The intelligence layer may enrich missing provenance by reading the existing read-only Supabase performance-intelligence resolver, but it never writes standards or weekly records and never replaces canonical calculations.

## 1. EPEF / PEF

Formula:

`PEF = (Livability % × Live Weight kg × 100) / (Age days × FCR)`

The calculation follows the Aviagen/Ross definition. Higher is better. Aviagen explicitly notes that PEF/EPEF is strongly influenced by daily gain and that comparisons should use similar processing ages.

## 2. Same-age reference gaps

Weight gap:

`100 × (Actual weight − Reference weight) / Reference weight`

FCR gap:

`100 × (Actual cumulative FCR − Reference cumulative FCR) / Reference cumulative FCR`

For weight, positive is better. For FCR, negative is better.

Reference hierarchy is provenance-aware:

1. Canonical official same-age reference already supplied by the broiler report engine.
2. Existing read-only `calculate_performance_intelligence` resolver, which prefers official standards and then the existing management benchmark fallback according to its established rules.
3. No reference: the intelligence layer reports insufficient reference data and does not fabricate a target.

An official-derived FCR reference calculated from adjacent official cumulative FCR and body-weight points remains labelled as official-derived; it is not presented as a separate breeder standard.

The intelligence layer does not create or modify an official or management standard.

## 3. Uniformity

The layer reports the canonical CV, ±10% uniformity and ±15% uniformity.

Internal quality reference points are:

- CV ≤ 10%: preferred quality target.
- Uniformity ±10% ≥ 80%: preferred quality target.
- Uniformity ±15% ≥ 90%: preferred quality target.

These are explicitly labelled analytical/management quality targets, not Aviagen strain standards. CV is calculated from SD / mean BW × 100, consistent with Aviagen guidance.

## 4. Peer benchmark

Peer position is read from the existing `get_broiler_benchmark_v1` service. No replacement cohort logic is introduced.

A percentile is shown only when the peer population satisfies the existing service's minimum population requirement. P10/P50/P90 describe the peer population; they are not official breeder standards.

## 5. ABPI

ABPI is an internal provisional composite, not an industry-standard index.

Weights and normalization remain those implemented by the canonical intelligence engine. EPEF is excluded from ABPI to avoid double-counting weight, livability and FCR because those variables are already embedded in EPEF.

`100` represents the selected composite reference level. Values are diagnostic summaries, not clinical or economic guarantees.

The weights are intentionally exposed in the methodology and should be recalibrated against the farm's historical outcomes before being treated as a validated predictive score.

## 6. Reference-aware trend analysis

Trend interpretation is deliberately separated from raw metric slope.

For each metric with a valid reference trajectory, the layer calculates:

- current gap from reference,
- previous valid-record gap from reference,
- change in gap in percentage points,
- actual metric change,
- reference change,
- descriptive actual slope by age,
- reference slope when enough points exist,
- gap trajectory slope when enough points exist.

Direction is metric-specific:

- Weight: higher than reference is favorable.
- FCR: lower than reference is favorable.
- CV: lower than reference is favorable.

The primary week-to-week interpretation is based on **change in reference gap**, not raw actual slope alone. This prevents a flock from being labelled as improving merely because weight increased while its reference trajectory increased faster.

A reference gap may therefore be interpreted as:

- strong improvement,
- improvement,
- slight improvement,
- stable,
- slight worsening,
- worsening,
- strong worsening.

The presentation also reports the current position separately, such as `بالاتر از مرجع`, `نزدیک به مرجع`, `پایین‌تر از مرجع`, `بهتر از مرجع`, or `بدتر از مرجع`.

The explanatory sentence combines current position, previous position, gap change and trend outlook. It must never claim causation from performance data alone.

A raw slope is descriptive only; it is not itself a health diagnosis, causal signal, or forecast.

## 7. Performance triage

The diagnostic layer uses explicit rules rather than opaque AI labels:

- Weight ≥5% below same-age official reference → growth attention.
- Weight ≥10% below reference → high-priority growth signal.
- FCR ≥5% worse than same-age official reference → FCR attention.
- FCR ≥10% worse → high-priority FCR signal.
- CV >10% → uniformity attention; CV ≥15% → high-priority signal.
- Uniformity ±10% <80% → uniformity attention; <70% → high-priority signal.
- Livability <97% → livability attention; <95% → high-priority signal.
- Weight/FCR worsening reference trajectory → moderate trend signal.
- Weight peer percentile <25 → peer-position signal; <10 → high-priority peer signal.

These thresholds are internal triage rules, not disease thresholds and not official breeder specifications.

## 8. Health–performance association

Only health events explicitly marked for management analysis and reporting are used.

Severity score:

- Mild = 1
- Moderate = 2
- Severe = 3

The analysis matches health events to subsequent performance points within a 7-day window. At least three health events and four performance points are required.

The output is a correlation/association signal only. It must never be interpreted as proof that a health event caused the performance change.

## 9. Data quality and provenance

The intelligence layer reports whether it has:

- sufficient weekly history,
- latest weight,
- age,
- cumulative FCR,
- livability,
- reference weight,
- reference FCR,
- reference provenance.

Reference provenance is displayed as official, official-derived, scientific, management, numeric/unspecified, or unavailable where applicable.

Missing inputs produce `—`/insufficient-data states rather than fabricated values.

## 10. Multi-strain behavior

The intelligence layer is strain-agnostic at runtime. When a flock is selected, its existing `flock_id`, production type, genetics and strain are passed through the existing report/router path to resolve the appropriate reference data.

No hard-coded Ross-only or single-strain intelligence branch is introduced. If a particular strain/age has no valid reference in the existing registries, that metric is explicitly marked unavailable rather than borrowing another strain's standard.

This protects against cross-strain contamination while allowing every currently supported broiler strain to use the same analytical interpreter.

## 11. Why these metrics?

The model intentionally separates five questions:

1. **How efficiently is the flock converting production inputs into output?** → EPEF/PEF.
2. **Is the flock meeting the relevant same-age expectation?** → reference gaps and reference trajectory.
3. **Is performance consistent across birds?** → CV and ±10/±15 uniformity.
4. **Is the flock outperforming or underperforming its relevant peers?** → peer percentile.
5. **Is there a multi-signal performance pattern worth investigating?** → explicit diagnostic rules and health-association context.

Health association is an explanatory layer, not a replacement for clinical investigation.

## References

- Aviagen Ross Broiler Management Handbook 2025 — PEF/EPEF, FCR and CV definitions.
- Aviagen Ross Broiler Pocket Guide 2025 — monitoring live weight/uniformity and investigation of inconsistent performance.
- Aviagen Ross 308 / Ross 308 AP product documentation — current breeder/product reference context.
- Choi et al., 2026, *Animals*: review of flock uniformity determinants and CV/uniformity interpretation.
- Commercial broiler literature on associations between flock uniformity and production/welfare measures.
