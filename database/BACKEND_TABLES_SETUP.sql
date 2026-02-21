-- ============================================================================
-- BACKEND FEATURE TABLES — Run this in Supabase SQL Editor
-- Safe for re-runs: uses IF NOT EXISTS everywhere
-- ============================================================================

-- ============================================================================
-- 1. MEDICAL CERTIFICATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    certificate_type VARCHAR(20) NOT NULL,
    diagnosis TEXT,
    diagnosis_codes TEXT[],
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 0,
    restrictions TEXT,
    recommendations TEXT,
    additional_notes TEXT,
    purpose TEXT,
    disability_percentage INTEGER,
    nature_of_disability TEXT,
    pdf_path TEXT,
    hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_certificates_patient ON medical_certificates(patient_id);

-- ============================================================================
-- 2. NOTIFICATION TEMPLATES (create if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) NOT NULL DEFAULT 'sms',
    category VARCHAR(30) DEFAULT 'general',
    language VARCHAR(10) DEFAULT 'en',
    content TEXT NOT NULL,
    variables TEXT[],
    character_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. NOTIFICATION LOGS (create if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_number VARCHAR(50),
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    channel VARCHAR(10),
    category VARCHAR(30),
    message_content TEXT,
    status VARCHAR(15) DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    cost_estimate DECIMAL(10,2),
    error_message TEXT,
    patient_id UUID,
    template_id UUID,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SMS LOGS (create if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    phone_number VARCHAR(20),
    message TEXT,
    status VARCHAR(15) DEFAULT 'pending',
    error_message TEXT,
    sms_type VARCHAR(30),
    external_id VARCHAR(100),
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. OTP VERIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'verification',
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone_number);

-- ============================================================================
-- 6. UHID CONFIG (drop and recreate to ensure correct schema)
-- ============================================================================
DROP TABLE IF EXISTS uhid_config CASCADE;
CREATE TABLE uhid_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID UNIQUE NOT NULL,
    prefix VARCHAR(10) DEFAULT 'HMS',
    separator VARCHAR(2) DEFAULT '-',
    include_year BOOLEAN DEFAULT TRUE,
    year_format VARCHAR(4) DEFAULT 'YYYY',
    sequence_digits INTEGER DEFAULT 4,
    current_sequence INTEGER DEFAULT 0,
    format_preview VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. EPISODES OF CARE
-- ============================================================================
CREATE TABLE IF NOT EXISTS episodes_of_care (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    episode_type VARCHAR(20) NOT NULL DEFAULT 'opd_visit',
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(15) DEFAULT 'active',
    primary_diagnosis TEXT,
    primary_doctor_id UUID REFERENCES users(id),
    department VARCHAR(50),
    notes TEXT,
    hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_patient ON episodes_of_care(patient_id);

CREATE TABLE IF NOT EXISTS episode_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES episodes_of_care(id) ON DELETE CASCADE NOT NULL,
    record_type VARCHAR(30) NOT NULL,
    record_id UUID NOT NULL,
    record_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_records_episode ON episode_records(episode_id);

-- ============================================================================
-- 8. DOCUMENT UPLOADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_uploads_patient ON document_uploads(patient_id);

-- ============================================================================
-- 9. ADD photo_url TO PATIENTS (if not exists)
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'photo_url') THEN
        ALTER TABLE patients ADD COLUMN photo_url TEXT;
    END IF;
END$$;

-- ============================================================================
-- 10. RLS POLICIES (drop first, then create — idempotent)
-- ============================================================================
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE uhid_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes_of_care ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_medical_certificates" ON medical_certificates;
DROP POLICY IF EXISTS "anon_all_notification_templates" ON notification_templates;
DROP POLICY IF EXISTS "anon_all_notification_logs" ON notification_logs;
DROP POLICY IF EXISTS "anon_all_notification_logs_backend" ON notification_logs;
DROP POLICY IF EXISTS "anon_all_sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "anon_all_otp_verifications" ON otp_verifications;
DROP POLICY IF EXISTS "anon_all_uhid_config" ON uhid_config;
DROP POLICY IF EXISTS "anon_all_episodes_of_care" ON episodes_of_care;
DROP POLICY IF EXISTS "anon_all_episode_records" ON episode_records;
DROP POLICY IF EXISTS "anon_all_document_uploads" ON document_uploads;

CREATE POLICY "anon_all_medical_certificates" ON medical_certificates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_notification_templates" ON notification_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_notification_logs" ON notification_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_sms_logs" ON sms_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_otp_verifications" ON otp_verifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_uhid_config" ON uhid_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_episodes_of_care" ON episodes_of_care FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_episode_records" ON episode_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_document_uploads" ON document_uploads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 11. SEED DEFAULT UHID CONFIG
-- ============================================================================
INSERT INTO uhid_config (hospital_id, prefix, separator, include_year, year_format, sequence_digits, current_sequence, format_preview)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'HMS', '-', true, 'YYYY', 4, 0, 'HMS-2026-0001')
ON CONFLICT (hospital_id) DO NOTHING;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Backend tables setup complete!' as status;
