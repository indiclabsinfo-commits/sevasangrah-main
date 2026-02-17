-- =====================================================
-- HRM SELF-SERVICE MODULE - DATABASE MIGRATION
-- Magnus Hospital HMS
-- Date: 2025-02-17
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LEAVE APPLICATIONS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_half_day BOOLEAN DEFAULT FALSE,
    half_day_type VARCHAR(20) CHECK (half_day_type IN ('first_half', 'second_half')),
    
    -- Details
    reason TEXT NOT NULL,
    contact_during_leave VARCHAR(20),
    address_during_leave TEXT,
    emergency_contact VARCHAR(20),
    
    -- Status & Workflow
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES employee_master(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Documents
    document_urls TEXT[], -- Array of document URLs
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Indexes for performance
CREATE INDEX idx_leave_applications_employee_id ON leave_applications(employee_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(start_date, end_date);

-- =====================================================
-- 2. EMPLOYEE NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    -- Notification details
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL 
        CHECK (type IN ('info', 'warning', 'success', 'error', 'leave', 'payroll', 'attendance')),
    
    -- Metadata
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT, -- URL to navigate when clicked
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=low, 5=high
    
    -- Expiry & Timing
    expires_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
);

-- Indexes
CREATE INDEX idx_employee_notifications_employee_id ON employee_notifications(employee_id);
CREATE INDEX idx_employee_notifications_is_read ON employee_notifications(is_read);
CREATE INDEX idx_employee_notifications_created_at ON employee_notifications(created_at DESC);

-- =====================================================
-- 3. PAYSLIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    -- Period
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    payroll_cycle_id UUID REFERENCES payroll_cycles(id),
    
    -- Salary Details
    basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    allowances JSONB DEFAULT '{}', -- { "hra": 5000, "conveyance": 2000, ... }
    deductions JSONB DEFAULT '{}', -- { "pf": 1800, "esi": 500, "tds": 1000, ... }
    net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Payment
    payment_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'processed', 'failed', 'cancelled')),
    bank_transaction_id VARCHAR(100),
    
    -- Document
    document_url TEXT, -- PDF URL
    document_hash VARCHAR(64), -- For verification
    
    -- Audit
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    
    -- Constraints
    UNIQUE(employee_id, month, year)
);

-- Indexes
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX idx_payslips_period ON payslips(year, month);
CREATE INDEX idx_payslips_payment_status ON payslips(payment_status);

-- =====================================================
-- 4. EMPLOYEE PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL UNIQUE REFERENCES employee_master(id),
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    
    -- UI Preferences
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Privacy Settings
    show_contact_info BOOLEAN DEFAULT TRUE,
    show_birthday BOOLEAN DEFAULT TRUE,
    show_anniversary BOOLEAN DEFAULT TRUE,
    
    -- Data
    preferences JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- =====================================================
-- 5. ATTENDANCE LOGS (Enhanced for self-service)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_logs_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    -- Date & Time
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'absent'
        CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday', 'weekoff')),
    
    -- Location (for GPS tracking)
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_out_latitude DECIMAL(10, 8),
    check_out_longitude DECIMAL(11, 8),
    
    -- Device Info
    device_id VARCHAR(100),
    device_type VARCHAR(50),
    
    -- Regularization
    is_regularized BOOLEAN DEFAULT FALSE,
    regularization_reason TEXT,
    regularized_by UUID REFERENCES employee_master(id),
    regularized_at TIMESTAMP WITH TIME ZONE,
    
    -- Overtime
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    UNIQUE(employee_id, attendance_date)
);

-- Indexes
CREATE INDEX idx_attendance_logs_employee_date ON attendance_logs_enhanced(employee_id, attendance_date);
CREATE INDEX idx_attendance_logs_status ON attendance_logs_enhanced(status);
CREATE INDEX idx_attendance_logs_regularized ON attendance_logs_enhanced(is_regularized);

