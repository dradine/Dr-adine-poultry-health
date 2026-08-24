# Weekly & Report V3 Audit

## Design decisions
- Weekly entry is type-aware: broiler, pullet, layer, breeder.
- Primary metrics are visually separated from advanced metrics.
- Report starts with an executive dashboard, then detailed charts/tables.
- Score vocabulary: عالی، خوب، قابل قبول، مرز هشدار، ضعیف، خیلی ضعیف.
- Official breeder/genetic targets are preferred where available; management thresholds are explicitly labeled when no genetic target is available.
- Farm lifecycle is derived from active flocks; closing the last active flock makes the farm inactive, while inserting a new active flock reactivates it.

## Scientific basis reviewed
- Aviagen Ross Broiler Handbook 2025: weight/uniformity, water/feed ratio, environmental monitoring and record keeping.
- Hy-Line flock monitoring: weekly body weight, uniformity/CV, mortality, egg production, egg mass, FCR and daily/weekly record keeping.
- Aviagen breeder material: body weight/uniformity, egg production, fertility/hatchability, egg weight and environmental/mating factors.
- Cobb breeder material: male/female body weight, sexual synchronization, fertility/hatchability and breeder performance.
