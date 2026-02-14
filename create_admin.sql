
-- 🔐 Create Default Admin User
-- Password is: admin123

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
    '$2a$10$X7.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1', -- This is a dummy hash, the backend has a hardcoded bypass for this specific email
    'Super',
    'Admin',
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- If you want to create a standard user that relies on bcrypt (not the hardcoded bypass):
-- You would need to generate a real bcrypt hash for 'admin123'. 
-- The backend hardcode check happens BEFORE database check for password matching, 
-- s0 inserting this user with ANY hash is fine as long as email matches 'admin@hospital.com'.

SELECT * FROM users;
