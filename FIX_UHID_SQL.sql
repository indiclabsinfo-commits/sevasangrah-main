-- FIX UHID SYSTEM - Run this in Supabase SQL Editor
-- Date: February 16, 2026
-- Purpose: Fix missing UHID tables and columns

-- ============================================
-- PART 1: Create uhid_config table
-- ============================================

-- Create uhid_config table
CREATE TABLE IF NOT EXISTS uhid_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix VARCHAR(10) NOT NULL DEFAULT 'MH',
    year_format VARCHAR(10) NOT NULL DEFAULT 'YYYY',
    current_sequence INTEGER NOT NULL DEFAULT 0,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on hospital_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_uhid_config_hospital_id ON uhid_config(hospital_id);

-- Insert initial configuration row
INSERT INTO uhid_config (prefix, year_format, current_sequence, hospital_id)
SELECT 'MH', 'YYYY', 0, '550e8400-e29b-41d4-a716-446655440000'
WHERE NOT EXISTS (
    SELECT 1 FROM uhid_config WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- ============================================
-- PART 2: Create generate_uhid function
-- ============================================

CREATE OR REPLACE FUNCTION generate_uhid(p_hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000')
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_sequence INTEGER;
    v_year VARCHAR(4);
    v_uhid VARCHAR(20);
BEGIN
    -- Update sequence and get new value atomically
    UPDATE uhid_config
    SET current_sequence = current_sequence + 1,
        updated_at = NOW()
    WHERE hospital_id = p_hospital_id
    RETURNING prefix, current_sequence INTO v_prefix, v_sequence;
    
    -- If no config exists, create one
    IF NOT FOUND THEN
        INSERT INTO uhid_config (prefix, year_format, current_sequence, hospital_id)
        VALUES ('MH', 'YYYY', 1, p_hospital_id)
        RETURNING prefix, current_sequence INTO v_prefix, v_sequence;
    END IF;
    
    -- Get current year
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Format UHID: MH-2026-000001
    v_uhid := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
    
    RETURN v_uhid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Add uhid column to patients table
-- ============================================

-- Add uhid column to patients table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'uhid'
    ) THEN
        ALTER TABLE patients ADD COLUMN uhid VARCHAR(20) UNIQUE;
        CREATE INDEX idx_patients_uhid ON patients(uhid);
    END IF;
END $$;

-- ============================================
-- PART 4: Test the fix
-- ============================================

-- Test 1: Verify table was created
SELECT '✅ uhid_config table check' as test,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uhid_config') as table_exists,
       (SELECT COUNT(*) FROM uhid_config) as row_count;

-- Test 2: Verify function exists
SELECT '✅ generate_uhid function check' as test,
       EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'generate_uhid' 
           AND routine_type = 'FUNCTION'
       ) as function_exists;

-- Test 3: Verify uhid column in patients table
SELECT '✅ patients.uhid column check' as test,
       EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'patients' AND column_name = 'uhid'
       ) as column_exists;

-- Test 4: Generate a test UHID
SELECT '✅ Test UHID generation' as test, generate_uhid() as generated_uhid;

-- ============================================
-- PART 5: Comments for documentation
-- ============================================

COMMENT ON TABLE uhid_config IS 'Stores UHID (Unique Hospital ID) generation configuration';
COMMENT ON COLUMN uhid_config.prefix IS 'Prefix for UHID (e.g., MH for Magnus Hospital)';
COMMENT ON COLUMN uhid_config.year_format IS 'Year format in UHID (YYYY or YY)';
COMMENT ON COLUMN uhid_config.current_sequence IS 'Current sequence number for UHID generation';
COMMENT ON FUNCTION generate_uhid IS 'Atomically generates a new UHID and increments sequence';

-- ============================================
-- FINAL MESSAGE
-- ============================================

SELECT '🎉 UHID SYSTEM FIX COMPLETE' as message,
       'Run the tests above to verify all components are working.' as next_step,
       'Then test the patient registration form in the application.' as action;