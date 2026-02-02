-- ============================================
-- DATABASE RESET SCRIPT FOR CLIENT DEPLOYMENT
-- ============================================
-- This script removes all patient data, transactions, and operational records
-- while preserving the database structure and admin users
-- 
-- IMPORTANT: Run this script in Supabase SQL Editor before client deployment
-- ============================================

-- 1. DISABLE TRIGGERS (to avoid constraint issues during deletion)
SET session_replication_role = 'replica';

-- 2. DELETE ALL PATIENT-RELATED DATA
-- Using DO blocks to handle tables that may not exist

-- Delete patient transactions (bills, payments, services)
DO $$
BEGIN
    DELETE FROM patient_transactions;
    TRUNCATE TABLE patient_transactions RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table patient_transactions does not exist, skipping';
END $$;

-- Delete patient refunds (if table exists)
DO $$
BEGIN
    DELETE FROM patient_refunds;
    TRUNCATE TABLE patient_refunds RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table patient_refunds does not exist, skipping';
END $$;

-- Delete patient admissions (IPD records)
DO $$
BEGIN
    DELETE FROM patient_admissions;
    TRUNCATE TABLE patient_admissions RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table patient_admissions does not exist, skipping';
END $$;

-- Delete patient services
DO $$
BEGIN
    DELETE FROM patient_services;
    TRUNCATE TABLE patient_services RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table patient_services does not exist, skipping';
END $$;

-- Delete all patients
DO $$
BEGIN
    DELETE FROM patients;
    TRUNCATE TABLE patients RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table patients does not exist, skipping';
END $$;

-- 3. DELETE OPERATIONAL DATA

-- Delete daily expenses
DO $$
BEGIN
    DELETE FROM daily_expenses;
    TRUNCATE TABLE daily_expenses RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table daily_expenses does not exist, skipping';
END $$;

-- Delete appointments
DO $$
BEGIN
    DELETE FROM appointments;
    TRUNCATE TABLE appointments RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table appointments does not exist, skipping';
END $$;

-- Delete queue entries
DO $$
BEGIN
    DELETE FROM queue_entries;
    TRUNCATE TABLE queue_entries RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table queue_entries does not exist, skipping';
END $$;

-- 4. DELETE BILLING DATA

-- Delete bills
DO $$
BEGIN
    DELETE FROM bills;
    TRUNCATE TABLE bills RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table bills does not exist, skipping';
END $$;

-- Delete bill items
DO $$
BEGIN
    DELETE FROM bill_items;
    TRUNCATE TABLE bill_items RESTART IDENTITY CASCADE;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table bill_items does not exist, skipping';
END $$;

-- 5. RE-ENABLE TRIGGERS
SET session_replication_role = 'origin';

-- 6. VERIFICATION QUERIES
-- Run these to verify the database is clean

DO $$
DECLARE
    patient_count INTEGER;
    transaction_count INTEGER;
    admission_count INTEGER;
    expense_count INTEGER;
BEGIN
    -- Count patients
    SELECT COUNT(*) INTO patient_count FROM patients;
    RAISE NOTICE 'Patients: %', patient_count;
    
    -- Count transactions
    SELECT COUNT(*) INTO transaction_count FROM patient_transactions;
    RAISE NOTICE 'Patient Transactions: %', transaction_count;
    
    -- Count admissions
    BEGIN
        SELECT COUNT(*) INTO admission_count FROM patient_admissions;
        RAISE NOTICE 'Patient Admissions: %', admission_count;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Patient Admissions: table does not exist';
    END;
    
    -- Count expenses
    BEGIN
        SELECT COUNT(*) INTO expense_count FROM daily_expenses;
        RAISE NOTICE 'Daily Expenses: %', expense_count;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Daily Expenses: table does not exist';
    END;
END $$;

-- 7. VERIFY ADMIN USERS ARE PRESERVED
SELECT 'Admin users preserved:' as status;
SELECT id, email, role, created_at 
FROM users 
WHERE role = 'admin'
ORDER BY created_at;

-- ============================================
-- NOTES:
-- - This script PRESERVES: users, doctors, services, departments, settings
-- - This script DELETES: all patient records, transactions, bills, expenses, appointments
-- - After running this script, the client will have a clean database
-- - The script handles missing tables gracefully
-- ============================================
