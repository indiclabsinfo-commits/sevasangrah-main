-- ==========================================
-- SQL FILE 5: FIX OPD QUEUE FOREIGN KEY
-- Run this to fix doctor_id foreign key reference
-- ==========================================

-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'opd_queue_doctor_id_fkey'
        AND table_name = 'opd_queue'
    ) THEN
        ALTER TABLE opd_queue DROP CONSTRAINT opd_queue_doctor_id_fkey;
        RAISE NOTICE '✅ Dropped old foreign key constraint';
    END IF;
END $$;

-- Add correct foreign key constraint to doctors table
DO $$
BEGIN
    -- Check if doctors table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'doctors'
    ) THEN
        -- Add foreign key to doctors table
        ALTER TABLE opd_queue
        ADD CONSTRAINT opd_queue_doctor_id_fkey
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE SET NULL;

        RAISE NOTICE '✅ Added foreign key constraint to doctors table';
    ELSE
        RAISE WARNING '⚠️ Doctors table does not exist. Please run SQL_2_CREATE_DOCTORS.sql first';
    END IF;
END $$;

-- Verify the setup
DO $$
DECLARE
    queue_count INTEGER;
    fk_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '📊 OPD QUEUE VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';

    -- Check queue entries
    SELECT COUNT(*) INTO queue_count FROM opd_queue;
    RAISE NOTICE '1️⃣  OPD Queue entries: %', queue_count;

    -- Check foreign key
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'opd_queue_doctor_id_fkey'
        AND table_name = 'opd_queue'
    ) INTO fk_exists;

    RAISE NOTICE '2️⃣  Foreign key constraint: %', CASE WHEN fk_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;

    -- Show which table the FK references
    IF fk_exists THEN
        RAISE NOTICE '3️⃣  Foreign key references: doctors table';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
END $$;
