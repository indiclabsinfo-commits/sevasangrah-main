-- ==========================================
-- FIX RLS POLICIES FOR PATIENT REGISTRATION
-- Run this in the Supabase SQL Editor
-- ==========================================
-- The issue: RLS policies only allow 'authenticated' role,
-- but the anon key uses 'anon' role. This causes inserts to
-- silently return empty arrays (HTTP 200 with []).

-- Option: Add policies that allow anon users full access
-- (since the app handles its own authentication)

-- Drop restrictive policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;

-- Create permissive policies for both anon and authenticated
CREATE POLICY "Allow all read patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow all insert patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update patients" ON patients FOR UPDATE USING (true);
CREATE POLICY "Allow all delete patients" ON patients FOR DELETE USING (true);

-- Also fix transactions table
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;

-- Check if transactions table has RLS enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow all insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update transactions" ON transactions FOR UPDATE USING (true);

-- Fix hospitals table too
DROP POLICY IF EXISTS "Authenticated users can read hospitals" ON hospitals;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read hospitals" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Allow all insert hospitals" ON hospitals FOR INSERT WITH CHECK (true);

-- Fix uhid_config table
ALTER TABLE uhid_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read uhid_config" ON uhid_config FOR SELECT USING (true);
CREATE POLICY "Allow all insert uhid_config" ON uhid_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update uhid_config" ON uhid_config FOR UPDATE USING (true);

-- Grant permissions  
GRANT ALL ON TABLE patients TO anon;
GRANT ALL ON TABLE patients TO authenticated;
GRANT ALL ON TABLE transactions TO anon;
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE hospitals TO anon;
GRANT ALL ON TABLE hospitals TO authenticated;
GRANT ALL ON TABLE uhid_config TO anon;
GRANT ALL ON TABLE uhid_config TO authenticated;
GRANT EXECUTE ON FUNCTION generate_uhid TO anon;
GRANT EXECUTE ON FUNCTION generate_uhid TO authenticated;

-- Verify
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('patients', 'transactions', 'hospitals', 'uhid_config');
