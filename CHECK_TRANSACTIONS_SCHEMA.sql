-- Check patient_transactions table schema
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patient_transactions'
ORDER BY ordinal_position;
