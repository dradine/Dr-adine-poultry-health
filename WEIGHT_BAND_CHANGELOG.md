# Adine Weight Band Analysis — Change Record

## Scope
Additive weight-band statistical analysis for the weekly monitoring and overall flock report.

## Formula
For a single population:
`P(L < X <= U) = NORM.DIST(U, Mean, SD, TRUE) - NORM.DIST(L, Mean, SD, TRUE)`

`SD = Mean × CV / 100`

Estimated flock count:
`ROUND(predicted_percent × flock_size / 100, 0)`

## Integration
- Existing weekly weight/CV/SD/uniformity calculations remain unchanged.
- Existing FCR and official standards remain unchanged.
- No Supabase schema change.
- New data is stored additively at `weekly_records.production_metrics._weightBand`.
- Weekly UI adds one analysis section automatically after the sample-weight container.
- Overall report adds one trend chart when the overall report tab is active.
- Existing navigation and report tabs are unchanged.

## Validation
Validated with JavaScript syntax checks, deterministic statistical tests, monotonicity/CDF checks, boundary checks, invalid-input checks, and 2,000 randomized calculation cases.
