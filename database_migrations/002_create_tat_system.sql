-- TAT (Turnaround Time) System Migration
-- For Magnus Hospital OPD Module
-- Date: February 16, 2026

-- 1. Create tat_config table for TAT thresholds and alerts
CREATE TABLE IF NOT EXISTS tat_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    
    -- TAT thresholds in minutes
    max_wait_time INT NOT NULL DEFAULT 30,          -- Max wait time before consultation
    max_consultation_time INT NOT NULL DEFAULT 15,  -- Max consultation duration
    max_total_tat INT NOT NULL DEFAULT 60,          -- Max total TAT (entry to exit)
    
    -- Alert configurations
    enable_wait_time_alerts BOOLEAN NOT NULL DEFAULT true,
    enable_consultation_alerts BOOLEAN NOT NULL DEFAULT true,
    enable_total_tat_alerts BOOLEAN NOT NULL DEFAULT true,
    
    -- Alert thresholds (percentage of max)
    warning_threshold INT NOT NULL DEFAULT 70,      -- 70% of max = warning
    critical_threshold INT NOT NULL DEFAULT 90,     -- 90% of max = critical
    
    -- Notification settings
    notify_staff BOOLEAN NOT NULL DEFAULT true,
    notify_management BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_hospital_tat_config UNIQUE (hospital_id)
);

-- 2. Add TAT columns to opd_queues table
ALTER TABLE opd_queues 
ADD COLUMN IF NOT EXISTS wait_time INT,                    -- Time spent waiting (minutes)
ADD COLUMN IF NOT EXISTS consultation_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consultation_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consultation_duration INT,        -- Consultation duration (minutes)
ADD COLUMN IF NOT EXISTS total_tat INT,                    -- Total TAT: entry to exit (minutes)
ADD COLUMN IF NOT EXISTS tat_status VARCHAR(20) DEFAULT 'normal' CHECK (tat_status IN ('normal', 'warning', 'critical', 'breached')),
ADD COLUMN IF NOT EXISTS tat_notes TEXT;

-- 3. Create patient_visits table for detailed visit tracking
CREATE TABLE IF NOT EXISTS patient_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES opd_queues(id) ON DELETE SET NULL,
    doctor_id UUID,
    department VARCHAR(100),
    
    -- Timestamps for each stage
    registration_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    triage_time TIMESTAMP WITH TIME ZONE,
    vitals_time TIMESTAMP WITH TIME ZONE,
    consultation_start_time TIMESTAMP WITH TIME ZONE,
    consultation_end_time TIMESTAMP WITH TIME ZONE,
    billing_time TIMESTAMP WITH TIME ZONE,
    discharge_time TIMESTAMP WITH TIME ZONE,
    
    -- Duration tracking (in minutes)
    wait_time INT,                    -- Registration to consultation start
    triage_duration INT,              -- Triage duration
    vitals_duration INT,              -- Vitals recording duration
    consultation_duration INT,        -- Consultation duration
    billing_duration INT,             -- Billing duration
    total_duration INT,               -- Total visit duration
    
    -- TAT status
    tat_status VARCHAR(20) DEFAULT 'normal' CHECK (tat_status IN ('normal', 'warning', 'critical', 'breached')),
    tat_notes TEXT,
    
    -- Visit details
    visit_type VARCHAR(50) DEFAULT 'opd' CHECK (visit_type IN ('opd', 'emergency', 'followup')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
    is_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_patient_visits_patient_id (patient_id),
    INDEX idx_patient_visits_queue_id (queue_id),
    INDEX idx_patient_visits_created_at (created_at),
    INDEX idx_patient_visits_tat_status (tat_status)
);

-- 4. Create function to calculate TAT
CREATE OR REPLACE FUNCTION calculate_tat(
    p_queue_id UUID
) RETURNS JSON AS $$
DECLARE
    v_queue RECORD;
    v_config RECORD;
    v_wait_time INT;
    v_consultation_duration INT;
    v_total_tat INT;
    v_status VARCHAR(20);
    v_notes TEXT;
