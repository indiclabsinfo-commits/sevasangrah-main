-- ============================================================================
-- QUICK SUPABASE SETUP - Essential Tables Only
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/plkbxjedbjpmbfrekmrr
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    department VARCHAR(100),
    consultation_fee DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. DOCTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. PATIENTS TABLE (MOST IMPORTANT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    blood_group VARCHAR(10),
    aadhar_number VARCHAR(20),
    abha_id VARCHAR(50),
    rghs_number VARCHAR(50),
    date_of_birth DATE,
    patient_tag VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. PATIENT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. PATIENT ADMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    admission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP WITH TIME ZONE,
    department_id UUID REFERENCES departments(id),
    doctor_id UUID REFERENCES doctors(id),
    bed_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'admitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. BEDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_number VARCHAR(50) UNIQUE NOT NULL,
    ward VARCHAR(100),
    bed_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. DAILY EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON patient_admissions(patient_id);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert default departments
INSERT INTO departments (name, description) VALUES
    ('General Medicine', 'General medical consultation and treatment'),
    ('Pediatrics', 'Child healthcare'),
    ('Orthopedics', 'Bone and joint care'),
    ('Cardiology', 'Heart care'),
    ('Neurology', 'Brain and nervous system'),
    ('Gynecology', 'Women''s health'),
    ('Dermatology', 'Skin care'),
    ('ENT', 'Ear, Nose, and Throat')
ON CONFLICT DO NOTHING;

-- Insert sample doctors
INSERT INTO doctors (name, specialization, phone, email) VALUES
    ('Dr. Ratul Peepawala', 'General Physician', '9999999999', 'ratul@hospital.com'),
    ('Dr. Amit Sharma', 'Pediatrician', '9999999998', 'amit@hospital.com'),
    ('Dr. Priya Singh', 'Orthopedic', '9999999997', 'priya@hospital.com'),
    ('Dr. Rajesh Kumar', 'Cardiologist', '9999999996', 'rajesh@hospital.com'),
    ('Dr. Neha Gupta', 'Gynecologist', '9999999995', 'neha@hospital.com')
ON CONFLICT DO NOTHING;

-- Insert sample beds
INSERT INTO beds (bed_number, ward, bed_type, status) VALUES
    ('101', 'General Ward', 'General', 'AVAILABLE'),
    ('102', 'General Ward', 'General', 'AVAILABLE'),
    ('201', 'ICU', 'ICU', 'AVAILABLE'),
    ('202', 'ICU', 'ICU', 'AVAILABLE'),
    ('301', 'Private', 'Private', 'AVAILABLE'),
    ('302', 'Private', 'Private', 'AVAILABLE'),
    ('401', 'Pediatric', 'Pediatric', 'AVAILABLE'),
    ('402', 'Pediatric', 'Pediatric', 'AVAILABLE')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON patient_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on admissions" ON patient_admissions FOR ALL USING (true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Database setup complete! You can now create patients.' as status;
