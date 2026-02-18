
-- Check and add missing consultation_fee column
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;

-- Insert doctors into the doctors table
INSERT INTO doctors (id, name, department, specialization, is_active, consultation_fee)
VALUES
  (gen_random_uuid(), 'DR. HEMANT KHAJJA', 'ORTHOPAEDIC', 'ORTHOPAEDIC', true, 500),
  (gen_random_uuid(), 'DR. HEMANT', 'ORTHO', 'ORTHO', true, 500),
  (gen_random_uuid(), 'DR. LALITA SUWALKA', 'DIETICIAN', 'DIETICIAN', true, 300),
  (gen_random_uuid(), 'DR. MILIND KIRIT AKHANI', 'GASTRO', 'GASTRO', true, 800),
  (gen_random_uuid(), 'DR MEETU BABLE', 'GYN.', 'GYN.', true, 500),
  (gen_random_uuid(), 'DR. AMIT PATANVADIYA', 'NEUROLOGY', 'NEUROLOGY', true, 1000),
  (gen_random_uuid(), 'DR. KISHAN PATEL', 'UROLOGY', 'UROLOGY', true, 800),
  (gen_random_uuid(), 'DR. PARTH SHAH', 'SURGICAL ONCOLOGY', 'SURGICAL ONCOLOGY', true, 1000),
  (gen_random_uuid(), 'DR.RAJEEDP GUPTA', 'MEDICAL ONCOLOGY', 'MEDICAL ONCOLOGY', true, 1000),
  (gen_random_uuid(), 'DR. KULDDEP VALA', 'NEUROSURGERY', 'NEUROSURGERY', true, 1200),
  (gen_random_uuid(), 'DR. KURNAL PATEL', 'UROLOGY', 'UROLOGY', true, 800),
  (gen_random_uuid(), 'DR. SAURABH GUPTA', 'ENDOCRINOLOGY', 'ENDOCRINOLOGY', true, 700),
  (gen_random_uuid(), 'DR. BATUL PEEPAWALA', 'GENERAL PHYSICIAN', 'GENERAL PHYSICIAN', true, 300),
  (gen_random_uuid(), 'DR. POONAM JAIN', 'PHYSIOTHERAPY', 'PHYSIOTHERAPY', true, 400);

