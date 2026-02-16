-- Notification System Migration
-- Features #10, #11, #32: WhatsApp/SMS notifications
-- Date: February 16, 2026
-- ZERO-COST IMPLEMENTATION: Mock system first, real integration later

-- 1. Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL DEFAULT 'sms', -- sms, whatsapp, email, push
    category VARCHAR(50) NOT NULL DEFAULT 'appointment', -- appointment, followup, payment, lab, general
    language VARCHAR(10) NOT NULL DEFAULT 'en', -- en, hi, etc.
    content TEXT NOT NULL, -- Template with variables
    variables JSONB NOT NULL DEFAULT '[]', -- Available variables for this template
    character_count INTEGER GENERATED ALWAYS AS (LENGTH(content)) STORED,
    is_active BOOLEAN DEFAULT true,
    requires_dlt BOOLEAN DEFAULT false, -- For Indian SMS regulations
    dlt_template_id VARCHAR(100), -- DLT registered template ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_number VARCHAR(50) NOT NULL UNIQUE, -- Format: NOTIF-YYYY-MM-XXXXX
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    template_id UUID REFERENCES notification_templates(id),
    
    -- Recipient information
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'patient', -- patient, doctor, staff, other
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_email VARCHAR(100),
    
    -- Message details
    message_type VARCHAR(50) NOT NULL DEFAULT 'sms', -- sms, whatsapp, email, push
    message_category VARCHAR(50) NOT NULL DEFAULT 'appointment',
    subject VARCHAR(200), -- For email
    message_content TEXT NOT NULL,
    variables_used JSONB, -- Variables that were replaced
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Provider information (for real integration)
    provider VARCHAR(50) DEFAULT 'mock', -- twilio, msg91, kaleyra, whatsapp, mock
    provider_message_id VARCHAR(100),
    provider_status VARCHAR(50),
    provider_response JSONB,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, queued, sending, sent, delivered, failed
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Cost tracking (for real integration)
    estimated_cost DECIMAL(10,4) DEFAULT 0,
    actual_cost DECIMAL(10,4) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create notification_logs table for audit
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL, -- created, scheduled, sending, sent, delivered, failed, retry
    log_message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create provider_configurations table (for real integration later)
CREATE TABLE IF NOT EXISTS provider_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL UNIQUE, -- twilio, msg91, whatsapp, etc.
    provider_type VARCHAR(50) NOT NULL, -- sms, whatsapp, email, push
    is_active BOOLEAN DEFAULT false, -- Turn on when ready for real integration
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    api_url VARCHAR(500),
    sender_id VARCHAR(100), -- For SMS
    whatsapp_business_id VARCHAR(100),
    whatsapp_template_namespace VARCHAR(100),
    default_country_code VARCHAR(5) DEFAULT '91',
    rate_limit_per_minute INTEGER DEFAULT 60,
    balance DECIMAL(10,2) DEFAULT 0,
    last_balance_check TIMESTAMP WITH TIME ZONE,
    config_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create notification_schedules table
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_name VARCHAR(100) NOT NULL UNIQUE,
    schedule_type VARCHAR(50) NOT NULL DEFAULT 'appointment_reminder',
    template_id UUID REFERENCES notification_templates(id),
    
    -- Timing rules
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'before_appointment', -- before_appointment, after_appointment, fixed_time, cron
    trigger_value INTEGER, -- Hours before/after appointment
    trigger_cron VARCHAR(100), -- Cron expression for fixed schedules
    
    -- Recipient rules
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'patient',
    recipient_filter JSONB, -- Filter criteria for recipients
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_run ON notification_schedules(next_run) WHERE is_active = true;

-- 6. Insert default notification templates (MOCK - Zero cost implementation)
INSERT INTO notification_templates (template_name, template_type, category, language, content, variables, requires_dlt) VALUES
-- Appointment Reminders
('Appointment Reminder - 24 Hours', 'sms', 'appointment', 'en',
'Dear {patient_name}, your appointment with Dr. {doctor_name} is scheduled for {appointment_date} at {appointment_time}. Please arrive 15 minutes early. Magnus Hospital',
'["patient_name", "doctor_name", "appointment_date", "appointment_time", "hospital_name"]', true),

