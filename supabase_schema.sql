-- Supabase Schema Analysis
-- Generated: 2026-02-21T09:03:49.044Z
-- Total Tables: 9

-- PATIENTS (0 rows)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  prefix TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  medical_history TEXT NOT NULL,
  allergies TEXT NOT NULL,
  current_medications TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  notes TEXT NOT NULL,
  date_of_entry TIMESTAMP NOT NULL,
  patient_tag TEXT NOT NULL,
  is_active BOOLEAN NOT NULL,
  hospital_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  created_by TEXT,
  aadhaar_number TEXT,
  abha_id TEXT NOT NULL,
  assigned_department TEXT NOT NULL,
  assigned_doctor TEXT NOT NULL,
  date_of_birth TIMESTAMP NOT NULL,
  photo_url TEXT,
  has_reference BOOLEAN NOT NULL,
  reference_details TEXT NOT NULL,
  queue_no INTEGER NOT NULL,
  queue_status TEXT NOT NULL,
  queue_date TEXT,
  has_pending_appointment BOOLEAN NOT NULL,
  rghs_number TEXT,
  token_number TEXT,
  uhid TEXT,
  photo_thumbnail_url TEXT,
  photo_uploaded_at TEXT
);

-- DOCTORS (0 rows)
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  specialization TEXT NOT NULL,
  fee INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  consultation_fee INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  experience_years TEXT
);

-- APPOINTMENTS (0 rows)
CREATE TABLE IF NOT EXISTS appointments (
);

-- PRESCRIPTIONS (0 rows)
CREATE TABLE IF NOT EXISTS prescriptions (
);

-- BILLS (0 rows)
CREATE TABLE IF NOT EXISTS bills (
);

-- DEPARTMENTS (0 rows)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- MEDICINES (0 rows)
CREATE TABLE IF NOT EXISTS medicines (
);

-- USERS (0 rows)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  specialization TEXT,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  password_hash TEXT NOT NULL
);

-- TRANSACTIONS (0 rows)
CREATE TABLE IF NOT EXISTS transactions (
);

