-- Legacy Broiler Performance Intelligence is being rebuilt from zero.
-- Remove only the old intelligence resolver; canonical weekly/report calculations remain untouched.
DROP FUNCTION IF EXISTS public.calculate_performance_intelligence(uuid, date, integer, text, numeric, text, text, text);
