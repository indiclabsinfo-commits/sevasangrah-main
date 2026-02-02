-- Add RGHS support to patient_transactions table

-- 1. Add rghs_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patient_transactions' 
        AND column_name = 'rghs_number'
    ) THEN
        ALTER TABLE patient_transactions ADD COLUMN rghs_number TEXT;
        RAISE NOTICE 'Added rghs_number column';
    ELSE
        RAISE NOTICE 'rghs_number column already exists';
    END IF;
END $$;

-- 2. Update payment_mode check constraint to include 'RGHS'
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all constraints on payment_mode to be safe and recreate one
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'patient_transactions' AND column_name = 'payment_mode'
    ) LOOP
        EXECUTE 'ALTER TABLE patient_transactions DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped constraint %', r.constraint_name;
    END LOOP;
END $$;

-- 3. Add the new constraint with RGHS included (and other missing modes found during development)
ALTER TABLE patient_transactions 
ADD CONSTRAINT patient_transactions_payment_mode_check 
CHECK (payment_mode IN ('cash', 'online', 'card', 'upi', 'insurance', 'adjustment', 'rghs', 'cheque', 'bank_transfer', 'CREDIT', 'DEBIT', 'neft', 'rtgs'));

-- Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' AND column_name = 'rghs_number';
