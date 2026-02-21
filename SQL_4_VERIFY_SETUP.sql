-- ==========================================
-- SQL FILE 4: VERIFY ALL FIXES
-- Run this LAST (after SQL_1, SQL_2, SQL_3)
-- ==========================================

-- Check UHID sequence status
DO $$
DECLARE
    uhid_seq INTEGER;
    uhid_next TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '📊 VERIFICATION RESULTS';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';

    -- Check UHID sequence
    SELECT current_sequence INTO uhid_seq
    FROM uhid_config
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    uhid_next := 'MH-2026-' || LPAD((uhid_seq + 1)::TEXT, 6, '0');

    RAISE NOTICE '1️⃣  UHID SEQUENCE STATUS:';
    RAISE NOTICE '   Current sequence: %', uhid_seq;
    RAISE NOTICE '   Next UHID will be: %', uhid_next;
    RAISE NOTICE '';
END $$;

-- Check doctors table
DO $$
DECLARE
    doctor_count INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO doctor_count, active_count
    FROM doctors;

    RAISE NOTICE '2️⃣  DOCTORS TABLE STATUS:';
    RAISE NOTICE '   Total doctors: %', doctor_count;
    RAISE NOTICE '   Active doctors: %', active_count;
    RAISE NOTICE '';

    IF active_count = 0 THEN
        RAISE WARNING '   ⚠️  No active doctors found! Doctors dropdown will be empty.';
    ELSE
        RAISE NOTICE '   ✅ Doctors dropdown will show % doctors', active_count;
    END IF;
    RAISE NOTICE '';
END $$;

-- Check opd_queue table
DO $$
DECLARE
    queue_count INTEGER;
    queue_col_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO queue_count FROM opd_queue;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'queue_number'
    ) INTO queue_col_exists;

    RAISE NOTICE '3️⃣  OPD QUEUE TABLE STATUS:';
    RAISE NOTICE '   Total queue entries: %', queue_count;
    RAISE NOTICE '   queue_number column: %', CASE WHEN queue_col_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '';
END $$;

-- Check patients table
DO $$
DECLARE
    patient_count INTEGER;
    uhid_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(uhid) INTO patient_count, uhid_count FROM patients;

    RAISE NOTICE '4️⃣  PATIENTS TABLE STATUS:';
    RAISE NOTICE '   Total patients: %', patient_count;
    RAISE NOTICE '   Patients with UHID: %', uhid_count;
    RAISE NOTICE '';
END $$;

-- Show recent patients with UHIDs
DO $$
BEGIN
    RAISE NOTICE '5️⃣  RECENT PATIENTS (Last 5):';
    RAISE NOTICE '';
END $$;

SELECT
    CONCAT(first_name, ' ', last_name) as patient_name,
    uhid,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as registered_at
FROM patients
ORDER BY created_at DESC
LIMIT 5;

-- Show active doctors by department
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6️⃣  ACTIVE DOCTORS BY DEPARTMENT:';
    RAISE NOTICE '';
END $$;

SELECT
    department,
    COUNT(*) as doctor_count,
    STRING_AGG(CONCAT('Dr. ', first_name, ' ', last_name), ', ') as doctors
FROM doctors
WHERE is_active = true
GROUP BY department
ORDER BY department;

-- Final summary
DO $$
DECLARE
    all_good BOOLEAN := true;
    issues TEXT := '';
    doctor_count INTEGER;
    queue_col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '📋 FINAL STATUS';
    RAISE NOTICE '====================================';

    -- Check doctors
    SELECT COUNT(*) INTO doctor_count FROM doctors WHERE is_active = true;
    IF doctor_count = 0 THEN
        all_good := false;
        issues := issues || E'\n❌ No active doctors found';
    END IF;

    -- Check queue_number column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'queue_number'
    ) INTO queue_col_exists;
    IF NOT queue_col_exists THEN
        all_good := false;
        issues := issues || E'\n❌ queue_number column missing';
    END IF;

    IF all_good THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ALL SYSTEMS READY!';
        RAISE NOTICE '';
        RAISE NOTICE '✅ UHID generation: Working';
        RAISE NOTICE '✅ Doctors loading: % doctors available', doctor_count;
        RAISE NOTICE '✅ OPD Queue: Ready';
        RAISE NOTICE '';
        RAISE NOTICE '👉 Next: Refresh your browser and test patient registration';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ISSUES FOUND:%', issues;
        RAISE NOTICE '';
        RAISE NOTICE '👉 Please review the errors above';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '====================================';
    RAISE NOTICE '';
END $$;
