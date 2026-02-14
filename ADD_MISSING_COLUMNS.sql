
-- 🛠️ Fix: Add ALL potential missing columns for Patient Registration
-- This script ensures the database schema matches the backend code perfectly.

-- 1. Identity Columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS abha_id VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS rghs_number VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);

-- 2. Assignment Columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor VARCHAR(255);

-- 3. Date Columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_entry DATE;

-- 4. Queue / OPD Columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_no INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_status VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS has_pending_appointment BOOLEAN;

-- 5. Reference Columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS has_reference BOOLEAN;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS reference_details VARCHAR(255);

-- Optional: Add comments
COMMENT ON COLUMN patients.aadhaar_number IS 'Unique Identification Authority of India (UIDAI) number';
COMMENT ON COLUMN patients.abha_id IS 'Ayushman Bharat Health Account (ABHA) ID';
COMMENT ON COLUMN patients.queue_no IS 'OPD Queue Number';
COMMENT ON COLUMN patients.queue_status IS 'Status in OPD Queue (waiting, completed, etc)';

-- Verify everything
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN (
    'aadhaar_number', 'abha_id', 'photo_url', 
    'assigned_department', 'assigned_doctor', 
    'date_of_birth', 'date_of_entry',
    'queue_no', 'queue_status', 'queue_date', 'has_pending_appointment',
    'has_reference', 'reference_details'
);