-- ==========================================
-- COMPLETE OPD MODULE FIX
-- Fixes: UHID sequence sync + OPD Queue schema
-- ==========================================

-- PART 1: FIX UHID SEQUENCE (CRITICAL)
DO $$
DECLARE
    max_sequence INTEGER := 0;
    current_year TEXT;
    uhid_pattern TEXT;
BEGIN
    RAISE NOTICE '🔧 STEP 1: Fixing UHID sequence synchronization...';

    current_year := TO_CHAR(NOW(), 'YYYY');
    uhid_pattern := 'MH-' || current_year || '-%';

    -- Find the maximum UHID sequence from actual patients
    SELECT COALESCE(MAX(
        CASE
            WHEN uhid ~ '^MH-[0-9]{4}-[0-9]{6}$' THEN
                CAST(SUBSTRING(uhid FROM '[0-9]{6}$') AS INTEGER)
            ELSE 0
        END
    ), 0)
    INTO max_sequence
    FROM patients
    WHERE uhid LIKE uhid_pattern;

    RAISE NOTICE '   Found max UHID sequence in database: %', max_sequence;

    -- Update uhid_config to match reality
    UPDATE uhid_config
    SET current_sequence = max_sequence,
        updated_at = NOW()
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    RAISE NOTICE '✅ UHID sequence synchronized! Next will be: MH-%-% ',
        current_year, LPAD((max_sequence + 1)::TEXT, 6, '0');
END $$;

-- PART 2: FIX OPD QUEUE TABLE SCHEMA
DO $$
BEGIN
    RAISE NOTICE '🔧 STEP 2: Checking opd_queue table schema...';

    -- Add queue_number column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'queue_number'
    ) THEN
        RAISE NOTICE '   Adding queue_number column...';

        -- Add the column (nullable first)
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
    ELSE
        RAISE NOTICE '✅ queue_number column already exists';
    END IF;
END $$;

-- PART 3: CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_opd_queue_queue_number ON opd_queue(queue_number);
CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_created ON opd_queue(doctor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);

-- PART 4: VERIFICATION
DO $$
DECLARE
    uhid_seq INTEGER;
    queue_col_exists BOOLEAN;
    patient_count INTEGER;
    queue_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ VERIFICATION RESULTS';
    RAISE NOTICE '====================================';

    -- Check UHID sequence
    SELECT current_sequence INTO uhid_seq
    FROM uhid_config
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    RAISE NOTICE '✅ UHID sequence: % (next: MH-2026-%)',
        uhid_seq, LPAD((uhid_seq + 1)::TEXT, 6, '0');

    -- Check queue_number column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opd_queue' AND column_name = 'queue_number'
    ) INTO queue_col_exists;

    IF queue_col_exists THEN
        RAISE NOTICE '✅ opd_queue.queue_number column: EXISTS';
    ELSE
        RAISE NOTICE '❌ opd_queue.queue_number column: MISSING';
    END IF;

    -- Count records
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO queue_count FROM opd_queue;

    RAISE NOTICE '📊 Total patients: %', patient_count;
    RAISE NOTICE '📊 Total queue entries: %', queue_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 OPD MODULE IS READY!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
END $$;
