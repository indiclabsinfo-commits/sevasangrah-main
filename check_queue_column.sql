-- Check what columns exist in opd_queue table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opd_queue'
ORDER BY ordinal_position;
