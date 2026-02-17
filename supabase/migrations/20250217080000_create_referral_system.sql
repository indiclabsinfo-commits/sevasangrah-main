-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_uhid TEXT NOT NULL,
  referring_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE SET NULL,
  referring_doctor_name TEXT NOT NULL,
  referring_department TEXT NOT NULL,
  target_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  target_doctor_name TEXT,
  target_department TEXT NOT NULL,
  target_hospital TEXT,
  referral_type TEXT NOT NULL CHECK (referral_type IN ('internal', 'external')),
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  referral_reason TEXT NOT NULL,
  clinical_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'emergency')),
  appointment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_referrals_patient_id ON referrals(patient_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_referral_type ON referrals(referral_type);
CREATE INDEX idx_referrals_referral_date ON referrals(referral_date);
CREATE INDEX idx_referrals_target_department ON referrals(target_department);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_referrals_updated_at 
  BEFORE UPDATE ON referrals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create referral_attachments table for supporting documents
CREATE TABLE IF NOT EXISTS referral_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create referral_comments table for communication
CREATE TABLE IF NOT EXISTS referral_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create referral_status_history table for tracking
CREATE TABLE IF NOT EXISTS referral_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_by_name TEXT,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert sample departments if not exists
INSERT INTO departments (id, name, description) VALUES
  ('dept-001', 'General Medicine', 'General medical consultations'),
  ('dept-002', 'Cardiology', 'Heart and cardiovascular diseases'),
  ('dept-003', 'Neurology', 'Brain and nervous system disorders'),
  ('dept-004', 'Orthopedics', 'Bone and joint problems'),
  ('dept-005', 'Pediatrics', 'Child healthcare'),
  ('dept-006', 'Gynecology', 'Women''s health'),
  ('dept-007', 'Dermatology', 'Skin diseases'),
  ('dept-008', 'ENT', 'Ear, Nose and Throat'),
  ('dept-009', 'Ophthalmology', 'Eye care'),
  ('dept-010', 'Dentistry', 'Dental care')
ON CONFLICT (id) DO NOTHING;

-- Create view for referral analytics
CREATE OR REPLACE VIEW referral_analytics AS
SELECT 
  DATE(referral_date) as referral_day,
  referral_type,
  status,
  priority,
  target_department,
  COUNT(*) as total_referrals,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_processing_hours
FROM referrals
GROUP BY DATE(referral_date), referral_type, status, priority, target_department;

-- Grant permissions
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON referral_attachments TO authenticated;
GRANT ALL ON referral_comments TO authenticated;
GRANT ALL ON referral_status_history TO authenticated;
GRANT SELECT ON referral_analytics TO authenticated;