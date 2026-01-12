-- Migration: Add Aadhaar columns to patients table
-- Description: Stores Aadhaar number and verification status for NABH compliance
-- Date: 2026-01-13

-- Add aadhaar_number column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'aadhaar_number'
    ) THEN
        ALTER TABLE patients ADD COLUMN aadhaar_number VARCHAR(12);
    END IF;
END $$;

-- Add aadhaar_verified column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'aadhaar_verified'
    ) THEN
        ALTER TABLE patients ADD COLUMN aadhaar_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add aadhaar_verified_at column for audit
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'aadhaar_verified_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN aadhaar_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index on aadhaar_number for lookups
CREATE INDEX IF NOT EXISTS idx_patients_aadhaar ON patients(aadhaar_number) WHERE aadhaar_number IS NOT NULL;

-- Create function to validate Aadhaar format (12 digits with Verhoeff checksum)
CREATE OR REPLACE FUNCTION validate_aadhaar(aadhaar VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    d INTEGER[][] := ARRAY[
        ARRAY[0,1,2,3,4,5,6,7,8,9],
        ARRAY[1,2,3,4,0,6,7,8,9,5],
        ARRAY[2,3,4,0,1,7,8,9,5,6],
        ARRAY[3,4,0,1,2,8,9,5,6,7],
        ARRAY[4,0,1,2,3,9,5,6,7,8],
        ARRAY[5,9,8,7,6,0,4,3,2,1],
        ARRAY[6,5,9,8,7,1,0,4,3,2],
        ARRAY[7,6,5,9,8,2,1,0,4,3],
        ARRAY[8,7,6,5,9,3,2,1,0,4],
        ARRAY[9,8,7,6,5,4,3,2,1,0]
    ];
    p INTEGER[][] := ARRAY[
        ARRAY[0,1,2,3,4,5,6,7,8,9],
        ARRAY[1,5,7,6,2,8,3,0,9,4],
        ARRAY[5,8,0,3,7,9,6,1,4,2],
        ARRAY[8,9,1,6,0,4,3,5,2,7],
        ARRAY[9,4,5,3,1,2,6,8,7,0],
        ARRAY[4,2,8,6,5,7,3,9,0,1],
        ARRAY[2,7,9,3,8,0,6,4,1,5],
        ARRAY[7,0,4,6,9,1,3,2,5,8]
    ];
    c INTEGER := 0;
    i INTEGER;
    digit INTEGER;
BEGIN
    -- Check if aadhaar is 12 digits
    IF aadhaar IS NULL OR LENGTH(aadhaar) != 12 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all characters are digits
    IF aadhaar !~ '^[0-9]{12}$' THEN
        RETURN FALSE;
    END IF;
    
    -- First digit should not be 0 or 1
    IF SUBSTRING(aadhaar, 1, 1) IN ('0', '1') THEN
        RETURN FALSE;
    END IF;
    
    -- Verhoeff checksum validation
    FOR i IN REVERSE 12..1 LOOP
        digit := CAST(SUBSTRING(aadhaar, i, 1) AS INTEGER);
        c := d[c + 1][p[((12 - i) % 8) + 1][digit + 1] + 1];
    END LOOP;
    
    RETURN c = 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to mask Aadhaar for display (XXXX-XXXX-1234)
CREATE OR REPLACE FUNCTION mask_aadhaar(aadhaar VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF aadhaar IS NULL OR LENGTH(aadhaar) != 12 THEN
        RETURN NULL;
    END IF;
    RETURN 'XXXX-XXXX-' || SUBSTRING(aadhaar, 9, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON COLUMN patients.aadhaar_number IS '12-digit Aadhaar card number (stored without formatting)';
COMMENT ON COLUMN patients.aadhaar_verified IS 'Whether Aadhaar has been verified via UIDAI';
COMMENT ON COLUMN patients.aadhaar_verified_at IS 'Timestamp of Aadhaar verification';
COMMENT ON FUNCTION validate_aadhaar IS 'Validates Aadhaar number format and Verhoeff checksum';
COMMENT ON FUNCTION mask_aadhaar IS 'Returns masked Aadhaar for display (XXXX-XXXX-1234)';
