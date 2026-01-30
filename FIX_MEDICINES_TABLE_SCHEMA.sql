-- Fix Medicines Table Schema
-- This script adds missing columns to the medicines table and ensures compatibility
-- with all INSERT statements

-- Step 1: Add missing columns if they don't exist
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS dosage_form TEXT,
ADD COLUMN IF NOT EXISTS strength TEXT,
ADD COLUMN IF NOT EXISTS hospital_id UUID;

-- Step 2: Set default hospital_id for existing records
UPDATE medicines 
SET hospital_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE hospital_id IS NULL;

-- Step 3: Make unit_price nullable for compatibility
ALTER TABLE medicines 
ALTER COLUMN unit_price DROP NOT NULL,
ALTER COLUMN unit_price SET DEFAULT 0;

-- Step 4: Create index for hospital_id
CREATE INDEX IF NOT EXISTS idx_medicines_hospital_id ON medicines(hospital_id);

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medicines' 
ORDER BY ordinal_position;
