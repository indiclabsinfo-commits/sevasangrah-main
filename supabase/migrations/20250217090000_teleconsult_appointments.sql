-- Add teleconsult support to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'physical' CHECK (appointment_type IN ('physical', 'teleconsult')),
ADD COLUMN IF NOT EXISTS video_call_link TEXT,
ADD COLUMN IF NOT EXISTS virtual_waiting_room BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consultation_mode TEXT CHECK (consultation_mode IN ('video', 'audio', 'chat')),
ADD COLUMN IF NOT EXISTS remote_prescription_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS teleconsult_status TEXT CHECK (teleconsult_status IN ('scheduled', 'in_waiting_room', 'in_progress', 'completed', 'cancelled', 'no_show')),
ADD COLUMN IF NOT EXISTS join_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_id TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Create teleconsult_settings table for hospital configuration
CREATE TABLE IF NOT EXISTS teleconsult_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES hospitals(id),
  video_provider TEXT NOT NULL DEFAULT 'custom' CHECK (video_provider IN ('custom', 'zoom', 'google_meet', 'jitsi', 'whereby')),
  api_key TEXT,
  api_secret TEXT,
  default_duration_minutes INTEGER DEFAULT 30,
  auto_record BOOLEAN DEFAULT false,
  waiting_room_enabled BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create teleconsult_participants table
CREATE TABLE IF NOT EXISTS teleconsult_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_type TEXT NOT NULL CHECK (user_type IN ('doctor', 'patient', 'assistant', 'relative')),
  join_time TIMESTAMP WITH TIME ZONE,
  leave_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'declined', 'left')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create teleconsult_records table
CREATE TABLE IF NOT EXISTS teleconsult_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  recording_url TEXT,
  transcript TEXT,
  summary TEXT,
  technical_issues TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create teleconsult_prescriptions table
CREATE TABLE IF NOT EXISTS teleconsult_prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  prescription_data JSONB NOT NULL,
  digitally_signed BOOLEAN DEFAULT false,
  signature_url TEXT,
  sent_to_patient BOOLEAN DEFAULT false,
  sent_via TEXT CHECK (sent_via IN ('email', 'whatsapp', 'sms', 'portal')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_appointments_appointment_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_teleconsult_status ON appointments(teleconsult_status);
CREATE INDEX idx_teleconsult_participants_appointment ON teleconsult_participants(appointment_id);
CREATE INDEX idx_teleconsult_records_appointment ON teleconsult_records(appointment_id);

-- Insert default teleconsult settings
INSERT INTO teleconsult_settings (hospital_id, video_provider, default_duration_minutes, waiting_room_enabled, max_participants, enabled)
VALUES (NULL, 'custom', 30, true, 10, true)
ON CONFLICT DO NOTHING;

-- Update existing appointments to have default type
UPDATE appointments SET appointment_type = 'physical' WHERE appointment_type IS NULL;

-- Create view for teleconsult analytics
CREATE OR REPLACE VIEW teleconsult_analytics AS
SELECT 
  DATE(a.appointment_date) as appointment_day,
  a.appointment_type,
  a.teleconsult_status,
  COUNT(*) as total_appointments,
  AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at))/60) as avg_duration_minutes,
  COUNT(CASE WHEN a.teleconsult_status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN a.teleconsult_status = 'no_show' THEN 1 END) as no_shows
FROM appointments a
WHERE a.appointment_type = 'teleconsult'
GROUP BY DATE(a.appointment_date), a.appointment_type, a.teleconsult_status;

-- Grant permissions
GRANT ALL ON teleconsult_settings TO authenticated;
GRANT ALL ON teleconsult_participants TO authenticated;
GRANT ALL ON teleconsult_records TO authenticated;
GRANT ALL ON teleconsult_prescriptions TO authenticated;
GRANT SELECT ON teleconsult_analytics TO authenticated;