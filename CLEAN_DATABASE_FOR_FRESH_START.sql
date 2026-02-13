-- =============================================================================
-- SAFE DATABASE CLEANUP SCRIPT
-- This clears ALL patient/transaction data for a fresh start
-- ONLY run this on YOUR NEW Supabase instance
-- =============================================================================

-- ⚠️ WARNING: This will DELETE all patient data, transactions, and related records
-- ⚠️ This will NOT affect:
--    - User accounts (admin, doctors, staff)
--    - Departments
--    - Doctors
--    - Beds
--    - System configuration

-- =============================================================================
-- STEP 1: Verify you're on the correct database
-- =============================================================================

-- Check your Supabase URL - make sure it matches YOUR new instance
-- Expected: plkbxjedbjpmbfrekmrr.supabase.co
SELECT 
    'Current Database' as info,
    current_database() as database_name,
    current_user as user_name;

-- STOP HERE and verify the database name before proceeding!
-- If this is NOT your new Supabase instance, DO NOT CONTINUE!

-- =============================================================================
-- STEP 2: Count existing records (BEFORE cleanup)
-- =============================================================================

SELECT 'BEFORE CLEANUP - Record Counts' as status;

SELECT 
    'Patients' as table_name, 
    COUNT(*) as record_count 
FROM patients
UNION ALL
SELECT 'Patient Transactions', COUNT(*) FROM patient_transactions
UNION ALL
SELECT 'Patient Admissions', COUNT(*) FROM patient_admissions
UNION ALL
SELECT 'OPD Queue', COUNT(*) FROM opd_queue
UNION ALL
SELECT 'OPD Consultations', COUNT(*) FROM opd_consultations
UNION ALL
SELECT 'Patient Vitals', COUNT(*) FROM patient_vitals
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Bills', COUNT(*) FROM bills
UNION ALL
SELECT 'Future Appointments', COUNT(*) FROM future_appointments
UNION ALL
SELECT 'IPD Services', COUNT(*) FROM ipd_services
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Patient Refunds', COUNT(*) FROM patient_refunds
UNION ALL
SELECT 'Daily Expenses', COUNT(*) FROM daily_expenses;

-- =============================================================================
-- STEP 3: DELETE patient-related data (CASCADE will handle relationships)
-- =============================================================================

-- This is the SAFE way - deletes in correct order to respect foreign keys
-- The CASCADE on foreign keys will automatically delete related records

BEGIN;

-- Delete patient-related data (this will cascade to all related tables)
DELETE FROM patients;

-- Delete orphaned records (if any)
DELETE FROM daily_expenses;
DELETE FROM opd_queue WHERE patient_id IS NULL;

-- Reset any auto-increment sequences (if needed)
-- Note: UUID-based tables don't need sequence reset

COMMIT;

-- =============================================================================
-- STEP 4: Verify cleanup (AFTER cleanup)
-- =============================================================================

SELECT 'AFTER CLEANUP - Record Counts' as status;

SELECT 
    'Patients' as table_name, 
    COUNT(*) as record_count 
FROM patients
UNION ALL
SELECT 'Patient Transactions', COUNT(*) FROM patient_transactions
UNION ALL
SELECT 'Patient Admissions', COUNT(*) FROM patient_admissions
UNION ALL
SELECT 'OPD Queue', COUNT(*) FROM opd_queue
UNION ALL
SELECT 'OPD Consultations', COUNT(*) FROM opd_consultations
UNION ALL
SELECT 'Patient Vitals', COUNT(*) FROM patient_vitals
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Bills', COUNT(*) FROM bills
UNION ALL
SELECT 'Future Appointments', COUNT(*) FROM future_appointments
UNION ALL
SELECT 'IPD Services', COUNT(*) FROM ipd_services
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Patient Refunds', COUNT(*) FROM patient_refunds
UNION ALL
SELECT 'Daily Expenses', COUNT(*) FROM daily_expenses;

-- =============================================================================
-- STEP 5: Verify system data is intact
-- =============================================================================

SELECT 'SYSTEM DATA - Should NOT be deleted' as status;

SELECT 
    'Users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'Beds', COUNT(*) FROM beds
UNION ALL
SELECT 'Medicines', COUNT(*) FROM medicines;

-- =============================================================================
-- STEP 6: Reset bed status to AVAILABLE
-- =============================================================================

UPDATE beds 
SET status = 'AVAILABLE' 
WHERE status = 'OCCUPIED';

SELECT 
    '✅ CLEANUP COMPLETE!' as status,
    'All patient data cleared. System data (users, departments, doctors, beds) preserved.' as message;

-- =============================================================================
-- OPTIONAL: Reset patient ID counter (if you want to start from P000001 again)
-- =============================================================================

-- Uncomment the following if you want to reset the patient ID sequence
-- This is only needed if you have a patient_id_sequence table

/*
UPDATE patient_id_config 
SET last_patient_number = 0 
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
*/
