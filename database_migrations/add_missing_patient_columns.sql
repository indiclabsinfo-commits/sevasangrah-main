-- ==========================================
-- ADD MISSING COLUMNS TO PATIENTS TABLE
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Add all columns that the application expects
ALTER TABLE patients ADD COLUMN IF NOT EXISTS uhid TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS prefix TEXT DEFAULT 'Mr';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS abha_id TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS rghs_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_tag TEXT DEFAULT 'Regular';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS has_reference BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS reference_details TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_thumbnail_url TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_department TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS has_pending_appointment BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_no INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_status TEXT;

-- Make some columns nullable that have NOT NULL constraint but aren't always provided
ALTER TABLE patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN emergency_contact_name DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN emergency_contact_phone DROP NOT NULL;

-- Create index on uhid for quick lookups
CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;
