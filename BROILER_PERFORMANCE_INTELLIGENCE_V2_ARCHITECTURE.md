# Broiler Performance Intelligence V2 — Scientific Methodology

## Scope

This layer is analytical and read-only. The canonical weekly records, official broiler standards registry, FCR engine, weight calculations, mortality/livability calculations, uniformity calculations, report tabs and bottom navigation remain authoritative.

## 1. EPEF / PEF

Formula:

`PEF = (Livability % × Live Weight kg × 100) / (Age days × FCR)`

The calculation follows the Aviagen/Ross definition. Higher is better. Aviagen explicitly notes that PEF/EPEF is strongly influenced by daily gain and that comparisons should use similar processing ages.

## 2. Same-age official reference gaps

Weight gap:

`100 × (Actual weight − Official reference weight) / Official reference weight`

FCR gap:

`100 × (Actual cumulative FCR − Official cumulative FCR) / Official cumulative FCR`

For weight, positive is better. For FCR, negative is better.

The reference is the canonical official value selected by the existing broiler report engine for the flock strain and benchmark age. The intelligence layer does not create a new official standard.

## 3. Uniformity

The layer reports the canonical CV, ±10% uniformity and ±15% uniformity.

Internal quality reference points are:

- CV ≤ 10%: preferred quality target.
- Uniformity ±10% ≥ 80%: preferred quality target.
- Uniformity ±15% ≥ 90%: preferred quality target.

These are explicitly labelled analytical/management quality targets, not Aviagen strain standards. CV is calculated from SD / mean BW × 100, consistent with Aviagen guidance.

## 4. Peer benchmark

Peer position is read from the existing `get_broiler_benchmark_v1` service. No replacement cohort logic is introduced.

A percentile is shown only when the peer population has `N ≥ 30`. P10/P50/P90 describe the peer population; they are not official breeder standards.

## 5. ABPI

ABPI is an internal provisional composite, not an industry-standard index.

Weights:

- Growth: 30%
- FCR: 30%
- Livability: 20%
- Uniformity: 20%

Growth and FCR are normalized against the official same-age reference. Livability is expressed against a 100-point biological scale and uniformity is normalized against the explicit quality targets.

EPEF is excluded from ABPI to avoid double-counting weight, livability and FCR because those variables are already embedded in EPEF.

`100` represents the selected composite reference level. Values are diagnostic summaries, not clinical or economic guarantees.

The weights are intentionally exposed in the methodology and should be recalibrated against the farm's historical outcomes before being treated as a validated predictive score.

## 6. Trend analysis

A minimum of three valid age/value points is required. The layer uses a simple least-squares slope by age to classify whether a metric is moving in a favorable or unfavorable direction.

Trend is a monitoring signal, not a forecast.

## 7. Performance triage

The diagnostic layer uses explicit rules rather than opaque AI labels:

- Weight ≥5% below same-age official reference → growth attention.
- Weight ≥10% below reference → high-priority growth signal.
- FCR ≥5% worse than same-age official reference → FCR attention.
- FCR ≥10% worse → high-priority FCR signal.
- CV >10% → uniformity attention; CV ≥15% → high-priority signal.
- Uniformity ±10% <80% → uniformity attention; <70% → high-priority signal.
- Livability <97% → livability attention; <95% → high-priority signal.
- Weight/FCR worsening trend → moderate trend signal.
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

## 9. Data quality

The intelligence layer reports whether it has:

- at least three weekly records,
- latest weight,
- age,
- cumulative FCR,
- livability,
- official weight reference,
- official FCR reference.

Missing inputs produce `—`/insufficient-data states rather than fabricated values.

## 10. Why these metrics?

The model intentionally separates four questions:

1. **How efficiently is the flock converting production inputs into output?** → EPEF/PEF.
2. **Is the flock meeting the genetic/official same-age expectation?** → weight and FCR gaps.
3. **Is performance consistent across birds?** → CV and ±10/±15 uniformity.
4. **Is the flock outperforming or underperforming its relevant peers?** → peer percentile.

Health association is an explanatory layer, not a replacement for clinical investigation.

## References

- Aviagen Ross Broiler Management Handbook 2025 — PEF/EPEF, FCR and CV definitions.
- Aviagen Ross Broiler Pocket Guide 2025 — PEF/EPEF definition and caution about comparing different processing ages.
- Aviagen Ross 308 / Ross 308 AP product documentation — current breeder/product reference context.
- Choi et al., 2026, *Animals*: review of flock uniformity determinants and CV/uniformity interpretation.
- Commercial broiler literature on associations between flock uniformity and production/welfare measures.
