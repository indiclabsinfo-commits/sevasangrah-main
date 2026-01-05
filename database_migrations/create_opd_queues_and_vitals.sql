-- Create ENUM for OPD Queue Status
CREATE TYPE opd_queue_status AS ENUM ('WAITING', 'VITALS_DONE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED');

-- Create opd_queues table
CREATE TABLE IF NOT EXISTS opd_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id), -- Assuming doctors are in users table, or adjust to doctors table if separate
    appointment_id INTEGER REFERENCES future_appointments(id),
    status opd_queue_status DEFAULT 'WAITING',
    token_number SERIAL, -- Simple serial for daily tokens, might need reset logic
    priority BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for opd_queues
-- Enable RLS for opd_queues
-- ALTER TABLE opd_queues ENABLE ROW LEVEL SECURITY;

-- Create policy for opd_queues (Allow all for now, refine later)
-- CREATE POLICY "Enable all access for authenticated users" ON opd_queues
--     FOR ALL USING (auth.role() = 'authenticated');

-- Create patient_vitals table
CREATE TABLE IF NOT EXISTS patient_vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR NOT NULL REFERENCES patients(id),
    queue_id UUID REFERENCES opd_queues(id), -- Link to specific queue entry
    visit_id UUID, -- Generic link for future flexibility
    blood_pressure TEXT,
    pulse INTEGER,
    temperature NUMERIC(4, 1),
    weight NUMERIC(5, 2),
    height NUMERIC(5, 2),
    spo2 INTEGER,
    respiratory_rate INTEGER,
    bmi NUMERIC(4, 1),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for patient_vitals
-- Enable RLS for patient_vitals
-- ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;

-- Create policy for patient_vitals
-- CREATE POLICY "Enable all access for authenticated users" ON patient_vitals
--    FOR ALL USING (auth.role() = 'authenticated');

-- Add indexes
CREATE INDEX idx_opd_queues_patient_id ON opd_queues(patient_id);
CREATE INDEX idx_opd_queues_doctor_id ON opd_queues(doctor_id);
CREATE INDEX idx_opd_queues_status ON opd_queues(status);
CREATE INDEX idx_opd_queues_created_at ON opd_queues(created_at);
CREATE INDEX idx_patient_vitals_patient_id ON patient_vitals(patient_id);
