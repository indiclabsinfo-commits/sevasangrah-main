-- ==========================================
-- FIX PATIENT REGISTRATION ISSUES
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Ensure Hospitals table exists and has the default hospital
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default hospital if not exists (handling both IDs to be safe)
INSERT INTO hospitals (id, name, address, phone, email)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Seva Sangrah Hospital', 'General Hospital Address', '0000000000', 'admin@hospital.com')
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure uhid_config table exists
CREATE TABLE IF NOT EXISTS uhid_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    prefix TEXT DEFAULT 'MH',
    current_sequence INT DEFAULT 0,
    year_format TEXT DEFAULT 'YYYY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hospital_id)
);

-- 3. Ensure generate_uhid function exists
CREATE OR REPLACE FUNCTION generate_uhid(p_hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT;
    v_sequence INT;
    v_uhid TEXT;
    v_prefix TEXT;
BEGIN
    -- Get current year
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get or create configuration
    INSERT INTO uhid_config (hospital_id, current_sequence, year_format, prefix)
    VALUES (p_hospital_id, 0, 'YYYY', 'MH')
    ON CONFLICT (hospital_id) DO NOTHING;
    
    -- Lock and increment sequence
    UPDATE uhid_config
    SET current_sequence = current_sequence + 1,
        updated_at = NOW()
    WHERE hospital_id = p_hospital_id
    RETURNING current_sequence, prefix INTO v_sequence, v_prefix;
    
    -- Format: PREFIX-YYYY-SEQ (e.g. MH-2024-000001)
    v_uhid := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
    
    RETURN v_uhid;
END;
$$;

-- 4. Grant permissions
GRANT ALL ON TABLE hospitals TO authenticated;
GRANT ALL ON TABLE uhid_config TO authenticated;
GRANT ALL ON FUNCTION generate_uhid TO authenticated;
GRANT ALL ON TABLE patients TO authenticated;
GRANT ALL ON TABLE transactions TO authenticated;
