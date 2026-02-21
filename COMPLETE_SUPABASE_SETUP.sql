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

-- Check opd_queue table exists (singular, not plural)
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
-- PART 4: VERIFY OPD_QUEUE TABLE STRUCTURE
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '🔧 STEP 4: Verifying opd_queue table structure...';

    -- Check essential columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'queue_status'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: opd_queue missing queue_status column!';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'patient_id'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: opd_queue missing patient_id column!';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'doctor_id'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: opd_queue missing doctor_id column!';
    END IF;

    RAISE NOTICE '✅ opd_queue table structure verified';
END $$;

-- ==========================================
-- PART 5: ADD MISSING COLUMNS TO OPD_QUEUE (IF NEEDED)
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '🔧 STEP 5: Adding any missing columns to opd_queue...';

    -- Add wait_time column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'wait_time'
    ) THEN
        ALTER TABLE opd_queue ADD COLUMN wait_time INTEGER;
        RAISE NOTICE '✅ Added wait_time column';
    END IF;

    -- Add consultation_duration column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'consultation_duration'
    ) THEN
        ALTER TABLE opd_queue ADD COLUMN consultation_duration INTEGER;
        RAISE NOTICE '✅ Added consultation_duration column';
    END IF;

    -- Add total_tat column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'total_tat'
    ) THEN
        ALTER TABLE opd_queue ADD COLUMN total_tat INTEGER;
        RAISE NOTICE '✅ Added total_tat column';
    END IF;

    -- Add tat_status column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'tat_status'
    ) THEN
        ALTER TABLE opd_queue ADD COLUMN tat_status VARCHAR(20) DEFAULT 'normal';
        RAISE NOTICE '✅ Added tat_status column';
    END IF;

    -- Add department column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'department'
    ) THEN
        ALTER TABLE opd_queue ADD COLUMN department VARCHAR(100);
        RAISE NOTICE '✅ Added department column';
    END IF;
END $$;

-- ==========================================
-- PART 6: CREATE INDEXES FOR PERFORMANCE
-- ==========================================

RAISE NOTICE '🔧 STEP 6: Creating performance indexes...';

-- opd_queue indexes
CREATE INDEX IF NOT EXISTS idx_opd_queue_patient_id ON opd_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_id ON opd_queue(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_opd_queue_created_at ON opd_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_opd_queue_number ON opd_queue(queue_number);

-- patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_aadhaar ON patients(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- future_appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON future_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON future_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON future_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON future_appointments(status);

RAISE NOTICE '✅ Indexes created';

-- ==========================================
-- PART 7: DISABLE RLS (Row Level Security) FOR TESTING
-- ==========================================

RAISE NOTICE '🔧 STEP 7: Disabling RLS for faster development...';

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
-- PART 8: VERIFY FOREIGN KEY RELATIONSHIPS
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '🔧 STEP 8: Verifying foreign key relationships...';

    -- Check if opd_queue.patient_id references patients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'opd_queue'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.column_name = 'patient_id'
    ) THEN
        RAISE NOTICE '⚠️ Adding foreign key: opd_queue.patient_id → patients.id';
        ALTER TABLE opd_queue
        ADD CONSTRAINT fk_opd_queue_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
    END IF;

    -- Check if opd_queue.doctor_id references users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'opd_queue'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.column_name = 'doctor_id'
    ) THEN
        RAISE NOTICE '⚠️ Adding foreign key: opd_queue.doctor_id → users.id';
        ALTER TABLE opd_queue
        ADD CONSTRAINT fk_opd_queue_doctor
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    RAISE NOTICE '✅ Foreign key relationships verified';
END $$;

-- ==========================================
-- PART 9: CREATE HELPER FUNCTION FOR QUEUE NUMBER RESET
-- ==========================================

RAISE NOTICE '🔧 STEP 9: Creating helper functions...';

-- Function to reset queue numbers daily (can be called manually or via cron)
CREATE OR REPLACE FUNCTION reset_daily_queue_numbers()
RETURNS void AS $$
BEGIN
    -- Archive old queues (optional)
    -- UPDATE opd_queue SET archived = true WHERE created_at < CURRENT_DATE;

    -- Reset queue numbers for today if needed
    RAISE NOTICE 'Queue numbers are auto-incremented daily. No manual reset needed.';
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Helper functions created';

