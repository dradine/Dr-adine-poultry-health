# Flock Benchmark V7 — Test & Acceptance Plan

## Automated checks executed against Supabase

1. Four production types exist in the V7 metric registry.
2. All configured Metrics have valid direction and age windows.
3. Peer Score cannot become usable below 20 comparable flocks and 10 independent units.
4. Comparable flock count equals independent-unit count because one representative flock is selected per independent unit.
5. P25 ≤ Median ≤ P75 whenever a distribution exists.
6. Peer percentile is constrained to 0–100.
7. Context Metrics never receive a Peer Score.
8. Persian production-type normalization maps correctly.
9. Legacy three-argument V7 function was removed to prevent ambiguous RPC resolution.
10. Body-weight benchmark was executed across 106 production flocks with no missing canonical age and no suspicious current data-quality flag.
11. Full metric matrix execution was stress-tested across the accessible test dataset; records without an applicable weekly observation correctly return no benchmark row rather than fabricating a value.

## Important interpretation

A missing Benchmark is not treated as zero performance. It means the cohort/metric does not currently have enough valid, applicable data. This is intentional and prevents false precision.

## Acceptance gates

- Mathematical integrity: PASS
- Four-production model: PASS
- Unit-independence rule: PASS
- Age-window rule: PASS
- Context scoring rule: PASS
- Access-control path: PASS on authenticated owner test context
- Regression safety: V6 retained; V7 additive

## Remaining product integration gate

The UI/report layer must call the V7 RPCs before V7 can be considered the sole production-facing Benchmark renderer. Until that integration is switched, V6 remains the compatibility layer.
