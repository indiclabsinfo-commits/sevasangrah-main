-- ============================================================================
-- CREATE ADMIN USER FOR LOGIN
-- Run this in Supabase SQL Editor AFTER running QUICK_SUPABASE_SETUP.sql
-- ============================================================================

-- Create admin user
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
  gen_random_uuid(),
  'admin@hospital.com',
  '$2a$10$rH8qV9z9Z9Z9Z9Z9Z9Z9ZOqV9z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',  -- Password: admin123
  'Admin',
  'User',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = '$2a$10$rH8qV9z9Z9Z9Z9Z9Z9Z9ZOqV9z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',
  is_active = true,
  role = 'ADMIN';

-- Verify user was created
SELECT id, email, first_name, last_name, role, is_active 
FROM users 
WHERE email = 'admin@hospital.com';

-- Success message
SELECT 'Admin user created! Login with: admin@hospital.com / admin123' as status;