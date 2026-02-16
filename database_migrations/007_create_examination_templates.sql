-- Examination Templates System
-- US-017: Examination templates table
-- US-018: Examination template selector

-- Create examination_templates table
CREATE TABLE IF NOT EXISTS examination_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    specialty VARCHAR(100),
    
    -- Template structure
    systems JSONB NOT NULL DEFAULT '[]', -- Array of body systems
    components JSONB NOT NULL DEFAULT '[]', -- Examination components
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT template_code_unique UNIQUE(template_code)
);

-- Create examination_findings table (stores actual examination data)
CREATE TABLE IF NOT EXISTS examination_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID, -- Links to consultation if available
    template_id UUID REFERENCES examination_templates(id),
    
    -- Examination data
    examination_data JSONB NOT NULL DEFAULT '{}', -- Structured findings
    notes TEXT,
    
    -- Vital signs (commonly recorded with examination)
    temperature DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(4,1),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(4,1),
    
    -- Status
    examination_date DATE DEFAULT CURRENT_DATE,
    examined_by VARCHAR(255),
    is_abnormal BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_examination_patient_id (patient_id),
    INDEX idx_examination_date (examination_date)
);

-- Create body_systems reference table
CREATE TABLE IF NOT EXISTS body_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_code VARCHAR(50) UNIQUE NOT NULL,
    system_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create examination_components reference table
CREATE TABLE IF NOT EXISTS examination_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_code VARCHAR(50) UNIQUE NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    system_code VARCHAR(50) REFERENCES body_systems(system_code),
    
    -- Component details
    normal_range TEXT,
    measurement_unit VARCHAR(50),
    input_type VARCHAR(50) DEFAULT 'text', -- text, number, select, checkbox
    options JSONB, -- For select inputs
    
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Insert default body systems
INSERT INTO body_systems (system_code, system_name, description, display_order) VALUES
('general', 'General Examination', 'General appearance, vital signs, etc.', 1),
('cvs', 'Cardiovascular System', 'Heart, blood vessels, circulation', 2),
('respiratory', 'Respiratory System', 'Lungs, breathing', 3),
('cns', 'Central Nervous System', 'Brain, spinal cord, nerves', 4),
('git', 'Gastrointestinal System', 'Stomach, intestines, digestion', 5),
('musculoskeletal', 'Musculoskeletal System', 'Muscles, bones, joints', 6),
('skin', 'Skin & Appendages', 'Skin, hair, nails', 7),
('ent', 'ENT', 'Ear, nose, throat', 8),
('eyes', 'Eyes', 'Vision, eye examination', 9),
('psychiatric', 'Psychiatric', 'Mental health assessment', 10)
ON CONFLICT (system_code) DO NOTHING;

-- Insert default examination components
INSERT INTO examination_components (component_code, component_name, system_code, normal_range, measurement_unit, input_type) VALUES
-- General Examination
('appearance', 'General Appearance', 'general', 'Well nourished, well developed', NULL, 'text'),
('consciousness', 'Consciousness Level', 'general', 'Alert and oriented', NULL, 'select'),
('pallor', 'Pallor', 'general', 'Absent', NULL, 'select'),
('icterus', 'Icterus', 'general', 'Absent', NULL, 'select'),
('cyanosis', 'Cyanosis', 'general', 'Absent', NULL, 'select'),
('clubbing', 'Clubbing', 'general', 'Absent', NULL, 'select'),
('lymph_nodes', 'Lymph Nodes', 'general', 'Not palpable', NULL, 'text'),
('edema', 'Edema', 'general', 'Absent', NULL, 'select'),

-- Vital Signs
('temperature', 'Temperature', 'general', '36.5-37.5', '°C', 'number'),
('bp_systolic', 'BP Systolic', 'general', '90-120', 'mmHg', 'number'),
('bp_diastolic', 'BP Diastolic', 'general', '60-80', 'mmHg', 'number'),
('heart_rate', 'Heart Rate', 'general', '60-100', 'bpm', 'number'),
('resp_rate', 'Respiratory Rate', 'general', '12-20', 'breaths/min', 'number'),
('spo2', 'Oxygen Saturation', 'general', '95-100', '%', 'number'),
('weight', 'Weight', 'general', NULL, 'kg', 'number'),
('height', 'Height', 'general', NULL, 'cm', 'number'),

