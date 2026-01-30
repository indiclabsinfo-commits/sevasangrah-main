# Supabase Backend Setup Guide

## Step 1: Get Your Supabase Database Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (⚙️ icon) → **Database**
4. Under **Connection string** section, find:
   - **Host**: `db.xxx.supabase.co` (where xxx is your project ref)
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: Your database password set during project creation

## Step 2: Update Backend .env File

Edit `/Users/mac/Desktop/Demo-Sevasangraha/backend/.env`:

```env
# Supabase PostgreSQL Configuration
AZURE_DB_HOST=db.YOUR_PROJECT_REF.supabase.co
AZURE_DB_PORT=5432
AZURE_DB_NAME=postgres
AZURE_DB_USER=postgres
AZURE_DB_PASSWORD=YOUR_DATABASE_PASSWORD

# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_DATABASE_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="development"
PORT=3002

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 3: Create Admin User in Supabase

Run the `SIMPLE_CREATE_ADMIN.sql` script in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Paste and run:

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
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

-- Create admin user
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
SET password_hash = crypt('admin123', gen_salt('bf')), is_active = true;

-- Verify
SELECT id, email, first_name, last_name, role, is_active 
FROM users WHERE email = 'admin@hospital.com';
```

## Step 4: Test Login

Login credentials:
- **Email**: `admin@hospital.com`
- **Password**: `admin123`

## Troubleshooting

If you can't find your database password:
1. Go to **Settings** → **Database**
2. Click **Reset database password**
3. Copy the new password and update your .env file
