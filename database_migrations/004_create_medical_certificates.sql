-- Medical Certificates System Migration
-- Feature #13: Medical certificate generation
-- Date: February 16, 2026

-- 1. Create medical_certificates table
CREATE TABLE IF NOT EXISTS medical_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_number VARCHAR(50) NOT NULL UNIQUE, -- Format: MC-YYYY-MM-XXXXX
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    certificate_type VARCHAR(50) NOT NULL DEFAULT 'sick_leave', -- sick_leave, fitness, disability, etc.
    diagnosis TEXT NOT NULL,
    diagnosis_codes TEXT[], -- Array of ICD-10 codes
    duration_days INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    restrictions TEXT, -- Work/school restrictions
    recommendations TEXT, -- Medical recommendations
    additional_notes TEXT,
    is_approved BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'issued', -- issued, revoked, expired
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_date TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_medical_certificates_patient_id ON medical_certificates(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_doctor_id ON medical_certificates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_certificate_number ON medical_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_status ON medical_certificates(status);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_issued_date ON medical_certificates(issued_date);

-- 2. Create certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL DEFAULT 'sick_leave',
    content TEXT NOT NULL, -- Template with placeholders
    variables JSONB NOT NULL DEFAULT '[]', -- Available variables for this template
    is_active BOOLEAN DEFAULT true,
    hospital_id UUID REFERENCES hospitals(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO certificate_templates (template_name, template_type, content, variables) VALUES
-- Sick Leave Certificate
('Standard Sick Leave Certificate', 'sick_leave',
'MEDICAL CERTIFICATE

This is to certify that Mr./Ms. {patient_name}, {age} years, {gender}, 
resident of {address}, was examined by me on {examination_date}.

Diagnosis: {diagnosis}
ICD-10 Code(s): {diagnosis_codes}

The patient is suffering from {diagnosis_lower} and requires rest 
and medical treatment for a period of {duration_days} day(s) 
from {start_date} to {end_date}.

During this period, the patient is advised complete rest and 
should avoid strenuous activities.

Recommendations: {recommendations}

This certificate is issued for the purpose of {purpose}.

Doctor''s Name: {doctor_name}
Doctor''s Registration: {doctor_registration}
Hospital: {hospital_name}
Hospital Address: {hospital_address}
Certificate Number: {certificate_number}
Date of Issue: {issued_date}

Signature: ____________________
Stamp:',
'["patient_name", "age", "gender", "address", "examination_date", "diagnosis", "diagnosis_codes", "diagnosis_lower", "duration_days", "start_date", "end_date", "recommendations", "purpose", "doctor_name", "doctor_registration", "hospital_name", "hospital_address", "certificate_number", "issued_date"]'),

-- Fitness Certificate
('Fitness Certificate', 'fitness',
'FITNESS CERTIFICATE

This is to certify that I have examined Mr./Ms. {patient_name}, 
{age} years, {gender}, on {examination_date}.

After thorough medical examination and review of medical history, 
I find the patient to be in good health and physically fit.

The patient is medically fit for:
{purpose}

No restrictions apply at this time.

Additional Notes: {additional_notes}

Doctor''s Name: {doctor_name}
Doctor''s Registration: {doctor_registration}
Hospital: {hospital_name}
Hospital Address: {hospital_address}
Certificate Number: {certificate_number}
Date of Issue: {issued_date}

Signature: ____________________
Stamp:',
'["patient_name", "age", "gender", "examination_date", "purpose", "additional_notes", "doctor_name", "doctor_registration", "hospital_name", "hospital_address", "certificate_number", "issued_date"]'),

-- Disability Certificate
('Disability Certificate', 'disability',
'DISABILITY CERTIFICATE

This is to certify that I have examined Mr./Ms. {patient_name}, 
{age} years, {gender}, on {examination_date}.

Diagnosis: {diagnosis}
ICD-10 Code(s): {diagnosis_codes}

After thorough examination and assessment, the patient has been 
found to have {disability_percentage}% disability.

Nature of Disability: {nature_of_disability}
Duration: {duration} (from {start_date} to {end_date})

Restrictions: {restrictions}
Recommendations: {recommendations}

This certificate is issued for the purpose of availing benefits 
under the Rights of Persons with Disabilities Act, 2016.

Doctor''s Name: {doctor_name}
Doctor''s Registration: {doctor_registration}
Specialization: {doctor_specialization}
Hospital: {hospital_name}
Hospital Address: {hospital_address}
Certificate Number: {certificate_number}
Date of Issue: {issued_date}

Signature: ____________________
Stamp:',
'["patient_name", "age", "gender", "examination_date", "diagnosis", "diagnosis_codes", "disability_percentage", "nature_of_disability", "duration", "start_date", "end_date", "restrictions", "recommendations", "doctor_name", "doctor_registration", "doctor_specialization", "hospital_name", "hospital_address", "certificate_number", "issued_date"]')
ON CONFLICT (template_name) DO NOTHING;

-- 3. Create function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_month VARCHAR(10);
    sequence_num INTEGER;
    cert_number VARCHAR(50);
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 'MC-\d{4}-\d{2}-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM medical_certificates
    WHERE certificate_number LIKE 'MC-' || year_month || '-%';
    
    -- Format: MC-YYYY-MM-XXXXX (5-digit sequence)
    cert_number := 'MC-' || year_month || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to get patient''s certificate history
CREATE OR REPLACE FUNCTION get_patient_certificates(
    p_patient_id UUID,
    p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    certificate_number VARCHAR(50),
    certificate_type VARCHAR(50),
    diagnosis TEXT,
    duration_days INTEGER,
    start_date DATE,
    end_date DATE,
    issued_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    doctor_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mc.certificate_number,
        mc.certificate_type,
        mc.diagnosis,
        mc.duration_days,
        mc.start_date,
        mc.end_date,
        mc.issued_date,
        mc.status,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
    FROM medical_certificates mc
    JOIN users u ON mc.doctor_id = u.id
    WHERE mc.patient_id = p_patient_id
    ORDER BY mc.issued_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 5. Create view for certificate statistics
CREATE OR REPLACE VIEW certificate_statistics AS
SELECT 
    certificate_type,
    COUNT(*) as total_certificates,
    COUNT(CASE WHEN status = 'issued' THEN 1 END) as active_certificates,
    COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_certificates,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_certificates,
    AVG(duration_days) as avg_duration_days,
    MIN(issued_date) as first_issued,
    MAX(issued_date) as last_issued
FROM medical_certificates
WHERE issued_date >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY certificate_type
ORDER BY total_certificates DESC;

-- 6. Create trigger for certificate number generation
CREATE OR REPLACE FUNCTION set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.certificate_number IS NULL THEN
        NEW.certificate_number := generate_certificate_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_certificate_number
    BEFORE INSERT ON medical_certificates
    FOR EACH ROW
    EXECUTE FUNCTION set_certificate_number();

-- 7. Create function to revoke certificate
CREATE OR REPLACE FUNCTION revoke_certificate(
    p_certificate_number VARCHAR(50),
    p_revoked_by UUID,
    p_reason TEXT DEFAULT 'Certificate revoked by doctor'
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE medical_certificates
    SET 
        status = 'revoked',
        revoked_date = NOW(),
        revoked_reason = p_reason,
        approved_by = p_revoked_by,
        approval_date = NOW(),
        updated_at = NOW()
    WHERE certificate_number = p_certificate_number
      AND status = 'issued';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Migration complete
COMMENT ON TABLE medical_certificates IS 'Medical certificates issued to patients';
COMMENT ON TABLE certificate_templates IS 'Templates for different types of medical certificates';
COMMENT ON FUNCTION generate_certificate_number IS 'Generates unique certificate number in format MC-YYYY-MM-XXXXX';
COMMENT ON FUNCTION get_patient_certificates IS 'Retrieves certificate history for a patient';
COMMENT ON VIEW certificate_statistics IS 'Statistics on certificate issuance by type';
COMMENT ON FUNCTION revoke_certificate IS 'Revokes an issued medical certificate';