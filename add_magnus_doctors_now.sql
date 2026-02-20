-- ==========================================
-- ADD MAGNUS HOSPITAL DOCTORS (REPLACE WITH YOUR EXCEL DATA)
-- Run this in Supabase SQL Editor
-- ==========================================

-- First, clear existing doctors (optional)
-- DELETE FROM doctors;

-- Insert Magnus Hospital doctors from your Excel
-- FORMAT: (name, department, specialization, fee, is_active)
-- REPLACE THESE WITH YOUR ACTUAL DOCTORS FROM EXCEL
INSERT INTO doctors (name, department, specialization, fee, is_active) VALUES
-- Example - REPLACE WITH YOUR DATA:
('DR. HEMANT KHAJJA', 'ORTHOPAEDIC', 'Orthopaedic Surgeon', 800.00, true),
('DR. LALITA SUWALKA', 'DIETICIAN', 'Clinical Dietician', 500.00, true),
('DR. MILIND KIRIT AKHANI', 'GASTRO', 'Gastroenterologist', 1000.00, true),
('DR MEETU BABLE', 'GYN.', 'Gynecologist', 900.00, true),
('DR. AMIT PATANVADIYA', 'NEUROLOGY', 'Neurologist', 1200.00, true),
('DR. KISHAN PATEL', 'UROLOGY', 'Urologist', 1000.00, true),
('DR. PARTH SHAH', 'SURGICAL ONCOLOGY', 'Surgical Oncologist', 1500.00, true),
('DR.RAJEEDP GUPTA', 'MEDICAL ONCOLOGY', 'Medical Oncologist', 1500.00, true),
('DR. KULDDEP VALA', 'NEUROSURGERY', 'Neurosurgeon', 2000.00, true),
('DR. KURNAL PATEL', 'UROLOGY', 'Urologist', 1000.00, true),
('DR. SAURABH GUPTA', 'ENDOCRINOLOGY', 'Endocrinologist', 800.00, true),
('DR. BATUL PEEPAWALA', 'GENERAL PHYSICIAN', 'General Physician', 600.00, true)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_doctors FROM doctors;
SELECT * FROM doctors ORDER BY department, name;

-- Get department summary
SELECT 
  department,
  COUNT(*) as doctor_count,
  STRING_AGG(name, ', ') as doctors
FROM doctors 
WHERE is_active = true
GROUP BY department
ORDER BY department;