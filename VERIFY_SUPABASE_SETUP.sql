-- Verification SQL - Run this in Supabase SQL Editor
-- This will check if everything is set up correctly

-- 1. Check if pgcrypto extension is enabled (needed for password hashing)
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- 2. Check if users table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
);

-- 3. Check if admin user exists
SELECT 
    id,
    email, 
    first_name,
    last_name,
    role, 
    is_active,
    created_at,
    LENGTH(password_hash) as password_hash_length,
    SUBSTRING(password_hash, 1, 10) as password_hash_preview
FROM users 
WHERE email = 'admin@hospital.com';

-- 4. Count total users
SELECT COUNT(*) as total_users FROM users;

-- Expected Results:
-- Query 1: Should show pgcrypto extension
-- Query 2: Should return 'true'
-- Query 3: Should return 1 row with admin@hospital.com, role='ADMIN', is_active=true
-- Query 4: Should be at least 1

-- If Query 3 returns no rows, the admin user was NOT created
-- If password_hash_length is very short (like 6-10), password is not properly hashed
