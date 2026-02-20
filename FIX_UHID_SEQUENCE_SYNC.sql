-- ==========================================
-- FIX UHID SEQUENCE SYNCHRONIZATION
-- Run this in Supabase SQL Editor to fix duplicate UHID errors
-- Date: February 20, 2026
-- ==========================================

-- This script synchronizes the UHID sequence with the actual maximum UHID in the database
-- to prevent duplicate key constraint violations

-- Step 1: Find the maximum UHID sequence number currently in the database
DO $$
DECLARE
    max_sequence INTEGER := 0;
    current_year TEXT;
    uhid_pattern TEXT;
BEGIN
    -- Get current year
    current_year := TO_CHAR(NOW(), 'YYYY');
    uhid_pattern := 'MH-' || current_year || '-%';

    -- Extract maximum sequence from existing UHIDs for current year
    SELECT COALESCE(MAX(
        CASE
            WHEN uhid ~ '^MH-[0-9]{4}-[0-9]{6}$' THEN
                CAST(SUBSTRING(uhid FROM '[0-9]{6}$') AS INTEGER)
            ELSE 0
        END
    ), 0)
    INTO max_sequence
    FROM patients
    WHERE uhid LIKE uhid_pattern;

    RAISE NOTICE 'Maximum UHID sequence found in database for year %: %', current_year, max_sequence;

    -- Update the uhid_config to use the next sequence number
    UPDATE uhid_config
    SET current_sequence = max_sequence,
        updated_at = NOW()
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    RAISE NOTICE 'Updated uhid_config.current_sequence to: %', max_sequence;
    RAISE NOTICE 'Next UHID will be: MH-%-%', current_year, LPAD((max_sequence + 1)::TEXT, 6, '0');
END $$;

-- Step 2: Verify the fix
SELECT
    '✅ Current UHID Config' as status,
    prefix,
    current_sequence,
    prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((current_sequence + 1)::TEXT, 6, '0') as next_uhid
FROM uhid_config
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 3: Test generate a new UHID (this will increment the sequence)
-- Uncomment to test:
-- SELECT 'Test UHID:' as label, generate_uhid() as uhid;

-- Step 4: Show existing patients with UHIDs for current year
SELECT
    '📋 Recent Patients with UHIDs' as status,
    uhid,
    first_name,
    last_name,
    created_at
FROM patients
WHERE uhid LIKE 'MH-' || TO_CHAR(NOW(), 'YYYY') || '-%'
ORDER BY uhid DESC
LIMIT 10;

-- Success message
SELECT '🎉 UHID Sequence Synchronized!' as message,
       'The UHID sequence is now in sync with existing patient data.' as status,
       'Try creating a new patient now.' as next_step;
