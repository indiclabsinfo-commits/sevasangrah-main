-- seed_doctors.sql
-- Run this in Supabase SQL Editor to populate the doctors table
-- so that the Doctor dropdown in New Patient Entry shows correctly.

-- Step 1: Make sure is_active column exists
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;

-- Step 2: Mark all existing doctors as active
UPDATE doctors SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- Step 3: Insert Dr. Naveen if no doctors exist
INSERT INTO doctors (first_name, last_name, department, specialization, consultation_fee, is_active)
SELECT 'Naveen', 'Kumar', 'General Medicine', 'General Physician', 300, true
WHERE NOT EXISTS (SELECT 1 FROM doctors LIMIT 1);

-- Step 4: Show current state
SELECT id, first_name, last_name, department, is_active FROM doctors;
