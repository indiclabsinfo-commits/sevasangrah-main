-- COMPLETE UHID TEST SCRIPT
-- Run in Supabase SQL Editor

-- 1. Check UHID config
SELECT * FROM uhid_config;

-- 2. Generate next UHID
SELECT generate_uhid('550e8400-e29b-41d4-a716-446655440000');

-- 3. Get next patient_id
SELECT patient_id FROM patients ORDER BY created_at DESC LIMIT 1;

-- 4. Create test patient with UHID (with all required fields)
INSERT INTO patients (
  patient_id, 
  uhid, 
  first_name, 
  last_name, 
  gender, 
  hospital_id, 
  is_active,
  date_of_entry,
  age
) VALUES (
  'P000003',  -- Change this based on step 3 result
  'MH-2026-000006', 
  'UHID', 
  'Test',
  'MALE', 
  '550e8400-e29b-41d4-a716-446655440000', 
  true,
  CURRENT_DATE,
  30
);

-- 5. Verify patient created with UHID
SELECT patient_id, uhid, first_name, last_name, created_at 
FROM patients 
WHERE uhid = 'MH-2026-000006';

-- 6. Check all patients with UHID
SELECT patient_id, uhid, first_name 
FROM patients 
WHERE uhid IS NOT NULL 
ORDER BY created_at DESC;

-- 7. Update uhid_config sequence (if needed)
-- SELECT * FROM uhid_config;
-- UPDATE uhid_config SET current_sequence = current_sequence + 1 WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';