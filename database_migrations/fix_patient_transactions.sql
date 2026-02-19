-- ==========================================
-- FIX PATIENT_TRANSACTIONS TABLE
-- Adds missing columns and relaxes constraints
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Add missing columns that the app sends
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COMPLETED';
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS transaction_date TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS discount_reason TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS online_payment_method TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS rghs_number TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- The original schema has strict CHECK constraints that reject
-- the values the app sends (uppercase vs lowercase, extra values).
-- We need to DROP and recreate without constraints.

-- Drop old constraints
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_transaction_type_check;
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_payment_mode_check;

-- Make department and description optional (app doesn't always send them)
ALTER TABLE patient_transactions ALTER COLUMN department DROP NOT NULL;
ALTER TABLE patient_transactions ALTER COLUMN description DROP NOT NULL;

-- Fix RLS policies for patient_transactions
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON patient_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON patient_transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON patient_transactions;
DROP POLICY IF EXISTS "Allow all read transactions" ON patient_transactions;
DROP POLICY IF EXISTS "Allow all insert transactions" ON patient_transactions;
DROP POLICY IF EXISTS "Allow all update transactions" ON patient_transactions;
DROP POLICY IF EXISTS "Allow all delete transactions" ON patient_transactions;

ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read patient_transactions" ON patient_transactions FOR SELECT USING (true);
CREATE POLICY "Allow all insert patient_transactions" ON patient_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update patient_transactions" ON patient_transactions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete patient_transactions" ON patient_transactions FOR DELETE USING (true);

-- Grant permissions to both anon and authenticated
GRANT ALL ON TABLE patient_transactions TO anon;
GRANT ALL ON TABLE patient_transactions TO authenticated;

-- Also fix patient_admissions RLS
DROP POLICY IF EXISTS "Allow all read patient_admissions" ON patient_admissions;
DROP POLICY IF EXISTS "Allow all insert patient_admissions" ON patient_admissions;
DROP POLICY IF EXISTS "Allow all update patient_admissions" ON patient_admissions;

ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read patient_admissions" ON patient_admissions FOR SELECT USING (true);
CREATE POLICY "Allow all insert patient_admissions" ON patient_admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update patient_admissions" ON patient_admissions FOR UPDATE USING (true);

GRANT ALL ON TABLE patient_admissions TO anon;
GRANT ALL ON TABLE patient_admissions TO authenticated;

-- Verify
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('patient_transactions', 'patient_admissions')
ORDER BY tablename, policyname;