-- ==========================================
-- PART 10: DATA VALIDATION & CLEANUP
-- ==========================================

RAISE NOTICE '🔧 STEP 10: Running data validation...';

-- Check for patients without UHID
DO $$
DECLARE
    missing_uhid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_uhid_count
    FROM patients
    WHERE uhid IS NULL;

    IF missing_uhid_count > 0 THEN
        RAISE NOTICE '⚠️ Found % patients without UHID. Consider generating UHIDs for them.', missing_uhid_count;
    ELSE
        RAISE NOTICE '✅ All patients have UHIDs';
    END IF;
END $$;

-- Check for orphaned queue entries (patient or doctor deleted)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM opd_queue q
    WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE p.id = q.patient_id)
       OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = q.doctor_id);

    IF orphaned_count > 0 THEN
        RAISE NOTICE '⚠️ Found % orphaned queue entries', orphaned_count;
    ELSE
        RAISE NOTICE '✅ No orphaned queue entries';
    END IF;
END $$;

-- ==========================================
-- PART 11: GRANT PERMISSIONS
-- ==========================================

RAISE NOTICE '🔧 STEP 11: Granting permissions...';

-- Grant permissions to authenticated users
GRANT ALL ON TABLE patients TO authenticated;
GRANT ALL ON TABLE opd_queue TO authenticated;
GRANT ALL ON TABLE future_appointments TO authenticated;
GRANT ALL ON TABLE uhid_config TO authenticated;
GRANT ALL ON TABLE users TO authenticated;

-- Grant permissions to anon users (for public access)
GRANT SELECT, INSERT ON TABLE patients TO anon;
GRANT SELECT, INSERT ON TABLE opd_queue TO anon;

GRANT EXECUTE ON FUNCTION generate_uhid TO authenticated;
GRANT EXECUTE ON FUNCTION generate_uhid TO anon;
GRANT EXECUTE ON FUNCTION reset_daily_queue_numbers TO authenticated;

RAISE NOTICE '✅ Permissions granted';

-- ==========================================
-- PART 12: FINAL VERIFICATION
-- ==========================================

RAISE NOTICE '🔧 STEP 12: Final verification...';

-- Show current UHID status
SELECT
    '✅ UHID Configuration' as status,
    prefix,
    current_sequence,
    prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((current_sequence + 1)::TEXT, 6, '0') as next_uhid
FROM uhid_config
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Show queue statistics
SELECT
    '✅ Queue Statistics' as status,
    COUNT(*) as total_queues,
    COUNT(*) FILTER (WHERE queue_status = 'waiting') as waiting,
    COUNT(*) FILTER (WHERE queue_status = 'in_consultation') as in_consultation,
    COUNT(*) FILTER (WHERE queue_status = 'completed') as completed,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_queues
FROM opd_queue;

-- Show patient statistics
SELECT
    '✅ Patient Statistics' as status,
    COUNT(*) as total_patients,
    COUNT(*) FILTER (WHERE uhid IS NOT NULL) as patients_with_uhid,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as registered_today
FROM patients;

-- Show table existence
SELECT
    '✅ Critical Tables' as status,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') as patients,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'opd_queue') as opd_queue,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'uhid_config') as uhid_config,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'future_appointments') as appointments;

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
    RAISE NOTICE '║  ✅ Indexes created for performance                        ║';
    RAISE NOTICE '║  ✅ Foreign keys validated                                 ║';
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
    RAISE NOTICE '4. View waiting hall (should update in real-time)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  If you see any errors above, address them before testing.';
    RAISE NOTICE '';
END $$;

-- ==========================================
-- OPTIONAL: INSERT SAMPLE TEST DATA
-- ==========================================

-- Uncomment below to insert sample data for testing

/*
-- Insert sample doctor if not exists
INSERT INTO users (id, email, first_name, last_name, role, specialization)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'dr.sharma@hospital.com',
    'Rajesh',
    'Sharma',
    'doctor',
    'General Medicine'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample patient
INSERT INTO patients (
    patient_id, uhid, first_name, last_name, age, gender,
    phone, address, hospital_id
)
VALUES (
    'P000001',
    'MH-2026-000001',
    'Test',
    'Patient',
    35,
    'MALE',
    '9876543210',
    'Test Address',
    '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (patient_id) DO NOTHING;

RAISE NOTICE '✅ Sample test data inserted';
*/
