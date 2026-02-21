-- ==========================================
-- FIX OPD QUEUE TABLE SCHEMA
-- Add missing queue_number column
-- ==========================================

-- Check if queue_number column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'queue_number'
    ) THEN
        RAISE NOTICE 'Adding queue_number column to opd_queue table...';

        -- Add the column (nullable first)
        ALTER TABLE opd_queue ADD COLUMN queue_number INTEGER;

        -- Set sequential values for existing records using ROW_NUMBER
        WITH numbered_rows AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
            FROM opd_queue
        )
        UPDATE opd_queue
        SET queue_number = numbered_rows.row_num
        FROM numbered_rows
        WHERE opd_queue.id = numbered_rows.id;

        -- Now make it NOT NULL (all records should have values now)
        ALTER TABLE opd_queue ALTER COLUMN queue_number SET NOT NULL;

        RAISE NOTICE '✅ queue_number column added successfully';
    ELSE
        RAISE NOTICE '✅ queue_number column already exists';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opd_queue_queue_number ON opd_queue(queue_number);
CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_created ON opd_queue(doctor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(queue_status);

-- Verify the fix
DO $$
DECLARE
    col_count INTEGER;
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'opd_queue' AND column_name = 'queue_number';

    SELECT COUNT(*) INTO record_count
    FROM opd_queue;

    IF col_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '====================================';
        RAISE NOTICE '✅ OPD QUEUE TABLE FIXED!';
        RAISE NOTICE '====================================';
        RAISE NOTICE 'queue_number column added';
        RAISE NOTICE 'Total queue records: %', record_count;
        RAISE NOTICE 'OPD Queue is ready to use';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION 'Failed to add queue_number column!';
    END IF;
END $$;
