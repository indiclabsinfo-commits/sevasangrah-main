
-- 🛠️ Fix: Add all missing columns to 'users' table
-- This ensures the table matches what the backend code expects.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'STAFF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 🔐 Create Default Admin User
-- Email: admin@hospital.com
-- Password: admin123 (Backend has a hardcoded bypass for this email, so hash doesn't matter for login, 
-- but we set a dummy one just in case)

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
    password_hash = '$2a$10$dummyhashforadminbypassUseHardcodedCheck';

-- Verify the user exists
SELECT id, email, role, is_active FROM users WHERE email = 'admin@hospital.com';
