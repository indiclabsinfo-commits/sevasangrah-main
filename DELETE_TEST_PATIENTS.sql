-- Delete test patients and reset for fresh start
-- Safe to run multiple times

-- Step 1: Delete from queue first (foreign key)
DELETE FROM opd_queue WHERE patient_id IN (
    SELECT id FROM patients WHERE patient_id LIKE 'P%'
);

-- Step 2: Delete test patients
DELETE FROM patients WHERE patient_id LIKE 'P%';

-- Step 3: Verify deletion
SELECT
    'Cleanup Complete' as status,
    COUNT(*) as remaining_patients
FROM patients;

-- Step 4: Show what patient_id will be next
SELECT
    'Next patient_id will be' as info,
    'P000001' as next_id;
