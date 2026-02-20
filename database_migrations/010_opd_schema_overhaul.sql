-- OPD Schema Overhaul Migration
-- Consolidates OPD-related clinical data into direct Supabase tables
-- Author: Antigravity
-- Date: February 20, 2026

-- 1. Create patient_vitals table
CREATE TABLE IF NOT EXISTS patient_vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES opd_queues(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clinical data
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature_f DECIMAL(4,1),
    pulse_rate INTEGER,
    spO2_percentage INTEGER,
    respiratory_rate INTEGER,
    
    -- Metadata
    recorded_by UUID,
    notes TEXT,
    hospital_id UUID DEFAULT 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create opd_consultations table
CREATE TABLE IF NOT EXISTS opd_consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES opd_queues(id) ON DELETE SET NULL,
    consultation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clinical findings
    chief_complaints TEXT NOT NULL,
    examination_findings TEXT,
    diagnosis TEXT NOT NULL,
    diagnosis_codes TEXT[], -- Array of ICD-10 codes
    treatment_plan TEXT,
    
    -- Follow-up
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    
    -- Metadata
    prescription_id UUID, -- Link to prescriptions if needed
    hospital_id UUID DEFAULT 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance opd_queues with standardized statuses and constraints
DO $$ 
BEGIN
    -- Standardize queue_status to include 'vitals_done' and 'cancelled' if not present
    ALTER TABLE opd_queues DROP CONSTRAINT IF EXISTS opd_queues_queue_status_check;
    ALTER TABLE opd_queues ADD CONSTRAINT opd_queues_queue_status_check 
        CHECK (queue_status IN ('waiting', 'vitals_done', 'in_consultation', 'completed', 'cancelled'));
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'opd_queues table does not exist yet. Creating it...';
        CREATE TABLE opd_queues (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
            queue_number INTEGER NOT NULL,
            queue_status VARCHAR(20) DEFAULT 'waiting' CHECK (queue_status IN ('waiting', 'vitals_done', 'in_consultation', 'completed', 'cancelled')),
            priority VARCHAR(20) DEFAULT 'normal',
            notes TEXT,
            estimated_wait_time INTEGER,
            hospital_id UUID DEFAULT 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
END $$;

-- 4. Disable RLS for new tables (to ensure app can read/write directly)
ALTER TABLE patient_vitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE opd_consultations DISABLE ROW LEVEL SECURITY;
ALTER TABLE opd_queues DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT ALL ON TABLE patient_vitals TO anon, authenticated;
GRANT ALL ON TABLE opd_consultations TO anon, authenticated;
GRANT ALL ON TABLE opd_queues TO anon, authenticated;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON opd_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON opd_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON opd_consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_queues_status ON opd_queues(queue_status);
CREATE INDEX IF NOT EXISTS idx_queues_created_at ON opd_queues(created_at);

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vitals_timestamp BEFORE UPDATE ON patient_vitals FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_consultations_timestamp BEFORE UPDATE ON opd_consultations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_queues_timestamp BEFORE UPDATE ON opd_queues FOR EACH ROW EXECUTE FUNCTION update_timestamp();