-- =====================================================
-- 6. TAX DECLARATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    financial_year INTEGER NOT NULL,
    
    -- Investment Declarations
    section_80c DECIMAL(12, 2) DEFAULT 0, -- PPF, ELSS, etc.
    section_80d DECIMAL(12, 2) DEFAULT 0, -- Medical Insurance
    section_80e DECIMAL(12, 2) DEFAULT 0, -- Education Loan
    section_24b DECIMAL(12, 2) DEFAULT 0, -- Home Loan Interest
    other_deductions DECIMAL(12, 2) DEFAULT 0,
    
    -- Proof Documents
    proof_documents JSONB DEFAULT '[]', -- Array of document metadata
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'verified', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES employee_master(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    -- Calculated Values
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    tax_savings DECIMAL(12, 2) DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    UNIQUE(employee_id, financial_year)
);

-- =====================================================
-- 7. EMPLOYEE DOCUMENTS REPOSITORY
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    -- Document Info
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- File Details
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    is_expired BOOLEAN GENERATED ALWAYS AS (
        valid_until IS NOT NULL AND valid_until < CURRENT_DATE
    ) STORED,
    
    -- Access Control
    is_private BOOLEAN DEFAULT TRUE, -- Only employee can view if true
    shared_with JSONB DEFAULT '[]', -- Array of department/role IDs that can access
    
    -- Audit
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- Indexes
CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX idx_employee_documents_expired ON employee_documents(is_expired);

-- =====================================================
-- 8. HOLIDAY CALENDAR
-- =====================================================
CREATE TABLE IF NOT EXISTS holiday_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Holiday Details
    holiday_name VARCHAR(200) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(50) DEFAULT 'public' 
        CHECK (holiday_type IN ('public', 'restricted', 'optional', 'festival')),
    
    -- Description
    description TEXT,
    applicable_departments UUID[] DEFAULT '{}', -- Empty array = all departments
    
    -- Yearly Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- 'yearly', 'monthly', etc.
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    UNIQUE(holiday_date, holiday_name)
);

-- Index for quick holiday lookups
CREATE INDEX idx_holiday_calendar_date ON holiday_calendar(holiday_date);
CREATE INDEX idx_holiday_calendar_type ON holiday_calendar(holiday_type);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendar ENABLE ROW LEVEL SECURITY;

-- Leave Applications: Employees can only see their own
CREATE POLICY "Employees can view own leave applications" 
    ON leave_applications FOR SELECT 
    USING (employee_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM employee_master WHERE id = auth.uid() AND role_id IN ('admin', 'hr_manager')));

-- Notifications: Employees can only see their own
CREATE POLICY "Employees can view own notifications" 
    ON employee_notifications FOR SELECT 
    USING (employee_id = auth.uid());

-- Payslips: Employees can only see their own
CREATE POLICY "Employees can view own payslips" 
    ON payslips FOR SELECT 
    USING (employee_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM employee_master WHERE id = auth.uid() AND role_id IN ('admin', 'hr_manager', 'finance_manager')));

-- Preferences: Employees can only manage their own
CREATE POLICY "Employees can manage own preferences" 
    ON employee_preferences FOR ALL 
    USING (employee_id = auth.uid());

-- Attendance: Employees can only see their own
CREATE POLICY "Employees can view own attendance" 
    ON attendance_logs_enhanced FOR SELECT 
    USING (employee_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM employee_master WHERE id = auth.uid() AND role_id IN ('admin', 'hr_manager', 'department_head')));

-- Tax Declarations: Employees can only see their own
CREATE POLICY "Employees can manage own tax declarations" 
    ON tax_declarations FOR ALL 
    USING (employee_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM employee_master WHERE id = auth.uid() AND role_id IN ('admin', 'hr_manager', 'finance_manager')));

-- Documents: Employees can see their own private docs, HR can see all
CREATE POLICY "Employees can view own documents" 
    ON employee_documents FOR SELECT 
    USING (employee_id = auth.uid() OR 
           (NOT is_private AND EXISTS (SELECT 1 FROM employee_master WHERE id = auth.uid())) OR
           EXISTS (SELECT 1 FROM employee_master WHERE id = auth.uid() AND role_id IN ('admin', 'hr_manager')));

-- Holidays: Everyone can view
CREATE POLICY "Everyone can view holidays" 
    ON holiday_calendar FOR SELECT 
    USING (true);

-- =====================================================
-- 10. SEED DATA
-- =====================================================

