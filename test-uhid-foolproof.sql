-- FOOLPROOF UHID TEST SQL
-- Run in Supabase SQL Editor

-- 1. First, check what patient_id to use
SELECT patient_id FROM patients ORDER BY patient_id DESC LIMIT 1;

-- 2. Generate next UHID
SELECT generate_uhid('550e8400-e29b-41d4-a716-446655440000');

-- 3. Insert with ALL required fields (based on existing patients)
-- Replace P000004 with next available ID from step 1
-- Replace MH-2026-000009 with UHID from step 2
INSERT INTO patients (
  patient_id,
  uhid,
  prefix,
  first_name,
  last_name,
  age,
  gender,
  phone,
  email,
  address,
  emergency_contact_name,
  emergency_contact_phone,
  medical_history,
  allergies,
  current_medications,
  blood_group,
  notes,
  date_of_entry,
  patient_tag,
  is_active,
  hospital_id
) VALUES (
  'P000004',  -- CHANGE THIS: Get from step 1
  'MH-2026-000009',  -- CHANGE THIS: Get from step 2
  'Mr',
  'UHID',
  'Test',
  30,  -- REQUIRED: age
  'MALE',
  '9998887777',  -- REQUIRED: phone
  'test@example.com',
  'Test Address',
  'Emergency Contact',
  '9998887777',
  'None',
  'None',
  'None',
  'O+',
  'Test patient for UHID verification',
  CURRENT_DATE,
  'Test',
  true,
  '550e8400-e29b-41d4-a716-446655440000'
);

-- 4. Verify
SELECT patient_id, uhid, first_name, last_name, age, phone 
FROM patients 
WHERE uhid IS NOT NULL 
ORDER BY created_at DESC;

-- 5. Summary
SELECT 
  COUNT(*) as total_patients,
  COUNT(uhid) as patients_with_uhid,
  COUNT(*) - COUNT(uhid) as patients_missing_uhid
FROM patients;