('Appointment Reminder - 2 Hours', 'sms', 'appointment', 'en',
'Reminder: Your appointment with Dr. {doctor_name} is at {appointment_time} today. Clinic: {clinic_location}. Magnus Hospital',
'["doctor_name", "appointment_time", "clinic_location", "hospital_name"]', true),

('Appointment Reminder - WhatsApp', 'whatsapp', 'appointment', 'en',
'*Appointment Reminder*

Dear {patient_name},

Your appointment details:
• Doctor: Dr. {doctor_name}
• Date: {appointment_date}
• Time: {appointment_time}
• Location: {clinic_location}

Please arrive 15 minutes early.

For queries: {hospital_phone}

_Magnus Hospital_',
'["patient_name", "doctor_name", "appointment_date", "appointment_time", "clinic_location", "hospital_phone", "hospital_name"]', false),

-- Follow-up Notifications
('Follow-up Reminder - 7 Days', 'sms', 'followup', 'en',
'Dear {patient_name}, this is a follow-up reminder from Magnus Hospital. Please contact us if you need any assistance. Phone: {hospital_phone}',
'["patient_name", "hospital_phone", "hospital_name"]', true),

('Follow-up Reminder - 30 Days', 'sms', 'followup', 'en',
'Health Check: Dear {patient_name}, hope you are recovering well. Schedule a follow-up if needed. Magnus Hospital - {hospital_phone}',
'["patient_name", "hospital_phone", "hospital_name"]', true),

-- Lab Reports
('Lab Report Ready', 'sms', 'lab', 'en',
'Dear {patient_name}, your lab reports are ready. You can collect them from hospital or view online. Magnus Hospital',
'["patient_name", "hospital_name"]', true),

-- Payment Reminders
('Payment Due Reminder', 'sms', 'payment', 'en',
'Dear {patient_name}, your payment of ₹{amount} is due. Please settle at earliest. Magnus Hospital',
'["patient_name", "amount", "hospital_name"]', true),

-- Hindi Templates (for wider reach)
('Appointment Reminder - Hindi', 'sms', 'appointment', 'hi',
'प्रिय {patient_name}, डॉ. {doctor_name} के साथ आपकी अपॉइंटमेंट {appointment_date} को {appointment_time} बजे है। कृपया 15 मिनट पहले पहुंचें। मैग्नस हॉस्पिटल',
'["patient_name", "doctor_name", "appointment_date", "appointment_time", "hospital_name"]', true),

-- Emergency/Important
('Emergency Contact', 'sms', 'emergency', 'en',
'URGENT: {message}. Please contact hospital immediately. Magnus Hospital - {hospital_phone}',
'["message", "hospital_phone", "hospital_name"]', true)
ON CONFLICT (template_name) DO NOTHING;

-- 7. Insert default schedules
INSERT INTO notification_schedules (schedule_name, schedule_type, trigger_type, trigger_value, recipient_type) VALUES
('24 Hours Before Appointment', 'appointment_reminder', 'before_appointment', 24, 'patient'),
('2 Hours Before Appointment', 'appointment_reminder', 'before_appointment', 2, 'patient'),
('7 Days After Appointment', 'followup_reminder', 'after_appointment', 168, 'patient'), -- 168 hours = 7 days
('30 Days After Discharge', 'health_check', 'after_appointment', 720, 'patient') -- 720 hours = 30 days
ON CONFLICT (schedule_name) DO NOTHING;

-- 8. Insert mock provider configuration (for development)
INSERT INTO provider_configurations (provider_name, provider_type, is_active, sender_id, default_country_code) VALUES
('mock', 'sms', true, 'MAGHSP', '91'),
('mock', 'whatsapp', true, 'MAGHSP', '91'),
('development', 'sms', false, 'MAGHSP', '91'),
('development', 'whatsapp', false, 'MAGHSP', '91')
ON CONFLICT (provider_name, provider_type) DO NOTHING;

