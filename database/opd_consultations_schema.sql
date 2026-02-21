-- OPD Consultations Table
-- This table stores all OPD consultation records

CREATE TABLE IF NOT EXISTS opd_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    queue_id UUID REFERENCES opd_queue(id) ON DELETE SET NULL,
    consultation_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Clinical Information
    chief_complaints TEXT NOT NULL,
    examination_findings TEXT,
    diagnosis TEXT NOT NULL,
    diagnosis_codes TEXT[], -- Array of ICD-10 codes
    treatment_plan TEXT,
    
    -- Follow-up
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Metadata
    duration_minutes INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    prescription_id UUID, -- Link to prescription if generated
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    hospital_id UUID NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_opd_consultations_patient_id ON opd_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_consultations_doctor_id ON opd_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_consultations_queue_id ON opd_consultations(queue_id);
CREATE INDEX IF NOT EXISTS idx_opd_consultations_date ON opd_consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_opd_consultations_status ON opd_consultations(status);
CREATE INDEX IF NOT EXISTS idx_opd_consultations_hospital_id ON opd_consultations(hospital_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opd_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opd_consultations_updated_at
    BEFORE UPDATE ON opd_consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_opd_consultations_updated_at();

-- Comments for documentation
COMMENT ON TABLE opd_consultations IS 'Stores OPD consultation records with clinical details';
COMMENT ON COLUMN opd_consultations.chief_complaints IS 'Patient''s main complaints/symptoms';
COMMENT ON COLUMN opd_consultations.examination_findings IS 'Clinical examination findings';
COMMENT ON COLUMN opd_consultations.diagnosis IS 'Primary diagnosis';
COMMENT ON COLUMN opd_consultations.diagnosis_codes IS 'Array of ICD-10 diagnosis codes';
COMMENT ON COLUMN opd_consultations.treatment_plan IS 'Recommended treatment plan';
COMMENT ON COLUMN opd_consultations.follow_up_date IS 'Scheduled follow-up date';
COMMENT ON COLUMN opd_consultations.status IS 'Consultation status: IN_PROGRESS, COMPLETED, or CANCELLED';
