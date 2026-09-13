# Broiler Performance Intelligence V1 — Architecture Contract

## Purpose
This layer is a broiler-only, read-only analytical subsystem for the reports area. It is intentionally independent from canonical production calculations.

## Hard boundaries
1. Never write to or replace canonical weight, FCR, mortality, CV, uniformity, official-standard, or management-target calculations.
2. Never infer missing processing, economic, health, or population values as if they were measured.
3. Never display population percentile when the matched population is below the configured minimum (default 30).
4. Never interpret correlation as causation.
5. Never use EPEF as an input to ABPI because EPEF already contains body weight, livability, age, and FCR.
6. Every derived output must identify its provenance: measured, calculated, estimated, official-reference, management-reference, or population-derived.
7. The module must be loadable without Supabase and without the reports page. Its public API is pure and deterministic.
8. UI integration is an adapter concern and must not be mixed into the analytics engine.

## Public API
- `epef()` — standard EPEF calculation.
- `livability()` — normalized livability outcome.
- `processing()` — carcass/parts yield from measured slaughter data.
- `economics()` — feed cost, revenue and partial margin; incomplete economics stays explicitly incomplete.
- `normalizeHigher()` / `normalizeLower()` — utility normalization against an external target.
- `abpi()` — weighted domain score. EPEF excluded to avoid double counting. Default weights are provisional and must be calibrated against real flock outcomes before being presented as a validated clinical/economic score.
- `percentile()` / `conditionalBenchmark()` — population benchmarking with minimum-N protection.
- `healthPerformanceAssociation()` — lagged association analysis; no causal claims.
- `marketOptimization()` — candidate slaughter-age comparison using supplied market and feed inputs; it is a decision aid, not a full farm profit model.

## Data flow
RAW REPORT MODEL → existing canonical calculations → isolated PI adapter → isolated PI engine → report presentation.

The engine must never call the canonical calculation engines in order to modify them. The adapter may read their outputs.

## ABPI policy
ABPI is a separate calibrated score, not a replacement for EPEF. The current V1 weights are a provisional engineering default only. Before production-grade scoring, weights and thresholds should be validated on a sufficiently large, representative real-flock dataset and versioned. Until then the UI should label the score as a pilot/provisional index or omit it from a high-stakes executive scorecard.

## Benchmark policy
Population benchmarking must be conditional on comparable cohorts: production type, genetics/strain, sex where available, target/market-weight band, age band, housing/region/season when available. A raw global percentile is not acceptable as a primary benchmark. The engine currently enforces a minimum numeric population size; the future adapter must enforce cohort matching before calling it.

## Processing policy
Measured slaughter data is preferred. If carcass weight is absent, carcass yield is unavailable; no genetic or literature-derived yield should be silently inserted as an observed value. Literature/official expectations may be shown separately as reference ranges.

## Economics policy
Economics must keep live-market and carcass-market pathways distinct. Feed cost is a major component but is not total cost. Full margin should only be displayed when the required cost and price inputs exist. Otherwise show partial economics with a clear confidence/coverage state.

## Health-performance policy
Use temporal windows/lags where possible. Report association strength, sample size and window. Never use language such as “caused” unless a causal design supports it.

## Market policy
The objective is not maximum live weight. The target is an economically appropriate slaughter window for the declared market specification. Target weight, price, feed cost, FCR trajectory and processing yield must be considered together.

## UI contract for the later adapter
The first screen should show only decision-grade KPIs: EPEF, livability, weight vs target, FCR vs target, uniformity, processing yield when available, ABPI only when validated/adequately covered, benchmark position only when the cohort is valid, and a short actionable insight. Detailed formulas, source/provenance, confidence and diagnostics belong behind an expandable detail view.

## Rollout sequence
1. Merge/test the isolated core only.
2. Build a broiler-only report adapter that reads existing report-model values.
3. Add regression tests proving no changes to existing canonical outputs.
4. Add UI cards/charts behind a broiler production-type gate.
5. Add processing/economic input capture only after the data contract is stable.
6. Add real population benchmark cohorts after enough comparable flock data exists.
7. Calibrate and version ABPI only after real outcome data is available.
