-- =====================================================
-- Migration: Module-Based Access Control System
-- Description: RLS for phased testing with Mr. Farooq
-- Date: 2024-12-24
-- Author: Development Team
-- Related: Magnus Hospital Phased Testing Strategy
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Create modules table
-- =====================================================

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code VARCHAR(50) UNIQUE NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  testing_status VARCHAR(50) DEFAULT 'NOT_STARTED',
  -- NOT_STARTED, IN_DEVELOPMENT, READY_FOR_TESTING, TESTING, APPROVED, DEPLOYED
  tested_by UUID REFERENCES users(id),
  approved_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert all 15 modules
INSERT INTO modules (module_code, module_name, description, display_order, testing_status) VALUES
('OPD', 'OPD (Outpatient Department)', 'Patient registration, appointments, consultations', 1, 'IN_DEVELOPMENT'),
('IPD', 'IPD (Inpatient Department)', 'Admissions, bed management, discharge', 2, 'NOT_STARTED'),
('BILLING', 'Billing & Payments', 'Invoice generation, payment processing, insurance', 3, 'NOT_STARTED'),
('TALLY', 'Tally Integration', 'Accounting integration with Tally software', 4, 'NOT_STARTED'),
('REPORTS', 'Reports & Analytics', 'Dashboard, analytics, custom reports', 5, 'NOT_STARTED'),
('PHARMACY', 'Pharmacy Management', 'Medicine inventory, dispensing, stock management', 6, 'NOT_STARTED'),
('INVENTORY', 'Inventory Management', 'Medical supplies, equipment tracking', 7, 'NOT_STARTED'),
('HRM', 'Human Resource Management', 'Staff management, payroll, attendance', 8, 'NOT_STARTED'),
('SECURITY', 'Security & Compliance', 'RBAC, audit logs, data protection', 9, 'NOT_STARTED'),
('FLOOR', 'Floor Management', 'Ward organization, bed allocation', 10, 'NOT_STARTED'),
('LAB', 'Laboratory Management', 'Lab tests, results, sample tracking', 11, 'NOT_STARTED'),
('NABH', 'NABH/ABHA Compliance', 'NABH standards, ABHA integration, TAT tracking', 12, 'NOT_STARTED'),
('BLOOD_BANK', 'Blood Bank', 'Blood inventory, donor management', 13, 'NOT_STARTED'),
('COMMUNICATION', 'Communication', 'SMS, email, WhatsApp notifications', 14, 'NOT_STARTED'),
('PHASE2', 'Phase 2 Features', 'Future enhancements and integrations', 15, 'NOT_STARTED')
ON CONFLICT (module_code) DO NOTHING;

-- =====================================================
-- 2. Create user_module_access table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  access_granted_at TIMESTAMP DEFAULT NOW(),
  access_granted_by UUID REFERENCES users(id),
  access_expires_at TIMESTAMP, -- NULL = no expiration
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_module_access_user_id ON user_module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_access_module_id ON user_module_access(module_id);

-- =====================================================
-- 3. Create testing_credentials table
-- =====================================================

CREATE TABLE IF NOT EXISTS testing_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(100) NOT NULL, -- 'MODULE_TESTING', 'UAT', 'DEMO'
  tester_name VARCHAR(100) NOT NULL,
  tester_email VARCHAR(255),
  tester_phone VARCHAR(20),
  assigned_modules JSONB, -- Array of module codes
  credentials_sent_at TIMESTAMP,
  last_login_at TIMESTAMP,
  testing_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testing_credentials_user_id ON testing_credentials(user_id);

-- =====================================================
-- 4. Enable Row-Level Security on key tables
-- =====================================================

-- Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on appointments table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    EXECUTE 'ALTER TABLE appointments ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Enable RLS on patient_admissions table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_admissions') THEN
    EXECUTE 'ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- =====================================================
-- 5. Create RLS policies for module-based access
-- =====================================================

-- Policy 1: Admin users bypass RLS (full access)
DROP POLICY IF EXISTS admin_full_access ON patients;
CREATE POLICY admin_full_access ON patients
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_setting('app.current_user_id', true)::UUID
      AND users.role = 'ADMIN'
    )
  );

-- Policy 2: OPD module access for patients
DROP POLICY IF EXISTS opd_module_access ON patients;
CREATE POLICY opd_module_access ON patients
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM user_module_access uma
      JOIN modules m ON uma.module_id = m.id
      WHERE uma.user_id = current_setting('app.current_user_id', true)::UUID
      AND m.module_code = 'OPD'
      AND (uma.access_expires_at IS NULL OR uma.access_expires_at > NOW())
    )
  );

-- Note: Similar policies need to be created for appointments, admissions, etc.

-- =====================================================
-- 6. Create function to grant module access
-- =====================================================