BEGIN
    -- Get queue details
    SELECT * INTO v_queue FROM opd_queues WHERE id = p_queue_id;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Queue not found');
    END IF;
    
    -- Get TAT config
    SELECT * INTO v_config FROM tat_config WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
    IF NOT FOUND THEN
        -- Insert default config if not exists
        INSERT INTO tat_config (hospital_id) VALUES ('550e8400-e29b-41d4-a716-446655440000')
        RETURNING * INTO v_config;
    END IF;
    
    -- Calculate wait time (created_at to consultation_start_time)
    IF v_queue.consultation_start_time IS NOT NULL THEN
        v_wait_time := EXTRACT(EPOCH FROM (v_queue.consultation_start_time - v_queue.created_at)) / 60;
    ELSE
        v_wait_time := EXTRACT(EPOCH FROM (NOW() - v_queue.created_at)) / 60;
    END IF;
    
    -- Calculate consultation duration
    IF v_queue.consultation_start_time IS NOT NULL AND v_queue.consultation_end_time IS NOT NULL THEN
        v_consultation_duration := EXTRACT(EPOCH FROM (v_queue.consultation_end_time - v_queue.consultation_start_time)) / 60;
    ELSIF v_queue.consultation_start_time IS NOT NULL THEN
        v_consultation_duration := EXTRACT(EPOCH FROM (NOW() - v_queue.consultation_start_time)) / 60;
    ELSE
        v_consultation_duration := 0;
    END IF;
    
    -- Calculate total TAT
    IF v_queue.consultation_end_time IS NOT NULL THEN
        v_total_tat := EXTRACT(EPOCH FROM (v_queue.consultation_end_time - v_queue.created_at)) / 60;
    ELSE
        v_total_tat := EXTRACT(EPOCH FROM (NOW() - v_queue.created_at)) / 60;
    END IF;
    
    -- Determine TAT status
    v_status := 'normal';
    v_notes := '';
    
    -- Check wait time
    IF v_wait_time > v_config.max_wait_time THEN
        v_status := 'breached';
        v_notes := CONCAT(v_notes, 'Wait time breached. ');
    ELSIF v_wait_time > (v_config.max_wait_time * v_config.critical_threshold / 100) THEN
        v_status := 'critical';
        v_notes := CONCAT(v_notes, 'Wait time critical. ');
    ELSIF v_wait_time > (v_config.max_wait_time * v_config.warning_threshold / 100) THEN
        v_status := 'warning';
        v_notes := CONCAT(v_notes, 'Wait time warning. ');
    END IF;
    
    -- Check consultation time
    IF v_consultation_duration > v_config.max_consultation_time THEN
        v_status := 'breached';
        v_notes := CONCAT(v_notes, 'Consultation time breached. ');
    ELSIF v_consultation_duration > (v_config.max_consultation_time * v_config.critical_threshold / 100) THEN
        IF v_status != 'breached' THEN v_status := 'critical'; END IF;
        v_notes := CONCAT(v_notes, 'Consultation time critical. ');
    ELSIF v_consultation_duration > (v_config.max_consultation_time * v_config.warning_threshold / 100) THEN
        IF v_status NOT IN ('breached', 'critical') THEN v_status := 'warning'; END IF;
        v_notes := CONCAT(v_notes, 'Consultation time warning. ');
    END IF;
    
    -- Check total TAT
    IF v_total_tat > v_config.max_total_tat THEN
        v_status := 'breached';
        v_notes := CONCAT(v_notes, 'Total TAT breached. ');
    ELSIF v_total_tat > (v_config.max_total_tat * v_config.critical_threshold / 100) THEN
        IF v_status != 'breached' THEN v_status := 'critical'; END IF;
        v_notes := CONCAT(v_notes, 'Total TAT critical. ');
    ELSIF v_total_tat > (v_config.max_total_tat * v_config.warning_threshold / 100) THEN
        IF v_status NOT IN ('breached', 'critical') THEN v_status := 'warning'; END IF;
        v_notes := CONCAT(v_notes, 'Total TAT warning. ');
    END IF;
    
    -- Update queue with calculated TAT
    UPDATE opd_queues 
    SET wait_time = v_wait_time,
        consultation_duration = v_consultation_duration,
        total_tat = v_total_tat,
        tat_status = v_status,
        tat_notes = v_notes,
        updated_at = NOW()
    WHERE id = p_queue_id;
    
    -- Return calculated TAT
    RETURN json_build_object(
        'queue_id', p_queue_id,
        'wait_time', ROUND(v_wait_time, 1),
        'consultation_duration', ROUND(v_consultation_duration, 1),
        'total_tat', ROUND(v_total_tat, 1),
        'status', v_status,
        'notes', v_notes,
        'config', json_build_object(
            'max_wait_time', v_config.max_wait_time,
            'max_consultation_time', v_config.max_consultation_time,
            'max_total_tat', v_config.max_total_tat
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to update TAT when consultation starts/ends
CREATE OR REPLACE FUNCTION update_queue_tat()
RETURNS TRIGGER AS $$
BEGIN
    -- If consultation_start_time is set, calculate wait time
    IF NEW.consultation_start_time IS NOT NULL AND OLD.consultation_start_time IS NULL THEN
        NEW.wait_time := EXTRACT(EPOCH FROM (NEW.consultation_start_time - NEW.created_at)) / 60;
    END IF;
    
    -- If consultation_end_time is set, calculate consultation duration and total TAT
    IF NEW.consultation_end_time IS NOT NULL AND OLD.consultation_end_time IS NULL THEN
        NEW.consultation_duration := EXTRACT(EPOCH FROM (NEW.consultation_end_time - NEW.consultation_start_time)) / 60;
        NEW.total_tat := EXTRACT(EPOCH FROM (NEW.consultation_end_time - NEW.created_at)) / 60;
        
        -- Trigger TAT calculation
        PERFORM calculate_tat(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_tat_trigger
BEFORE UPDATE ON opd_queues
FOR EACH ROW
EXECUTE FUNCTION update_queue_tat();

-- 6. Insert default TAT configuration
INSERT INTO tat_config (hospital_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (hospital_id) DO NOTHING;

-- 7. Create view for TAT reports
CREATE OR REPLACE VIEW tat_reports AS
SELECT 
    q.id as queue_id,
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
    q.doctor_id,
    q.created_at as registration_time,
    q.consultation_start_time,
    q.consultation_end_time,
    q.wait_time,
    q.consultation_duration,
    q.total_tat,
    q.tat_status,
    q.tat_notes,
    CASE 
        WHEN q.tat_status = 'normal' THEN '✅'
        WHEN q.tat_status = 'warning' THEN '⚠️'
        WHEN q.tat_status = 'critical' THEN '🔴'
        WHEN q.tat_status = 'breached' THEN '⛔'
    END as status_icon
FROM opd_queues q
LEFT JOIN patients p ON q.patient_id = p.id
WHERE q.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 8. Create function to get TAT statistics
CREATE OR REPLACE FUNCTION get_tat_statistics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_queues', COUNT(*),
        'avg_wait_time', ROUND(AVG(wait_time) FILTER (WHERE wait_time IS NOT NULL), 1),
        'avg_consultation_time', ROUND(AVG(consultation_duration) FILTER (WHERE consultation_duration IS NOT NULL), 1),
        'avg_total_tat', ROUND(AVG(total_tat) FILTER (WHERE total_tat IS NOT NULL), 1),
        'tat_status_breakdown', json_build_object(
            'normal', COUNT(*) FILTER (WHERE tat_status = 'normal'),
            'warning', COUNT(*) FILTER (WHERE tat_status = 'warning'),
            'critical', COUNT(*) FILTER (WHERE tat_status = 'critical'),
            'breached', COUNT(*) FILTER (WHERE tat_status = 'breached')
        ),
        'breach_rate', ROUND(
            (COUNT(*) FILTER (WHERE tat_status IN ('critical', 'breached')) * 100.0 / 
            NULLIF(COUNT(*) FILTER (WHERE tat_status IS NOT NULL), 0)), 1
        )
    ) INTO v_stats
    FROM opd_queues
    WHERE created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day';
    
    RETURN COALESCE(v_stats, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Migration complete
COMMENT ON TABLE tat_config IS 'TAT (Turnaround Time) configuration for OPD queues';
COMMENT ON FUNCTION calculate_tat IS 'Calculates TAT metrics for a queue and updates status';
COMMENT ON VIEW tat_reports IS 'View for TAT reports and analytics';