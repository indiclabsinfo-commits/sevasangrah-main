-- ==========================================
-- CHECK OPD QUEUE TABLE COLUMNS
-- Run this to see actual column names
-- ==========================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'opd_queue'
ORDER BY ordinal_position;
