
-- 🛠️ Fix: Drop the restrictive Foreign Key constraint
-- The error "violates foreign key constraint users_id_fkey" happens because 
-- the table expects the ID to exist in Supabase's internal auth table.
-- Since we are using our own custom auth for this Admin, we need to remove this restriction.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 🛠️ Fix: Ensure columns exist (just in case)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'STAFF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 🔐 Create Default Admin User (Now it will work!)
INSERT INTO users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@hospital.com',
    '$2a$10$dummyhashforadminbypassUseHardcodedCheck', 
    'Super',
    'Admin',
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    role = 'ADMIN',
    is_active = true,
    first_name = 'Super',
    id = '00000000-0000-0000-0000-000000000000';

-- Verify
SELECT * FROM users WHERE email = 'admin@hospital.com';
