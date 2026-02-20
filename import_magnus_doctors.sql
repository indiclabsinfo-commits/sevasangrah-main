-- ==========================================
-- IMPORT MAGNUS HOSPITAL DOCTORS LIST
-- Replace the sample data below with actual doctors from your Excel file
-- Run this in Supabase SQL Editor
-- ==========================================

-- First, clear existing sample data (optional - comment out if you want to keep)
-- DELETE FROM doctors;

-- Insert Magnus Hospital doctors
-- FORMAT: (name, department, specialization, fee, is_active)
-- Copy and paste your Excel data here, one row per doctor
INSERT INTO doctors (name, department, specialization, fee, is_active) VALUES
-- EXAMPLE FORMAT - REPLACE WITH YOUR ACTUAL DATA:
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
('DR. BATUL PEEPAWALA', 'GENERAL PHYSICIAN', 'General Physician', 600.00, true),
-- ADD MORE DOCTORS FROM YOUR EXCEL FILE HERE...
-- ('DOCTOR NAME', 'DEPARTMENT', 'SPECIALIZATION', FEE, true),
;

-- Verify the import
SELECT COUNT(*) as total_doctors FROM doctors;
SELECT * FROM doctors ORDER BY department, name;

-- Get unique departments for UI dropdowns
SELECT DISTINCT department FROM doctors ORDER BY department;

-- Update statistics
SELECT 
  department,
  COUNT(*) as doctor_count,
  STRING_AGG(name, ', ') as doctors_list
FROM doctors 
WHERE is_active = true
GROUP BY department
ORDER BY department;