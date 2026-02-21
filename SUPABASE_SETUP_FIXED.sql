-- ==========================================
-- COMPLETE SUPABASE DATABASE SETUP (FIXED)
-- Run this ENTIRE script in Supabase SQL Editor
-- ==========================================

-- PART 1: FIX UHID SEQUENCE
DO $$
DECLARE
    max_sequence INTEGER := 0;
    current_year TEXT;
    uhid_pattern TEXT;
BEGIN
    RAISE NOTICE 'Step 1: Fixing UHID sequence...';

    current_year := TO_CHAR(NOW(), 'YYYY');
    uhid_pattern := 'MH-' || current_year || '-%';

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

    UPDATE uhid_config
    SET current_sequence = max_sequence,
        updated_at = NOW()
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    RAISE NOTICE 'UHID sequence fixed! Current: %, Next: MH-%-% ',
        max_sequence, current_year, LPAD((max_sequence + 1)::TEXT, 6, '0');
END $$;

-- PART 2: VERIFY TABLES
DO $$
BEGIN
    RAISE NOTICE 'Step 2: Verifying tables...';

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        RAISE EXCEPTION 'patients table missing!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opd_queue') THEN
        RAISE EXCEPTION 'opd_queue table missing!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uhid_config') THEN
        RAISE EXCEPTION 'uhid_config table missing!';
    END IF;

    RAISE NOTICE 'All tables verified!';
END $$;

-- PART 3: ENSURE UHID COLUMN
DO $$
BEGIN
    RAISE NOTICE 'Step 3: Checking UHID column...';

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'uhid'
    ) THEN
        ALTER TABLE patients ADD COLUMN uhid VARCHAR(20) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
        RAISE NOTICE 'UHID column added';
    ELSE
        RAISE NOTICE 'UHID column exists';
    END IF;
END $$;

-- PART 4: CREATE INDEXES
DO $$
BEGIN
    RAISE NOTICE 'Step 4: Creating indexes...';
END $$;

CREATE INDEX IF NOT EXISTS idx_opd_queue_patient_id ON opd_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_id ON opd_queue(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

DO $$
BEGIN
    RAISE NOTICE 'Indexes created!';
END $$;

-- PART 5: DISABLE RLS
DO $$
BEGIN
    RAISE NOTICE 'Step 5: Disabling RLS...';
END $$;

ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE opd_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE future_appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE uhid_config DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON patients;

DO $$
BEGIN
    RAISE NOTICE 'RLS disabled!';
END $$;

-- PART 6: GRANT PERMISSIONS
DO $$
BEGIN
    RAISE NOTICE 'Step 6: Granting permissions...';
END $$;

GRANT ALL ON TABLE patients TO authenticated;
GRANT ALL ON TABLE opd_queue TO authenticated;
GRANT ALL ON TABLE future_appointments TO authenticated;
GRANT ALL ON TABLE uhid_config TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT SELECT, INSERT ON TABLE patients TO anon;
GRANT SELECT, INSERT ON TABLE opd_queue TO anon;

DO $$
BEGIN
    RAISE NOTICE 'Permissions granted!';
END $$;

-- FINAL SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'UHID sequence synchronized';
    RAISE NOTICE 'All tables verified';
    RAISE NOTICE 'Indexes created';
    RAISE NOTICE 'RLS disabled for development';
    RAISE NOTICE 'Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE 'YOUR OPD MODULE IS READY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Test patient registration';
    RAISE NOTICE '';
END $$;
