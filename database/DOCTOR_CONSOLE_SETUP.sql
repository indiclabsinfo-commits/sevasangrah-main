-- ============================================================================
-- DOCTOR CONSOLE - DATABASE SETUP
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ============================================================================
-- 1. PATIENT ENHANCED PRESCRIPTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_enhanced_prescription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medications JSONB NOT NULL DEFAULT '[]',
    dosage_instructions TEXT,
    duration TEXT,
    special_instructions TEXT,
    follow_up_date DATE,
    prescribed_by TEXT,
    prescription_date DATE,
    notes TEXT,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_enhanced_prescription_patient_id ON patient_enhanced_prescription(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescription_date ON patient_enhanced_prescription(prescription_date);

-- ============================================================================
-- 2. DRUG CATALOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS drug_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drug_code VARCHAR(50) UNIQUE NOT NULL,
    drug_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    drug_type VARCHAR(50),
    strength VARCHAR(100),
    unit VARCHAR(50),
    route VARCHAR(50),
    schedule VARCHAR(50),
    manufacturer VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drug_catalog_active ON drug_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_drug_catalog_name ON drug_catalog(drug_name);

-- ============================================================================
-- 3. PRESCRIPTION TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescription_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    department VARCHAR(100),
    specialty VARCHAR(100),
    diagnosis_codes TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_templates_department ON prescription_templates(department);
CREATE INDEX IF NOT EXISTS idx_prescription_templates_active ON prescription_templates(is_active);

-- ============================================================================
-- 4. PRESCRIPTION TEMPLATE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescription_template_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES prescription_templates(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drug_catalog(id),
    drug_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    route VARCHAR(50),
    instructions TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_template_items_template ON prescription_template_items(template_id);

-- ============================================================================
-- 5. BODY SYSTEMS (Reference table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS body_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_code VARCHAR(50) UNIQUE NOT NULL,
    system_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- 6. EXAMINATION TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS examination_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    specialty VARCHAR(100),
    systems JSONB NOT NULL DEFAULT '[]',
    components JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. EXAMINATION COMPONENTS (Reference table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS examination_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_code VARCHAR(50) UNIQUE NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    system_code VARCHAR(50) REFERENCES body_systems(system_code),
    normal_range TEXT,
    measurement_unit VARCHAR(50),
    input_type VARCHAR(50) DEFAULT 'text',
    options JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- 8. EXAMINATION FINDINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS examination_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID,
    template_id UUID REFERENCES examination_templates(id),
    examination_data JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    temperature DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(4,1),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(4,1),
    examination_date DATE DEFAULT CURRENT_DATE,
    examined_by VARCHAR(255),
    is_abnormal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_examination_findings_patient ON examination_findings(patient_id);
CREATE INDEX IF NOT EXISTS idx_examination_findings_date ON examination_findings(examination_date);

-- ============================================================================
-- 9. SEED DATA - Body Systems
-- ============================================================================
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

-- ============================================================================
-- 10. SEED DATA - Examination Components
-- ============================================================================
INSERT INTO examination_components (component_code, component_name, system_code, normal_range, measurement_unit, input_type) VALUES
('appearance', 'General Appearance', 'general', 'Well nourished, well developed', NULL, 'text'),
('consciousness', 'Consciousness Level', 'general', 'Alert and oriented', NULL, 'select'),
('pallor', 'Pallor', 'general', 'Absent', NULL, 'select'),
('icterus', 'Icterus', 'general', 'Absent', NULL, 'select'),
('cyanosis', 'Cyanosis', 'general', 'Absent', NULL, 'select'),
('clubbing', 'Clubbing', 'general', 'Absent', NULL, 'select'),
('lymph_nodes', 'Lymph Nodes', 'general', 'Not palpable', NULL, 'text'),
('edema', 'Edema', 'general', 'Absent', NULL, 'select'),
('temperature', 'Temperature', 'general', '36.5-37.5', '°C', 'number'),
('bp_systolic', 'BP Systolic', 'general', '90-120', 'mmHg', 'number'),
('bp_diastolic', 'BP Diastolic', 'general', '60-80', 'mmHg', 'number'),
('heart_rate', 'Heart Rate', 'general', '60-100', 'bpm', 'number'),
('resp_rate', 'Respiratory Rate', 'general', '12-20', 'breaths/min', 'number'),
('spo2', 'Oxygen Saturation', 'general', '95-100', '%', 'number'),
('weight', 'Weight', 'general', NULL, 'kg', 'number'),
('height', 'Height', 'general', NULL, 'cm', 'number'),
('jvp', 'Jugular Venous Pressure', 'cvs', 'Not elevated', NULL, 'text'),
('apex_beat', 'Apex Beat', 'cvs', 'Normal location, normal character', NULL, 'text'),
('heart_sounds', 'Heart Sounds', 'cvs', 'S1, S2 heard, no murmurs', NULL, 'text'),
('pulses', 'Peripheral Pulses', 'cvs', 'All pulses palpable, equal', NULL, 'text'),
('chest_shape', 'Chest Shape', 'respiratory', 'Normal', NULL, 'text'),
('breath_sounds', 'Breath Sounds', 'respiratory', 'Vesicular, equal bilaterally', NULL, 'text'),
('added_sounds', 'Added Sounds', 'respiratory', 'None', NULL, 'text'),
('higher_functions', 'Higher Functions', 'cns', 'Normal', NULL, 'text'),
('cranial_nerves', 'Cranial Nerves', 'cns', 'Intact', NULL, 'text'),
('motor', 'Motor System', 'cns', 'Normal power, tone, bulk', NULL, 'text'),
('sensory', 'Sensory System', 'cns', 'Normal', NULL, 'text'),
('reflexes', 'Reflexes', 'cns', 'Normal', NULL, 'text'),
('cerebellar', 'Cerebellar Functions', 'cns', 'Normal', NULL, 'text')
ON CONFLICT (component_code) DO NOTHING;

-- ============================================================================
-- 11. SEED DATA - Examination Templates
-- ============================================================================
INSERT INTO examination_templates (template_name, template_code, department, specialty, systems, components, is_default) VALUES
('General Physical Examination', 'GEN-PHY-001', 'General Medicine', 'General Physician',
 '["general"]',
 '["appearance", "consciousness", "pallor", "icterus", "cyanosis", "clubbing", "lymph_nodes", "edema", "temperature", "bp_systolic", "bp_diastolic", "heart_rate", "resp_rate", "spo2", "weight", "height"]',
 true),
('Cardiovascular Examination', 'CVS-EXAM-001', 'Cardiology', 'Cardiologist',
 '["general", "cvs"]',
 '["temperature", "bp_systolic", "bp_diastolic", "heart_rate", "jvp", "apex_beat", "heart_sounds", "pulses"]',
 false),
('Respiratory Examination', 'RESP-EXAM-001', 'Pulmonology', 'Pulmonologist',
 '["general", "respiratory"]',
 '["temperature", "resp_rate", "spo2", "chest_shape", "breath_sounds", "added_sounds"]',
 false),
('Neurological Examination', 'NEURO-EXAM-001', 'Neurology', 'Neurologist',
 '["general", "cns"]',
 '["consciousness", "higher_functions", "cranial_nerves", "motor", "sensory", "reflexes", "cerebellar"]',
 false),
('Pre-operative Assessment', 'PREOP-ASSESS-001', 'Surgery', 'Surgeon',
 '["general", "cvs", "respiratory", "cns"]',
 '["appearance", "temperature", "bp_systolic", "bp_diastolic", "heart_rate", "resp_rate", "spo2", "heart_sounds", "breath_sounds", "consciousness"]',
 false)
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- 12. SEED DATA - Drugs
-- ============================================================================
INSERT INTO drug_catalog (drug_code, drug_name, generic_name, drug_type, strength, unit, route, schedule, manufacturer) VALUES
('ABX001', 'Amoxicillin', 'Amoxicillin', 'tablet', '500', 'mg', 'oral', 'H', 'Generic'),
('ABX002', 'Azithromycin', 'Azithromycin', 'tablet', '500', 'mg', 'oral', 'H', 'Generic'),
('ABX003', 'Ciprofloxacin', 'Ciprofloxacin', 'tablet', '500', 'mg', 'oral', 'H4', 'Generic'),
('ABX004', 'Doxycycline', 'Doxycycline', 'capsule', '100', 'mg', 'oral', 'H', 'Generic'),
('ABX005', 'Metronidazole', 'Metronidazole', 'tablet', '400', 'mg', 'oral', 'H', 'Generic'),
('ANL001', 'Paracetamol', 'Paracetamol', 'tablet', '500', 'mg', 'oral', NULL, 'Generic'),
('ANL002', 'Ibuprofen', 'Ibuprofen', 'tablet', '400', 'mg', 'oral', NULL, 'Generic'),
('ANL003', 'Diclofenac', 'Diclofenac', 'tablet', '50', 'mg', 'oral', 'H', 'Generic'),
('ANL004', 'Tramadol', 'Tramadol', 'tablet', '50', 'mg', 'oral', 'H1', 'Generic'),
('AHT001', 'Amlodipine', 'Amlodipine', 'tablet', '5', 'mg', 'oral', 'H', 'Generic'),
('AHT002', 'Losartan', 'Losartan', 'tablet', '50', 'mg', 'oral', 'H', 'Generic'),
('AHT003', 'Metoprolol', 'Metoprolol', 'tablet', '25', 'mg', 'oral', 'H', 'Generic'),
('AHT004', 'Hydrochlorothiazide', 'Hydrochlorothiazide', 'tablet', '12.5', 'mg', 'oral', 'H', 'Generic'),
('ADB001', 'Metformin', 'Metformin', 'tablet', '500', 'mg', 'oral', NULL, 'Generic'),
('ADB002', 'Glibenclamide', 'Glibenclamide', 'tablet', '5', 'mg', 'oral', 'H', 'Generic'),
('ADB003', 'Insulin Glargine', 'Insulin Glargine', 'injection', '100', 'IU/ml', 'sc', 'H', 'Generic'),
('GID001', 'Omeprazole', 'Omeprazole', 'capsule', '20', 'mg', 'oral', NULL, 'Generic'),
('GID002', 'Domperidone', 'Domperidone', 'tablet', '10', 'mg', 'oral', NULL, 'Generic'),
('GID003', 'Ondansetron', 'Ondansetron', 'tablet', '4', 'mg', 'oral', 'H', 'Generic'),
('RES001', 'Salbutamol', 'Salbutamol', 'inhaler', '100', 'mcg/dose', 'inhalation', NULL, 'Generic'),
('RES002', 'Montelukast', 'Montelukast', 'tablet', '10', 'mg', 'oral', NULL, 'Generic'),
('RES003', 'Levocetirizine', 'Levocetirizine', 'tablet', '5', 'mg', 'oral', NULL, 'Generic')
ON CONFLICT (drug_code) DO NOTHING;

-- ============================================================================
-- 13. SEED DATA - Prescription Templates
-- ============================================================================
INSERT INTO prescription_templates (template_name, template_code, description, department, specialty, diagnosis_codes, is_default) VALUES
('Upper Respiratory Infection', 'TMP-URI-001', 'Common cold/flu treatment', 'General Medicine', 'Internal Medicine', ARRAY['J06.9', 'J11.1'], true),
('Acute Gastroenteritis', 'TMP-GE-001', 'Gastroenteritis treatment', 'General Medicine', 'Gastroenterology', ARRAY['A09', 'K52.9'], true),
('Hypertension Management', 'TMP-HT-001', 'Hypertension initial treatment', 'General Medicine', 'Cardiology', ARRAY['I10'], true),
('Type 2 Diabetes', 'TMP-DM-001', 'Diabetes management', 'General Medicine', 'Endocrinology', ARRAY['E11.9'], true),
('Pediatric Fever', 'TMP-PED-FEV-001', 'Fever in children', 'Pediatrics', 'General Pediatrics', ARRAY['R50.9'], true),
('Post-Operative Pain', 'TMP-SUR-PAIN-001', 'Post-operative pain management', 'Surgery', 'General Surgery', ARRAY['R52.2'], true)
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- 14. SEARCH DRUGS FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION search_drugs(
    search_term VARCHAR(200),
    limit_count INTEGER DEFAULT 20
) RETURNS TABLE (
    id UUID,
    drug_code VARCHAR(50),
    drug_name VARCHAR(200),
    generic_name VARCHAR(200),
    strength VARCHAR(100),
    unit VARCHAR(50),
    route VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id, dc.drug_code, dc.drug_name, dc.generic_name,
        dc.strength, dc.unit, dc.route
    FROM drug_catalog dc
    WHERE dc.is_active = true
    AND (
        dc.drug_name ILIKE '%' || search_term || '%'
        OR dc.generic_name ILIKE '%' || search_term || '%'
        OR dc.drug_code ILIKE '%' || search_term || '%'
    )
    ORDER BY
        CASE
            WHEN dc.drug_name ILIKE search_term || '%' THEN 1
            WHEN dc.generic_name ILIKE search_term || '%' THEN 2
            ELSE 3
        END,
        dc.drug_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. PRESCRIPTION TEMPLATES VIEW
-- ============================================================================
CREATE OR REPLACE VIEW prescription_templates_view AS
SELECT
    pt.*,
    COUNT(pti.id) as item_count,
    ARRAY_AGG(DISTINCT pti.drug_name) FILTER (WHERE pti.drug_name IS NOT NULL) as drug_names
FROM prescription_templates pt
LEFT JOIN prescription_template_items pti ON pt.id = pti.template_id
GROUP BY pt.id;

-- ============================================================================
-- 16. RLS POLICIES (Allow anon + authenticated access)
-- ============================================================================
ALTER TABLE patient_enhanced_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_findings ENABLE ROW LEVEL SECURITY;

-- Anon + Authenticated full access policies
CREATE POLICY "anon_all_patient_enhanced_prescription" ON patient_enhanced_prescription FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_drug_catalog" ON drug_catalog FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_prescription_templates" ON prescription_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_prescription_template_items" ON prescription_template_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_body_systems" ON body_systems FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_examination_templates" ON examination_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_examination_components" ON examination_components FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_examination_findings" ON examination_findings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Doctor Console database setup complete!' as status;
