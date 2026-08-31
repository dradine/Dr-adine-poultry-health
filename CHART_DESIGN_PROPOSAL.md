# Weekly report chart design

This document records a visual-only redesign. It does not alter FCR calculations, management targets, official standards, or database data.

## Chart mapping
- Weight vs official standard: time-series line + points. Two series on one numeric scale.
- Weekly weight gain vs official standard gain: paired dot/dumbbell comparison by week. This emphasizes the gap between actual and reference while preserving the weekly category order.
- Cumulative FCR vs official cumulative FCR: time-series line + points ONLY when an actual cumulative-FCR field exists in the source rows. No synthetic cumulative FCR is generated.
- Weekly FCR vs management target: paired dot/dumbbell comparison by week. Lower FCR is better; the actual and target points are explicitly labeled.

## Rendering rules
- Never display a transformed difference as the Y-axis value of the actual/reference series.
- No negative axis floor for weight or FCR merely to create visual padding.
- Axis bounds are derived from plotted values with modest padding; zero is not forced for weight/FCR.
- Actual and reference/target use distinct visual encodings, with direct labels where the number of weeks is small.
- Use large Persian-capable typography, high line/point weights, restrained grid lines, and responsive sizing.
- The chart layer consumes existing values only; it does not compute or persist new poultry metrics.
