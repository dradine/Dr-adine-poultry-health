-- Broiler FCR standards rebuild v2026.2
-- Applied to Supabase project vzcczkavlopznljnnehp.
-- Official cumulative FCR is stored by exact strain and exact age day.
-- Management FCR is deliberately separate and never labelled official.

-- Missing official cumulative curves added:
-- Cobb800: 0.825, 1.046, 1.163, 1.281, 1.400, 1.520, 1.639, 1.762 (days 7..56)
-- Arbor Acres Plus S: same published Plus/Plus S family objective
-- Indian River FF: same published Indian River/Indian River FF objective
-- Hubbard Efficiency Plus: official published weekly points from day 21 onward
-- Hubbard EDGE: official published weekly points from day 21 onward

-- Management weekly FCR: 8 age points for every selectable broiler strain.
-- Where official cumulative FCR + official body weight are available, weekly management
-- FCR is derived from the cumulative curve rather than copied as a genetic standard.
-- Where the official source does not publish enough data, the management profile remains
-- explicitly operational and is not presented as an official breeder objective.

-- The live SQL changes are intentionally kept in Supabase because this migration is a
-- reproducibility record; rerunning against an already-populated database should first
-- remove/replace the affected rows using the unique key defined on poultry_performance_standards.
