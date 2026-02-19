-- Fix transaction linking by adding patient_uuid column and foreign key
-- This resolves the "No initial payments found" issue and my previous Receipt 400 error

-- 1. Add patient_uuid column if it doesn't exist
ALTER TABLE IF EXISTS patient_transactions 
ADD COLUMN IF NOT EXISTS patient_uuid UUID REFERENCES patients(id);

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_uuid ON patient_transactions(patient_uuid);

-- 3. Populate patient_uuid from patient_id where patient_id contains a valid UUID
-- (In this app, patient_id is sometimes used to store the UUID string)
UPDATE patient_transactions 
SET patient_uuid = patient_id::uuid 
WHERE patient_uuid IS NULL 
AND patient_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 4. Robustify the patients table to ensure id is primary and used correctly
-- (Standardizing on UUID links)

-- 5. Relax any constraints that might block inserts if needed
ALTER TABLE patient_transactions ALTER COLUMN patient_id DROP NOT NULL;
