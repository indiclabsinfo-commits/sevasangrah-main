-- ==========================================
-- SQL FILE 3: SETUP OPD QUEUE TABLE
-- Run this THIRD (after SQL_1 and SQL_2)
-- ==========================================

-- Ensure opd_queue table exists with correct schema
DO $$
BEGIN
    -- Check if opd_queue table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opd_queue') THEN
        RAISE NOTICE 'Creating opd_queue table...';

        CREATE TABLE opd_queue (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
            queue_number INTEGER NOT NULL,
            queue_status VARCHAR(20) DEFAULT 'waiting'
                CHECK (queue_status IN ('waiting', 'vitals_done', 'in_consultation', 'completed', 'cancelled')),
            priority VARCHAR(20) DEFAULT 'normal',
            notes TEXT,
            estimated_wait_time INTEGER,
            hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        RAISE NOTICE '✅ opd_queue table created';
    ELSE
        RAISE NOTICE '✅ opd_queue table already exists';

        -- Add queue_number column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'opd_queue' AND column_name = 'queue_number'
        ) THEN
            RAISE NOTICE 'Adding queue_number column...';

            ALTER TABLE opd_queue ADD COLUMN queue_number INTEGER;

            -- Set sequential values for existing records
            WITH numbered_rows AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM opd_queue
            )
            UPDATE opd_queue
            SET queue_number = numbered_rows.row_num
            FROM numbered_rows
            WHERE opd_queue.id = numbered_rows.id;

            -- Make it NOT NULL
            ALTER TABLE opd_queue ALTER COLUMN queue_number SET NOT NULL;

            RAISE NOTICE '✅ queue_number column added';
        END IF;
    END IF;
END $$;

-- Disable RLS for opd_queue
ALTER TABLE opd_queue DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE opd_queue TO authenticated;
GRANT ALL ON TABLE opd_queue TO anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opd_queue_patient ON opd_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor ON opd_queue(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_opd_queue_created ON opd_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_opd_queue_queue_number ON opd_queue(queue_number);
CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_created ON opd_queue(doctor_id, created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_opd_queue_updated_at ON opd_queue;
CREATE TRIGGER update_opd_queue_updated_at
    BEFORE UPDATE ON opd_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
DECLARE
    queue_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO queue_count FROM opd_queue;

    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ OPD QUEUE TABLE READY!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Total queue entries: %', queue_count;
    RAISE NOTICE 'Patients will now be added to queue';
    RAISE NOTICE '';
END $$;
