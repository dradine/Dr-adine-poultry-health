# Layer monitoring — scientific design and operational contract

## Architecture and scope
- Laying hens only. Do not alter Broiler engines, standards, routes, pages or reports in Layer work.
- One calculation source: `layer-calculation-engine-v1.js` (`ADINE_LAYER_CALCULATION_ENGINE_V1`). Daily UI and period aggregation call it; KPI formulas must not be duplicated in screens.
- One standards source: `layer-daily-standards-v1.js` (`ADINE_LAYER_STANDARDS_ENGINE_V1`; the legacy alias points to the same object).
- Daily rows are canonical raw data. Weekly/monthly rows are rebuildable derived summaries. Reports read the correct source table rather than independently calculating KPIs.
- Persist calculation/standard versions, source labels/URLs, per-metric source and interpolation metadata in the existing JSONB provenance field.

## KPI definitions
- Hen-Day (%) = eggs/day ÷ defined live-hen denominator × 100. If required population data are missing, return null rather than using partial bird-days.
- Hen-Housed (%) = eggs/day ÷ original hens placed × 100.
- Egg mass (kg) = total eggs × mean egg weight (g) ÷ 1,000.
- FCR (kg feed/kg egg mass) = recorded feed quantity (kg) ÷ egg mass (kg), only when feed and egg-mass inputs are complete. Period FCR is ratio-of-sums, never a mean of daily FCR.
- Feed/egg (g) = recorded feed (kg) × 1,000 ÷ egg count.
- Feed/hen (g/day) = recorded feed (kg) × 1,000 ÷ the defined live-hen denominator.
- Water/hen (mL/day) = recorded water (L) × 1,000 ÷ the defined live-hen denominator.
- Water:feed = recorded water (L) ÷ recorded feed (kg), reported as L/kg; a screening signal, not a diagnosis.
- Livability (%) = (original hens placed − cumulative mortality − cumulative culls) ÷ original hens placed × 100. Mortality and culls remain separately visible.
- Saleable percentage = saleable egg count ÷ total eggs × 100. Total defect percentage is derived only from total eggs minus saleable eggs. Cracked, dirty, floor, soft-shell and misshapen categories may overlap; do not sum them into a total defect rate.
- Body-weight mean is sample-size weighted when sample counts exist. A mean of daily CV/uniformity observations is not the same as pooled CV/uniformity; label it accordingly unless raw individual weights are retained.

## Daily form priorities
Essential: date/age, live-hen count, mortality, culls, feed quantity, water quantity, total eggs, saleable eggs when available, egg weight when sampled, and clinical signs/treatments/feed changes/vaccination/equipment events.
High-value additional fields: temperature, relative humidity, light hours/intensity, ammonia/CO2 only when measured, water temperature/quality checks, manure/litter condition, appetite, respiratory signs, droppings, activity, pecking, shell-quality status, and equipment failures. Missing readings must remain missing, never fabricated.

## Weekly/monthly priorities
- Production: Hen-Day, Hen-Housed, egg count, egg mass, egg weight, saleable fraction, feed/egg and FCR.
- Health: mortality/culls separately, cumulative rates, livability, clinical signs and interventions.
- Body weight: sample count, mean, uniformity ±10%/±15% and CV only with defined sampling and a suitable body-weight target.
- Egg quality: dirty/cracked/floor/soft-shell/misshapen counts; Haugh unit, albumen height, shell strength/thickness, colour and egg-size distribution only when actually measured.
- Environment/water trends, completeness of expected days, missing critical inputs, impossible counts and source IDs.
- Period completeness means dates and age progression are continuous; it does not imply every optional test was measured.

## Alerts and scores
Current thresholds are operational screening triggers, not universal biological cut-offs and not a validated diagnosis. They should prompt checks of records, feed/water delivery, equipment, environment, egg collection, body weight, health signs and veterinary examination as appropriate. No composite score is enabled until weights and cut-offs are calibrated on representative farm data and validated against outcomes. High feed intake alone is never awarded an “improvement” score.

## Standard provenance
- Use exact strain/variant and housing system where the breeder publishes system-specific guides.
- Official breeder values are separate from the local operational screening reference; the latter is not a global or genetic standard.
- Interpolation between official points is an estimate, not a value directly printed in the breeder guide; provenance marks it as interpolated.
- ISA Brown cage guide verified from the official source on 2026-10-13. Selected published weekly anchors are retained; values between anchors are interpolated.
- ISA Brown cage points are disabled when housing is unknown or does not match cage housing.
- W-80 and W-80 Plus selected age-specific min/max ranges are now transcribed from their official April 2026 conventional-system performance tables. The range is retained; the midpoint is not treated as the only valid target. Interpolation between listed ages is derived, and the UI/provenance marks it as interpolated.
- W-80 Pro currently has no active numerical curve until its exact official tables are extracted and validated. Other profiles still require source-by-source auditing; management fallback must never be presented as an official strain curve.
- Sources: ISA cage guide https://www.isa-poultry.com/documents/1399/ISA_Brown_EU_CS_product_guide_cage_EN_L6230-1.pdf ; ISA alternative guide https://www.isa-poultry.com/documents/2591/ISA_Brown_EU_CS_product_guide_alternative_EN_L6230-1.pdf ; Hy-Line official literature https://www.hyline.com/literature ; current W-80 Plus guide https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80PLUS%20STD%20ENG.pdf ; EFSA welfare opinion https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.7789 ; FCR paper https://doi.org/10.1016/j.psj.2024.104013 ; egg-production model https://doi.org/10.1016/j.animal.2023.101015 .

## Portability and scale
- Keep Layer UI, engines, migrations, tests and source registry in the `layer-*` namespace; avoid shared generic files unless separately reviewed.
- Stable UUIDs and ISO dates are data keys; Jalali values are display labels.
- Weekly/monthly summaries are rebuildable. Period sync removes stale summaries after a daily row is deleted or re-dated.
- Index pattern `(flock_id, record_date)` supports per-flock scans. Do not partition preemptively; monitor row counts, query latency, index use and backup/restore duration first.
- For a future separate project, define an export/import contract for Layer tables and migrations, standard/source metadata, engine versions, flock identity snapshots and explicit farm/house/user ID mapping. Verify row counts, foreign keys, unique daily keys and KPI recomputation before cutover.
- Production migrations should be applied only after code review; verify the live schema and test changes before deployment.
