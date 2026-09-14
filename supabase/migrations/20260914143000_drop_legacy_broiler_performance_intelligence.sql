-- Remove the legacy Broiler Performance Intelligence database resolver.
-- This migration intentionally does NOT touch weekly reporting, comprehensive reporting,
-- comparison/benchmarking, or any canonical production/FCR calculation.
-- The intelligence layer will be rebuilt from zero later.

DROP FUNCTION IF EXISTS public.calculate_performance_intelligence(uuid, date, integer, text, numeric, text, text, text);
