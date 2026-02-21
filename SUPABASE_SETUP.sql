-- ==========================================
-- COMPLETE SUPABASE DATABASE SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- Date: February 20, 2026
-- ==========================================

-- This script contains ALL fixes needed for OPD module
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ==========================================
-- PART 1: FIX UHID SEQUENCE SYNCHRONIZATION
-- ==========================================

DO $$
DECLARE
    max_sequence INTEGER := 0;
    current_year TEXT;
    uhid_pattern TEXT;
BEGIN
    RAISE NOTICE '🔧 STEP 1: Fixing UHID sequence...';

    current_year := TO_CHAR(NOW(), 'YYYY');
    uhid_pattern := 'MH-' || current_year || '-%';

    -- Find max UHID sequence from existing patients
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

    -- Update uhid_config sequence
    UPDATE uhid_config
    SET current_sequence = max_sequence,
        updated_at = NOW()
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    RAISE NOTICE '✅ UHID sequence fixed! Current: %, Next will be: MH-%-% ',
        max_sequence, current_year, LPAD((max_sequence + 1)::TEXT, 6, '0');
END $$;

-- ==========================================
-- PART 2: VERIFY CRITICAL TABLES EXIST
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '🔧 STEP 2: Verifying critical tables...';

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opd_queue') THEN
        RAISE EXCEPTION 'CRITICAL: opd_queue table does not exist! Please run OPD schema creation first.';
    ELSE
        RAISE NOTICE '✅ opd_queue table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        RAISE EXCEPTION 'CRITICAL: patients table does not exist!';
    ELSE
        RAISE NOTICE '✅ patients table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uhid_config') THEN
        RAISE EXCEPTION 'CRITICAL: uhid_config table does not exist!';
    ELSE
        RAISE NOTICE '✅ uhid_config table exists';
    END IF;
END $$;

-- ==========================================
-- PART 3: ENSURE UHID COLUMN EXISTS IN PATIENTS
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '🔧 STEP 3: Checking UHID column...';

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'uhid'
    ) THEN
        RAISE NOTICE '⚠️ Adding UHID column to patients table...';
        ALTER TABLE patients ADD COLUMN uhid VARCHAR(20) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
        RAISE NOTICE '✅ UHID column added';
    ELSE
        RAISE NOTICE '✅ UHID column exists';
    END IF;
END $$;

-- ==========================================
-- PART 4: DISABLE RLS (Row Level Security) FOR TESTING
-- ==========================================

RAISE NOTICE '🔧 STEP 4: Disabling RLS for faster development...';

-- Disable RLS on critical tables for development
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE opd_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE future_appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE uhid_config DISABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON patients;

RAISE NOTICE '✅ RLS disabled for development';

-- ==========================================
-- PART 5: GRANT PERMISSIONS
-- ==========================================

RAISE NOTICE '🔧 STEP 5: Granting permissions...';

-- Grant permissions to authenticated users
GRANT ALL ON TABLE patients TO authenticated;
GRANT ALL ON TABLE opd_queue TO authenticated;
GRANT ALL ON TABLE future_appointments TO authenticated;
GRANT ALL ON TABLE uhid_config TO authenticated;
GRANT ALL ON TABLE users TO authenticated;

-- Grant permissions to anon users (for public access)
GRANT SELECT, INSERT ON TABLE patients TO anon;
GRANT SELECT, INSERT ON TABLE opd_queue TO anon;

RAISE NOTICE '✅ Permissions granted';

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                                                            ║';
    RAISE NOTICE '║  🎉 DATABASE SETUP COMPLETE!                               ║';
    RAISE NOTICE '║                                                            ║';
    RAISE NOTICE '║  ✅ UHID sequence synchronized                             ║';
    RAISE NOTICE '║  ✅ All critical tables verified                           ║';
    RAISE NOTICE '║  ✅ RLS disabled for development                           ║';
    RAISE NOTICE '║  ✅ Permissions granted                                    ║';
    RAISE NOTICE '║                                                            ║';
    RAISE NOTICE '║  🚀 YOUR OPD MODULE IS READY FOR TESTING!                  ║';
    RAISE NOTICE '║                                                            ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT STEPS:';
    RAISE NOTICE '1. Test patient registration (UHID should generate)';
    RAISE NOTICE '2. Add patient to OPD queue (should work without errors)';
    RAISE NOTICE '3. Check queue display (should show real data)';
    RAISE NOTICE '';
END $$;