-- Cardiovascular System
('jvp', 'Jugular Venous Pressure', 'cvs', 'Not elevated', NULL, 'text'),
('apex_beat', 'Apex Beat', 'cvs', 'Normal location, normal character', NULL, 'text'),
('heart_sounds', 'Heart Sounds', 'cvs', 'S1, S2 heard, no murmurs', NULL, 'text'),
('pulses', 'Peripheral Pulses', 'cvs', 'All pulses palpable, equal', NULL, 'text'),

-- Respiratory System
('chest_shape', 'Chest Shape', 'respiratory', 'Normal', NULL, 'text'),
('breath_sounds', 'Breath Sounds', 'respiratory', 'Vesicular, equal bilaterally', NULL, 'text'),
('added_sounds', 'Added Sounds', 'respiratory', 'None', NULL, 'text'),

-- CNS
('higher_functions', 'Higher Functions', 'cns', 'Normal', NULL, 'text'),
('cranial_nerves', 'Cranial Nerves', 'cns', 'Intact', NULL, 'text'),
('motor', 'Motor System', 'cns', 'Normal power, tone, bulk', NULL, 'text'),
('sensory', 'Sensory System', 'cns', 'Normal', NULL, 'text'),
('reflexes', 'Reflexes', 'cns', 'Normal', NULL, 'text'),
('cerebellar', 'Cerebellar Functions', 'cns', 'Normal', NULL, 'text')
ON CONFLICT (component_code) DO NOTHING;

-- Insert default examination templates
INSERT INTO examination_templates (template_name, template_code, department, specialty, systems, components, is_default) VALUES
(
    'General Physical Examination',
    'GEN-PHY-001',
    'General Medicine',
    'General Physician',
    '["general"]',
    '["appearance", "consciousness", "pallor", "icterus", "cyanosis", "clubbing", "lymph_nodes", "edema", "temperature", "bp_systolic", "bp_diastolic", "heart_rate", "resp_rate", "spo2", "weight", "height"]',
    true
),
(
    'Cardiovascular Examination',
    'CVS-EXAM-001',
    'Cardiology',
    'Cardiologist',
    '["general", "cvs"]',
    '["temperature", "bp_systolic", "bp_diastolic", "heart_rate", "jvp", "apex_beat", "heart_sounds", "pulses"]',
    false
),
(
    'Respiratory Examination',
    'RESP-EXAM-001',
    'Pulmonology',
    'Pulmonologist',
    '["general", "respiratory"]',
    '["temperature", "resp_rate", "spo2", "chest_shape", "breath_sounds", "added_sounds"]',
    false
),
(
    'Neurological Examination',
    'NEURO-EXAM-001',
    'Neurology',
    'Neurologist',
    '["general", "cns"]',
    '["consciousness", "higher_functions", "cranial_nerves", "motor", "sensory", "reflexes", "cerebellar"]',
    false
),
(
    'Pre-operative Assessment',
    'PREOP-ASSESS-001',
    'Surgery',
    'Surgeon',
    '["general", "cvs", "respiratory", "cns"]',
    '["appearance", "temperature", "bp_systolic", "bp_diastolic", "heart_rate", "resp_rate", "spo2", "heart_sounds", "breath_sounds", "consciousness"]',
    false
)
ON CONFLICT (template_code) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_examination_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_examination_templates_updated_at
    BEFORE UPDATE ON examination_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_examination_updated_at();

CREATE TRIGGER update_examination_findings_updated_at
    BEFORE UPDATE ON examination_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_examination_updated_at();

-- Create view for examination reports
CREATE OR REPLACE VIEW examination_reports AS
SELECT 
    ef.*,
    p.first_name,
    p.last_name,
    p.uhid,
    p.age,
    p.gender,
    et.template_name,
    et.template_code
FROM examination_findings ef
LEFT JOIN patients p ON ef.patient_id = p.id
LEFT JOIN examination_templates et ON ef.template_id = et.id;

-- Grant permissions
GRANT SELECT ON examination_templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON examination_findings TO anon, authenticated;
GRANT SELECT ON body_systems TO anon, authenticated;
GRANT SELECT ON examination_components TO anon, authenticated;
GRANT SELECT ON examination_reports TO anon, authenticated;

COMMENT ON TABLE examination_templates IS 'Examination templates for different specialties';
COMMENT ON TABLE examination_findings IS 'Actual examination findings for patients';
COMMENT ON TABLE body_systems IS 'Reference table for body systems';
COMMENT ON TABLE examination_components IS 'Reference table for examination components';