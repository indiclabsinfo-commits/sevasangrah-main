-- =====================================================
-- Migration: Add UHID (Unique Hospital ID) System
-- Description: Creates UHID generation infrastructure
-- Date: 2024-12-24
-- Author: Development Team
-- Related Feature: FEATURE_001_UHID_Generation
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Add UHID column to patients table
-- =====================================================

-- Add UHID column (nullable first to allow backfilling)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS uhid VARCHAR(20);

-- Create unique index on UHID
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);

-- =====================================================
-- 2. Create UHID configuration table
-- =====================================================

CREATE TABLE IF NOT EXISTS uhid_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_prefix VARCHAR(10) NOT NULL DEFAULT 'MH',
  current_year CHAR(4) NOT NULL,
  sequence_length INTEGER NOT NULL DEFAULT 6,
  include_year BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configuration if not exists
INSERT INTO uhid_config (hospital_prefix, current_year, sequence_length, include_year)
SELECT 'MH', EXTRACT(YEAR FROM NOW())::TEXT, 6, true
WHERE NOT EXISTS (SELECT 1 FROM uhid_config);

-- =====================================================
-- 3. Create sequence for UHID generation
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS uhid_sequence
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 999999999999
  CACHE 20;

-- =====================================================
-- 4. Create UHID generation function
-- =====================================================

CREATE OR REPLACE FUNCTION generate_uhid()
RETURNS VARCHAR(20) AS $$
DECLARE
  config RECORD;
  next_seq BIGINT;
  new_uhid VARCHAR(20);
  uhid_exists BOOLEAN;
BEGIN
  -- Get configuration
  SELECT * INTO config FROM uhid_config ORDER BY created_at DESC LIMIT 1;

  -- Loop to ensure uniqueness (in case of sequence gaps)
  LOOP
    -- Get next sequence number
    next_seq := nextval('uhid_sequence');

    -- Generate UHID based on configuration
    IF config.include_year THEN
      new_uhid := config.hospital_prefix || config.current_year || LPAD(next_seq::TEXT, config.sequence_length, '0');
    ELSE
      new_uhid := config.hospital_prefix || LPAD(next_seq::TEXT, config.sequence_length, '0');
    END IF;

    -- Check if UHID already exists
    SELECT EXISTS(SELECT 1 FROM patients WHERE uhid = new_uhid) INTO uhid_exists;

    -- Exit loop if UHID is unique
    EXIT WHEN NOT uhid_exists;
  END LOOP;

  RETURN new_uhid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Create trigger to auto-generate UHID on insert
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_uhid()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate UHID if not provided
  IF NEW.uhid IS NULL OR NEW.uhid = '' THEN
    NEW.uhid := generate_uhid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_uhid ON patients;
CREATE TRIGGER trigger_auto_generate_uhid
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_uhid();

-- =====================================================
-- 6. Backfill UHIDs for existing patients
-- =====================================================

-- Generate UHIDs for existing patients that don't have one
DO $$
DECLARE
  patient_record RECORD;
BEGIN
  FOR patient_record IN
    SELECT id FROM patients WHERE uhid IS NULL OR uhid = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE patients
    SET uhid = generate_uhid()
    WHERE id = patient_record.id;
  END LOOP;
END $$;

-- =====================================================
-- 7. Make UHID column NOT NULL after backfilling
-- =====================================================

-- Add NOT NULL constraint (all patients should now have UHID)
ALTER TABLE patients
ALTER COLUMN uhid SET NOT NULL;

-- Add check constraint for UHID format
ALTER TABLE patients
ADD CONSTRAINT uhid_format_check
CHECK (uhid ~ '^[A-Z]{2}[0-9]{10,14}$');

-- =====================================================
-- 8. Create UHID audit log table
-- =====================================================

CREATE TABLE IF NOT EXISTS uhid_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid VARCHAR(20) NOT NULL,
  patient_id VARCHAR, -- Match patients.id type (VARCHAR, not UUID)
  action VARCHAR(50) NOT NULL, -- 'GENERATED', 'REGENERATED', 'VALIDATED'
  performed_by UUID, -- May not have users table with UUID
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uhid_audit_log_uhid ON uhid_audit_log(uhid);
CREATE INDEX IF NOT EXISTS idx_uhid_audit_log_patient_id ON uhid_audit_log(patient_id);

-- =====================================================
-- 9. Create function to log UHID actions
-- =====================================================

CREATE OR REPLACE FUNCTION log_uhid_action(
  p_uhid VARCHAR(20),
  p_patient_id VARCHAR,
  p_action VARCHAR(50),
  p_performed_by VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO uhid_audit_log (uhid, patient_id, action, performed_by, details)
  VALUES (p_uhid, p_patient_id, p_action, p_performed_by::UUID, p_details);
EXCEPTION
  WHEN OTHERS THEN
    -- If UUID cast fails, insert NULL for performed_by
    INSERT INTO uhid_audit_log (uhid, patient_id, action, performed_by, details)
    VALUES (p_uhid, p_patient_id, p_action, NULL, p_details);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Create trigger to log UHID generation
-- =====================================================

CREATE OR REPLACE FUNCTION log_uhid_generation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_uhid_action(
    NEW.uhid,
    NEW.id,
    'GENERATED',
    NEW.created_by,
    jsonb_build_object('firstName', NEW.first_name, 'lastName', NEW.last_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_uhid_generation ON patients;
CREATE TRIGGER trigger_log_uhid_generation
  AFTER INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION log_uhid_generation();

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Count patients with UHIDs
-- SELECT COUNT(*) as total_patients, COUNT(uhid) as patients_with_uhid FROM patients;

-- View UHID configuration
-- SELECT * FROM uhid_config;

-- View recent UHID audit log
-- SELECT * FROM uhid_audit_log ORDER BY created_at DESC LIMIT 10;

-- Test UHID generation
-- SELECT generate_uhid() as sample_uhid;
