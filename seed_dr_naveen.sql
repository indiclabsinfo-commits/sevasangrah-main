
-- check and add missing column
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;

-- Insert Dr. Naveen
INSERT INTO doctors (id, name, department, specialization, is_active, consultation_fee, created_at, updated_at)
VALUES 
(gen_random_uuid(), 'DR. NAVEEN', 'GYNE', 'Gynecologist', true, 500, NOW(), NOW());

