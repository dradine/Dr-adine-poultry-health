-- ADINEH TEMPORARY BENCHMARK TEST DATA CLEANUP
-- Removes ONLY the 80 temporary Benchmark farms identified by farm_code.
-- Run this after testing is finished.
BEGIN;

DO $$
DECLARE
    n integer;
BEGIN
    SELECT count(*) INTO n
    FROM public.farms
    WHERE farm_code LIKE 'TEST-BM-ADINEH-%';

    IF n <> 80 THEN
        RAISE EXCEPTION 'Expected exactly 80 Benchmark test farms, found %; cleanup aborted.', n;
    END IF;
END $$;

DELETE FROM public.farms
WHERE farm_code LIKE 'TEST-BM-ADINEH-%';

COMMIT;