CREATE OR REPLACE FUNCTION grant_module_access(
  p_user_id UUID,
  p_module_codes TEXT[], -- Array of module codes like ['OPD', 'IPD']
  p_granted_by UUID,
  p_expires_at TIMESTAMP DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(granted_count INTEGER) AS $$
DECLARE
  module_code TEXT;
  module_record RECORD;
  count INTEGER := 0;
BEGIN
  FOREACH module_code IN ARRAY p_module_codes
  LOOP
    -- Get module ID
    SELECT * INTO module_record FROM modules WHERE modules.module_code = module_code;

    IF FOUND THEN
      -- Insert or update access
      INSERT INTO user_module_access (user_id, module_id, access_granted_by, access_expires_at, notes)
      VALUES (p_user_id, module_record.id, p_granted_by, p_expires_at, p_notes)
      ON CONFLICT (user_id, module_id)
      DO UPDATE SET
        access_granted_by = p_granted_by,
        access_expires_at = p_expires_at,
        notes = p_notes,
        access_granted_at = NOW();

      count := count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Create function to revoke module access
-- =====================================================

CREATE OR REPLACE FUNCTION revoke_module_access(
  p_user_id UUID,
  p_module_codes TEXT[]
)
RETURNS TABLE(revoked_count INTEGER) AS $$
DECLARE
  count INTEGER;
BEGIN
  DELETE FROM user_module_access
  WHERE user_id = p_user_id
  AND module_id IN (
    SELECT id FROM modules WHERE module_code = ANY(p_module_codes)
  );

  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Create function to check user module access
-- =====================================================

CREATE OR REPLACE FUNCTION has_module_access(
  p_user_id UUID,
  p_module_code VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if user is admin (admins have access to all modules)
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id AND role = 'ADMIN'
  ) INTO has_access;

  IF has_access THEN
    RETURN TRUE;
  END IF;

  -- Check specific module access
  SELECT EXISTS (
    SELECT 1 FROM user_module_access uma
    JOIN modules m ON uma.module_id = m.id
    WHERE uma.user_id = p_user_id
    AND m.module_code = p_module_code
    AND (uma.access_expires_at IS NULL OR uma.access_expires_at > NOW())
  ) INTO has_access;

  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Create view for user module access summary
-- =====================================================

CREATE OR REPLACE VIEW v_user_module_access AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  m.module_code,
  m.module_name,
  uma.access_granted_at,
  uma.access_expires_at,
  CASE
    WHEN uma.access_expires_at IS NULL THEN true
    WHEN uma.access_expires_at > NOW() THEN true
    ELSE false
  END as is_currently_accessible,
  uma.notes
FROM users u
JOIN user_module_access uma ON u.id = uma.user_id
JOIN modules m ON uma.module_id = m.id
ORDER BY u.email, m.display_order;

-- =====================================================
-- 10. Create Mr. Farooq's testing account
-- =====================================================

DO $$
DECLARE
  farooq_user_id UUID;
  opd_module_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO farooq_user_id FROM users WHERE email = 'farooq.testing@magnushospital.com';

  IF farooq_user_id IS NULL THEN
    -- Create testing account for Mr. Farooq
    INSERT INTO users (
      email,
      password_hash,
      first_name,
      last_name,
      role,
      is_active
    ) VALUES (
      'farooq.testing@magnushospital.com',
      '$2a$10$YourHashedPasswordHere', -- Change this to actual bcrypt hash
      'Farooq',
      'Testing',
      'TESTER', -- Custom role for testing
      true
    )
    RETURNING id INTO farooq_user_id;

    -- Grant access to OPD module only (for initial testing)
    SELECT id INTO opd_module_id FROM modules WHERE module_code = 'OPD';

    INSERT INTO user_module_access (user_id, module_id, notes)
    VALUES (farooq_user_id, opd_module_id, 'Initial OPD module testing access');

    -- Log testing credentials
    INSERT INTO testing_credentials (
      user_id,
      purpose,
      tester_name,
      tester_email,
      assigned_modules,
      is_active
    ) VALUES (
      farooq_user_id,
      'MODULE_TESTING',
      'Mr. Farooq',
      'farooq.testing@magnushospital.com',
      '["OPD"]'::JSONB,
      true
    );
  END IF;
END $$;

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================

-- View all modules and their testing status
-- SELECT * FROM modules ORDER BY display_order;

-- View Mr. Farooq's module access
-- SELECT * FROM v_user_module_access WHERE email LIKE '%farooq%';

-- Test module access check
-- SELECT has_module_access(
--   (SELECT id FROM users WHERE email = 'farooq.testing@magnushospital.com'),
--   'OPD'
-- );

-- Grant additional module access example:
-- SELECT grant_module_access(
--   (SELECT id FROM users WHERE email = 'farooq.testing@magnushospital.com'),
--   ARRAY['IPD', 'BILLING'],
--   (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
--   NOW() + INTERVAL '30 days',
--   'Phase 2 testing access'
-- );
