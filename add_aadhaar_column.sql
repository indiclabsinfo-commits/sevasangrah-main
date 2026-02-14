
-- 🛠️ Fix: Add missing Aadhaar Number column
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(255);

-- Optional: Add a comment to the column
COMMENT ON COLUMN patients.aadhaar_number IS 'Unique Identification Authority of India (UIDAI) number';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'aadhaar_number';
