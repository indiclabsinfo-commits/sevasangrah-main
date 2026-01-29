-- Create appointments table if it doesn't exist (without strict FKs to avoid schema issues)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(255), -- References patients(patient_id) logically
    doctor_id VARCHAR(255), -- References doctors(id) logically
    department_id VARCHAR(255), -- References departments(id) logically
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30, -- In minutes
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    reason TEXT,
    appointment_type VARCHAR(50) DEFAULT 'consultation',
    notes TEXT,
    created_by VARCHAR(255), -- References users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recurring_group_id UUID,
    reminder_sent BOOLEAN DEFAULT FALSE
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_at);

-- Update status check constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check') THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
    END IF;
END $$;

ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));