-- Insert sample holidays for current year
INSERT INTO holiday_calendar (holiday_name, holiday_date, holiday_type, description) VALUES
('Republic Day', '2025-01-26', 'public', 'National holiday'),
('Holi', '2025-03-14', 'festival', 'Festival of colors'),
('Good Friday', '2025-04-18', 'public', 'Christian holiday'),
('Eid al-Fitr', '2025-03-31', 'festival', 'Islamic holiday'),
('Independence Day', '2025-08-15', 'public', 'National holiday'),
('Ganesh Chaturthi', '2025-09-07', 'festival', 'Hindu festival'),
('Dussehra', '2025-10-02', 'festival', 'Hindu festival'),
('Diwali', '2025-10-23', 'festival', 'Festival of lights'),
('Christmas', '2025-12-25', 'public', 'Christian holiday')
ON CONFLICT (holiday_date, holiday_name) DO NOTHING;

-- =====================================================
-- 11. UPDATE TRIGGERS
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_leave_applications_updated_at
    BEFORE UPDATE ON leave_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_preferences_updated_at
    BEFORE UPDATE ON employee_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_logs_enhanced_updated_at
    BEFORE UPDATE ON attendance_logs_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_declarations_updated_at
    BEFORE UPDATE ON tax_declarations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. FUNCTIONS FOR SELF-SERVICE
-- =====================================================

-- Function to get employee leave balance
CREATE OR REPLACE FUNCTION get_employee_leave_balance(
    p_employee_id UUID,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
)
RETURNS TABLE (
    leave_type_code VARCHAR(10),
    leave_type_name VARCHAR(100),
    total_allocated INTEGER,
    used_days INTEGER,
    available_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lt.code AS leave_type_code,
        lt.name AS leave_type_name,
        COALESCE(la.total_days, lt.max_days) AS total_allocated,
        COALESCE(SUM(
            CASE 
                WHEN la.status = 'approved' THEN 
                    CASE 
                        WHEN la.is_half_day THEN 0.5
                        ELSE DATE_PART('day', la.end_date - la.start_date) + 1
                    END
                ELSE 0
            END
        ), 0)::INTEGER AS used_days,
        COALESCE(la.total_days, lt.max_days) - COALESCE(SUM(
            CASE 
                WHEN la.status = 'approved' THEN 
                    CASE 
                        WHEN la.is_half_day THEN 0.5
                        ELSE DATE_PART('day', la.end_date - la.start_date) + 1
                    END
                ELSE 0
            END
        ), 0)::INTEGER AS available_days
    FROM leave_types lt
    LEFT JOIN leave_applications la ON lt.id = la.leave_type_id 
        AND la.employee_id = p_employee_id
        AND EXTRACT(YEAR FROM la.start_date) = p_year
        AND la.status = 'approved'
    GROUP BY lt.id, lt.code, lt.name, lt.max_days, la.total_days;
END;
$$ LANGUAGE plpgsql;

-- Function to check if date is working day (excludes weekends and holidays)
CREATE OR REPLACE FUNCTION is_working_day(p_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_weekend BOOLEAN;
    v_is_holiday BOOLEAN;
BEGIN
    -- Check if weekend (Saturday = 6, Sunday = 0)
    v_is_weekend := EXTRACT(DOW FROM p_date) IN (0, 6);
    
    -- Check if holiday
    SELECT EXISTS (
        SELECT 1 FROM holiday_calendar 
        WHERE holiday_date = p_date
    ) INTO v_is_holiday;
    
    RETURN NOT (v_is_weekend OR v_is_holiday);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate working days between two dates
CREATE OR REPLACE FUNCTION calculate_working_days(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_current_date DATE := p_start_date;
    v_working_days INTEGER := 0;
BEGIN
    WHILE v_current_date <= p_end_date LOOP
        IF is_working_day(v_current_date) THEN
            v_working_days := v_working_days + 1;
        END IF;
        v_current_date := v_current_date + 1;
    END LOOP;
    
    RETURN v_working_days;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Comment: HRM Self-Service Module Database Schema
-- Created: 2025-02-17
-- Purpose: Support employee self-service features including:
--          - Leave applications
--          - Payslip access
--          - Attendance tracking
--          - Tax declarations
--          - Notifications
--          - Document repository