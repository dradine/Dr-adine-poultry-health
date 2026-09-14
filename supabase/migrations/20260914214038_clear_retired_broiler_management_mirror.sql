-- Broiler management targets are now part of BROILER-CANONICAL-STANDARDS-V2.
-- The generic benchmark table remains available to other production domains,
-- but it must not retain a competing broiler target set.
DELETE FROM public.poultry_management_benchmarks
WHERE lower(trim(production_type))='broiler';
