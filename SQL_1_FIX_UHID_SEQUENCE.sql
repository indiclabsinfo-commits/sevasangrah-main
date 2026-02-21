-- ==========================================
-- SQL FILE 1: FIX UHID SEQUENCE
-- Run this FIRST
-- ==========================================

-- Synchronize UHID sequence with existing patient data
DO $$
DECLARE
    max_sequence INTEGER := 0;
    current_year TEXT;
    uhid_pattern TEXT;
BEGIN
    RAISE NOTICE '🔧 Fixing UHID sequence synchronization...';

    -- Get current year
    current_year := TO_CHAR(NOW(), 'YYYY');
    uhid_pattern := 'MH-' || current_year || '-%';

    -- Extract maximum sequence from existing UHIDs for current year
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

    RAISE NOTICE '✅ Maximum UHID sequence found: %', max_sequence;

    -- Update the uhid_config to use the correct sequence
    UPDATE uhid_config
    SET current_sequence = max_sequence,
        updated_at = NOW()
    WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

    RAISE NOTICE '✅ Updated uhid_config.current_sequence to: %', max_sequence;
    RAISE NOTICE '📋 Next UHID will be: MH-%-%', current_year, LPAD((max_sequence + 1)::TEXT, 6, '0');
END $$;

-- Drop existing function if it exists (to avoid return type conflicts)
DROP FUNCTION IF EXISTS generate_uhid(uuid);
DROP FUNCTION IF EXISTS generate_uhid();

-- Recreate generate_uhid function with proper locking and retry logic
CREATE OR REPLACE FUNCTION generate_uhid(p_hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000')
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_sequence INTEGER;
    v_year VARCHAR(4);
    v_uhid VARCHAR(20);
    v_max_retries INTEGER := 5;
    v_retry_count INTEGER := 0;
BEGIN
    -- Retry loop for concurrency handling
    LOOP
        BEGIN
            -- Update sequence and get new value atomically with row lock
            UPDATE uhid_config
            SET current_sequence = current_sequence + 1,
                updated_at = NOW()
            WHERE hospital_id = p_hospital_id
            RETURNING prefix, current_sequence INTO v_prefix, v_sequence;

            -- If no config exists, create one
            IF NOT FOUND THEN
                INSERT INTO uhid_config (prefix, year_format, current_sequence, hospital_id)
                VALUES ('MH', 'YYYY', 1, p_hospital_id)
                RETURNING prefix, current_sequence INTO v_prefix, v_sequence;
            END IF;

            -- Get current year
            v_year := TO_CHAR(NOW(), 'YYYY');

            -- Format UHID: MH-2026-000001
            v_uhid := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');

            -- Verify UHID doesn't exist (extra safety check)
            IF NOT EXISTS (SELECT 1 FROM patients WHERE uhid = v_uhid) THEN
                RETURN v_uhid;
            ELSE
                -- If UHID exists, increment and retry
                RAISE NOTICE 'UHID % already exists, incrementing...', v_uhid;
                v_retry_count := v_retry_count + 1;
                IF v_retry_count >= v_max_retries THEN
                    RAISE EXCEPTION 'Failed to generate unique UHID after % retries', v_max_retries;
                END IF;
                CONTINUE;
            END IF;

        EXCEPTION
            WHEN unique_violation THEN
                -- Handle concurrent insertions
                v_retry_count := v_retry_count + 1;
                IF v_retry_count >= v_max_retries THEN
                    RAISE EXCEPTION 'Concurrent UHID generation failed after % retries', v_max_retries;
                END IF;
                PERFORM pg_sleep(0.1); -- Small delay before retry
                CONTINUE;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add unique index on UHID to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_uhid_unique ON patients(uhid);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ UHID SEQUENCE FIXED!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'UHID duplicates will no longer occur';
    RAISE NOTICE '';
END $$;