-- 9. Create function to generate notification number
CREATE OR REPLACE FUNCTION generate_notification_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_month VARCHAR(10);
    sequence_num INTEGER;
    notif_number VARCHAR(50);
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(notification_number FROM 'NOTIF-\d{4}-\d{2}-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM notifications
    WHERE notification_number LIKE 'NOTIF-' || year_month || '-%';
    
    -- Format: NOTIF-YYYY-MM-XXXXX (5-digit sequence)
    notif_number := 'NOTIF-' || year_month || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN notif_number;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to send mock notification (for development)
CREATE OR REPLACE FUNCTION send_mock_notification(
    p_template_id UUID,
    p_recipient_phone VARCHAR(20),
    p_variables JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_template notification_templates%ROWTYPE;
    v_notification_id UUID;
    v_message_content TEXT;
    v_variable_key TEXT;
    v_variable_value TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template FROM notification_templates WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Replace variables in template
    v_message_content := v_template.content;
    
    FOR v_variable_key, v_variable_value IN 
        SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        v_message_content := REPLACE(v_message_content, '{' || v_variable_key || '}', v_variable_value);
    END LOOP;
    
    -- Create notification record (MOCK - not actually sent)
    INSERT INTO notifications (
        notification_number,
        template_id,
        recipient_phone,
        message_type,
        message_category,
        message_content,
        variables_used,
        status,
        provider,
        estimated_cost,
        sent_at
    ) VALUES (
        generate_notification_number(),
        p_template_id,
        p_recipient_phone,
        v_template.template_type,
        v_template.category,
        v_message_content,
        p_variables,
        'sent', -- Mock status
        'mock',
        CASE 
            WHEN v_template.template_type = 'sms' THEN 0.15
            WHEN v_template.template_type = 'whatsapp' THEN 0.05
            ELSE 0
        END,
        NOW()
    ) RETURNING id INTO v_notification_id;
    
    -- Log the mock send
    INSERT INTO notification_logs (notification_id, log_type, log_message) VALUES
    (v_notification_id, 'sent', 'Mock notification sent (development mode)');
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    message_type VARCHAR(50),
    category VARCHAR(50),
    total_count BIGINT,
    sent_count BIGINT,
    delivered_count BIGINT,
    failed_count BIGINT,
    total_cost DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.message_type,
        n.message_category,
        COUNT(*) as total_count,
        COUNT(CASE WHEN n.status IN ('sent', 'delivered') THEN 1 END) as sent_count,
        COUNT(CASE WHEN n.status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN n.status = 'failed' THEN 1 END) as failed_count,
        COALESCE(SUM(n.estimated_cost), 0) as total_cost
    FROM notifications n
    WHERE n.created_at >= p_start_date AND n.created_at <= p_end_date + INTERVAL '1 day'
    GROUP BY n.message_type, n.message_category
    ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. Create view for pending notifications
CREATE OR REPLACE VIEW pending_notifications AS
SELECT 
    n.id,
    n.notification_number,
    n.recipient_name,
    n.recipient_phone,
    n.message_type,
    n.message_category,
    n.scheduled_for,
    n.status,
    n.retry_count,
    t.template_name
FROM notifications n
JOIN notification_templates t ON n.template_id = t.id
WHERE n.status IN ('pending', 'queued')
   OR (n.status = 'failed' AND n.retry_count < n.max_retries)
ORDER BY n.scheduled_for ASC NULLS FIRST, n.created_at ASC;

-- 13. Create trigger for notification number
CREATE OR REPLACE FUNCTION set_notification_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.notification_number IS NULL THEN
        NEW.notification_number := generate_notification_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_number
    BEFORE INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_number();

-- Migration complete
COMMENT ON TABLE notification_templates IS 'Templates for SMS/WhatsApp/Email notifications';
COMMENT ON TABLE notifications IS 'Records of all notifications sent';
COMMENT ON TABLE notification_logs IS 'Audit log for notification events';
COMMENT ON TABLE provider_configurations IS 'Configuration for SMS/WhatsApp providers';
COMMENT ON TABLE notification_schedules IS 'Scheduled notification rules';
COMMENT ON FUNCTION send_mock_notification IS 'Mock function for development (does not actually send)';
COMMENT ON FUNCTION get_notification_stats IS 'Get statistics for notifications in date range';
COMMENT ON VIEW pending_notifications IS 'View of notifications pending delivery';
