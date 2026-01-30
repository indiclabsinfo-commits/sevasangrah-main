-- SIMPLE ADMIN USER FIX FOR AZURE POSTGRESQL/SUPABASE
-- This creates the admin user that works with your backend server.js
-- Credentials: admin@hospital.com / admin123

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'FRONTDESK')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin user with bcrypt password hash
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
VALUES (
    'admin@hospital.com', 
    crypt('admin123', gen_salt('bf')), 
    'Admin', 
    'User', 
    'ADMIN',
    true
)
ON CONFLICT (email) DO UPDATE 
SET 
    password_hash = crypt('admin123', gen_salt('bf')),
    is_active = true,
    role = 'ADMIN';

-- Verify admin user exists
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_active,
    created_at
FROM users 
WHERE email = 'admin@hospital.com';

-- Show success message
SELECT '✅ Admin user created successfully! Login with: admin@hospital.com / admin123' as status;
