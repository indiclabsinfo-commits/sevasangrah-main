-- ==========================================
-- CREATE TEST DOCTORS
-- Add sample doctors for testing OPD queue
-- ==========================================

-- Check which table exists and insert accordingly
DO $$
BEGIN
    -- Try to insert into doctors table first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') THEN
        RAISE NOTICE 'Inserting into doctors table...';

        -- Insert test doctors into doctors table
        INSERT INTO doctors (id, first_name, last_name, department, specialization, consultation_fee, is_active)
        VALUES
            (gen_random_uuid(), 'Rajesh', 'Kumar', 'General', 'General Physician', 500, true),
            (gen_random_uuid(), 'Priya', 'Sharma', 'Pediatrics', 'Child Specialist', 600, true),
            (gen_random_uuid(), 'Amit', 'Patel', 'Cardiology', 'Cardiologist', 1000, true)
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE '✅ Test doctors inserted into doctors table';

    -- Fallback: insert into users table with doctor role
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Inserting into users table with role=doctor...';

        INSERT INTO users (id, email, first_name, last_name, role, department, is_active)
        VALUES
            (gen_random_uuid(), 'dr.rajesh@hospital.com', 'Rajesh', 'Kumar', 'doctor', 'General', true),
            (gen_random_uuid(), 'dr.priya@hospital.com', 'Priya', 'Sharma', 'doctor', 'Pediatrics', true),
            (gen_random_uuid(), 'dr.amit@hospital.com', 'Amit', 'Patel', 'doctor', 'Cardiology', true)
        ON CONFLICT (email) DO NOTHING;

        RAISE NOTICE '✅ Test doctors inserted into users table';

    ELSE
        RAISE EXCEPTION 'Neither doctors nor users table exists!';
    END IF;
END $$;

-- Verify the insert
DO $$
DECLARE
    doctor_count INTEGER := 0;
BEGIN
    -- Count doctors in doctors table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') THEN
        SELECT COUNT(*) INTO doctor_count FROM doctors WHERE is_active = true;
        RAISE NOTICE '';
        RAISE NOTICE '====================================';
        RAISE NOTICE '✅ DOCTORS CREATED SUCCESSFULLY!';
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Total active doctors: %', doctor_count;
        RAISE NOTICE 'You can now select doctors in patient registration';
        RAISE NOTICE '';
        RETURN;
    END IF;

    -- Count doctors in users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        SELECT COUNT(*) INTO doctor_count FROM users WHERE role = 'doctor' AND is_active = true;
        RAISE NOTICE '';
        RAISE NOTICE '====================================';
        RAISE NOTICE '✅ DOCTORS CREATED SUCCESSFULLY!';
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Total active doctors: %', doctor_count;
        RAISE NOTICE 'You can now select doctors in patient registration';
        RAISE NOTICE '';
    END IF;
END $$;
