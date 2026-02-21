-- ==========================================
-- SQL FILE 2: CREATE DOCTORS TABLE AND DATA
-- Run this SECOND (after SQL_1)
-- ==========================================

-- Add missing columns to doctors table if they don't exist
DO $$
BEGIN
    -- Add email column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'email'
    ) THEN
        ALTER TABLE doctors ADD COLUMN email VARCHAR(255);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_email_unique ON doctors(email);
    END IF;

    -- Add phone column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'phone'
    ) THEN
        ALTER TABLE doctors ADD COLUMN phone VARCHAR(20);
    END IF;

    -- Add qualification column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'qualification'
    ) THEN
        ALTER TABLE doctors ADD COLUMN qualification VARCHAR(500);
    END IF;

    -- Add experience_years column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'experience_years'
    ) THEN
        ALTER TABLE doctors ADD COLUMN experience_years INTEGER;
    END IF;

    -- Add consultation_fee column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'consultation_fee'
    ) THEN
        ALTER TABLE doctors ADD COLUMN consultation_fee INTEGER DEFAULT 500;
    END IF;
END $$;

-- Disable RLS for direct access
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE doctors TO authenticated;
GRANT ALL ON TABLE doctors TO anon;

-- Insert sample doctors using a safe method with name column
DO $$
BEGIN
    -- Insert doctors one by one with duplicate checking
    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Rajesh Kumar', 'Rajesh', 'Kumar', 'General', 'General Physician', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Rajesh Kumar');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Priya Sharma', 'Priya', 'Sharma', 'Pediatrics', 'Child Specialist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Priya Sharma');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Amit Patel', 'Amit', 'Patel', 'Cardiology', 'Cardiologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Amit Patel');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Sunita Verma', 'Sunita', 'Verma', 'Gynecology', 'Gynecologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Sunita Verma');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Vikram Singh', 'Vikram', 'Singh', 'Orthopedics', 'Orthopedic Surgeon', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Vikram Singh');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Anjali Desai', 'Anjali', 'Desai', 'Dermatology', 'Dermatologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Anjali Desai');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Rahul Gupta', 'Rahul', 'Gupta', 'ENT', 'ENT Specialist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Rahul Gupta');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Meera Reddy', 'Meera', 'Reddy', 'Ophthalmology', 'Eye Specialist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Meera Reddy');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Sanjay Joshi', 'Sanjay', 'Joshi', 'Neurology', 'Neurologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Sanjay Joshi');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Kavita Nair', 'Kavita', 'Nair', 'Psychiatry', 'Psychiatrist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Kavita Nair');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Arjun Malhotra', 'Arjun', 'Malhotra', 'Emergency', 'Emergency Medicine', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Arjun Malhotra');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Pooja Saxena', 'Pooja', 'Saxena', 'Radiology', 'Radiologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Pooja Saxena');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Karan Chopra', 'Karan', 'Chopra', 'General', 'General Surgeon', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Karan Chopra');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Divya Iyer', 'Divya', 'Iyer', 'Pediatrics', 'Neonatologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Divya Iyer');

    INSERT INTO doctors (name, first_name, last_name, department, specialization, is_active)
    SELECT 'Dr. Rohit Mehta', 'Rohit', 'Mehta', 'Cardiology', 'Interventional Cardiologist', true
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. Rohit Mehta');
END $$;

-- Update consultation fees if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'consultation_fee'
    ) THEN
        UPDATE doctors SET consultation_fee = 500 WHERE first_name = 'Rajesh' AND last_name = 'Kumar';
        UPDATE doctors SET consultation_fee = 600 WHERE first_name = 'Priya' AND last_name = 'Sharma';
        UPDATE doctors SET consultation_fee = 1000 WHERE first_name = 'Amit' AND last_name = 'Patel';
        UPDATE doctors SET consultation_fee = 800 WHERE first_name = 'Sunita' AND last_name = 'Verma';
        UPDATE doctors SET consultation_fee = 900 WHERE first_name = 'Vikram' AND last_name = 'Singh';
        UPDATE doctors SET consultation_fee = 700 WHERE first_name = 'Anjali' AND last_name = 'Desai';
        UPDATE doctors SET consultation_fee = 650 WHERE first_name = 'Rahul' AND last_name = 'Gupta';
        UPDATE doctors SET consultation_fee = 750 WHERE first_name = 'Meera' AND last_name = 'Reddy';
        UPDATE doctors SET consultation_fee = 1200 WHERE first_name = 'Sanjay' AND last_name = 'Joshi';
        UPDATE doctors SET consultation_fee = 850 WHERE first_name = 'Kavita' AND last_name = 'Nair';
        UPDATE doctors SET consultation_fee = 600 WHERE first_name = 'Arjun' AND last_name = 'Malhotra';
        UPDATE doctors SET consultation_fee = 700 WHERE first_name = 'Pooja' AND last_name = 'Saxena';
        UPDATE doctors SET consultation_fee = 950 WHERE first_name = 'Karan' AND last_name = 'Chopra';
        UPDATE doctors SET consultation_fee = 850 WHERE first_name = 'Divya' AND last_name = 'Iyer';
        UPDATE doctors SET consultation_fee = 1500 WHERE first_name = 'Rohit' AND last_name = 'Mehta';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(first_name, last_name);

-- Success message
DO $$
DECLARE
    doctor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doctor_count FROM doctors WHERE is_active = true;

    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ DOCTORS TABLE READY!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Total active doctors: %', doctor_count;
    RAISE NOTICE 'Doctors dropdown will now be populated';
    RAISE NOTICE '';
END $$;
