-- Prescription Templates System
-- US-019: Prescription templates table
-- US-020: Prescription template selector

-- ==================== DRUG CATALOG ====================
-- Reference table for drugs (from existing data or new)
CREATE TABLE IF NOT EXISTS drug_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drug_code VARCHAR(50) UNIQUE NOT NULL,
    drug_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    drug_type VARCHAR(50), -- tablet, syrup, injection, etc.
    strength VARCHAR(100), -- e.g., "500mg", "10mg/5ml"
    unit VARCHAR(50), -- mg, ml, g, etc.
    route VARCHAR(50), -- oral, iv, im, topical, etc.
    schedule VARCHAR(50), -- schedule H1, H, X, etc.
    manufacturer VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== PRESCRIPTION TEMPLATES ====================
CREATE TABLE IF NOT EXISTS prescription_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    department VARCHAR(100), -- General Medicine, Pediatrics, Cardiology, etc.
    specialty VARCHAR(100),
    diagnosis_codes TEXT[], -- Associated ICD-10 codes
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TEMPLATE ITEMS ====================
CREATE TABLE IF NOT EXISTS prescription_template_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES prescription_templates(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drug_catalog(id),
    drug_name VARCHAR(200) NOT NULL, -- Denormalized for performance
    dosage VARCHAR(100) NOT NULL, -- e.g., "1 tablet", "5ml"
    frequency VARCHAR(100) NOT NULL, -- e.g., "BD", "TDS", "QID", "SOS"
    duration VARCHAR(100), -- e.g., "5 days", "1 week", "Until finished"
    route VARCHAR(50), -- oral, iv, etc.
    instructions TEXT, -- Special instructions
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_prescription_templates_department ON prescription_templates(department);
CREATE INDEX IF NOT EXISTS idx_prescription_templates_active ON prescription_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prescription_template_items_template ON prescription_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_drug_catalog_active ON drug_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_drug_catalog_name ON drug_catalog(drug_name);

-- ==================== DEFAULT DATA ====================

-- Insert common drugs
INSERT INTO drug_catalog (drug_code, drug_name, generic_name, drug_type, strength, unit, route, schedule, manufacturer) VALUES
-- Antibiotics
('ABX001', 'Amoxicillin', 'Amoxicillin', 'tablet', '500', 'mg', 'oral', 'H', 'Generic'),
('ABX002', 'Azithromycin', 'Azithromycin', 'tablet', '500', 'mg', 'oral', 'H', 'Generic'),
('ABX003', 'Ciprofloxacin', 'Ciprofloxacin', 'tablet', '500', 'mg', 'oral', 'H4', 'Generic'),
('ABX004', 'Doxycycline', 'Doxycycline', 'capsule', '100', 'mg', 'oral', 'H', 'Generic'),
('ABX005', 'Metronidazole', 'Metronidazole', 'tablet', '400', 'mg', 'oral', 'H', 'Generic'),

-- Analgesics
('ANL001', 'Paracetamol', 'Paracetamol', 'tablet', '500', 'mg', 'oral', NULL, 'Generic'),
('ANL002', 'Ibuprofen', 'Ibuprofen', 'tablet', '400', 'mg', 'oral', NULL, 'Generic'),
('ANL003', 'Diclofenac', 'Diclofenac', 'tablet', '50', 'mg', 'oral', 'H', 'Generic'),
('ANL004', 'Tramadol', 'Tramadol', 'tablet', '50', 'mg', 'oral', 'H1', 'Generic'),

-- Antihypertensives
('AHT001', 'Amlodipine', 'Amlodipine', 'tablet', '5', 'mg', 'oral', 'H', 'Generic'),
('AHT002', 'Losartan', 'Losartan', 'tablet', '50', 'mg', 'oral', 'H', 'Generic'),
('AHT003', 'Metoprolol', 'Metoprolol', 'tablet', '25', 'mg', 'oral', 'H', 'Generic'),
('AHT004', 'Hydrochlorothiazide', 'Hydrochlorothiazide', 'tablet', '12.5', 'mg', 'oral', 'H', 'Generic'),

-- Antidiabetics
('ADB001', 'Metformin', 'Metformin', 'tablet', '500', 'mg', 'oral', NULL, 'Generic'),
('ADB002', 'Glibenclamide', 'Glibenclamide', 'tablet', '5', 'mg', 'oral', 'H', 'Generic'),
('ADB003', 'Insulin Glargine', 'Insulin Glargine', 'injection', '100', 'IU/ml', 'sc', 'H', 'Generic'),

-- GI Drugs
('GID001', 'Omeprazole', 'Omeprazole', 'capsule', '20', 'mg', 'oral', NULL, 'Generic'),
('GID002', 'Domperidone', 'Domperidone', 'tablet', '10', 'mg', 'oral', NULL, 'Generic'),
('GID003', 'Ondansetron', 'Ondansetron', 'tablet', '4', 'mg', 'oral', 'H', 'Generic'),

-- Respiratory
('RES001', 'Salbutamol', 'Salbutamol', 'inhaler', '100', 'mcg/dose', 'inhalation', NULL, 'Generic'),
('RES002', 'Montelukast', 'Montelukast', 'tablet', '10', 'mg', 'oral', NULL, 'Generic'),
('RES003', 'Levocetirizine', 'Levocetirizine', 'tablet', '5', 'mg', 'oral', NULL, 'Generic')
ON CONFLICT (drug_code) DO NOTHING;

-- Insert prescription templates
INSERT INTO prescription_templates (template_name, template_code, description, department, specialty, diagnosis_codes, is_default) VALUES
-- General Medicine
('Upper Respiratory Infection', 'TMP-URI-001', 'Common cold/flu treatment', 'General Medicine', 'Internal Medicine', ARRAY['J06.9', 'J11.1'], true),
('Acute Gastroenteritis', 'TMP-GE-001', 'Gastroenteritis treatment', 'General Medicine', 'Gastroenterology', ARRAY['A09', 'K52.9'], true),
('Hypertension Management', 'TMP-HT-001', 'Hypertension initial treatment', 'General Medicine', 'Cardiology', ARRAY['I10'], true),
('Type 2 Diabetes', 'TMP-DM-001', 'Diabetes management', 'General Medicine', 'Endocrinology', ARRAY['E11.9'], true),

-- Pediatrics
('Pediatric Fever', 'TMP-PED-FEV-001', 'Fever in children', 'Pediatrics', 'General Pediatrics', ARRAY['R50.9'], true),
('Pediatric Cough & Cold', 'TMP-PED-CC-001', 'Cough and cold in children', 'Pediatrics', 'General Pediatrics', ARRAY['J00', 'R05'], true),

-- Surgery
('Post-Operative Pain', 'TMP-SUR-PAIN-001', 'Post-operative pain management', 'Surgery', 'General Surgery', ARRAY['R52.2'], true),
('Wound Care', 'TMP-WOUND-001', 'Basic wound care', 'Surgery', 'General Surgery', ARRAY['T14.0'], true)
ON CONFLICT (template_code) DO NOTHING;

-- Insert template items for Upper Respiratory Infection template
WITH template AS (
    SELECT id FROM prescription_templates WHERE template_code = 'TMP-URI-001'
), drugs AS (
    SELECT id, drug_name FROM drug_catalog WHERE drug_code IN ('ANL001', 'ANL002', 'ABX001', 'RES003', 'GID001')
)
INSERT INTO prescription_template_items (template_id, drug_id, drug_name, dosage, frequency, duration, route, instructions, display_order)
SELECT 
    t.id,
    d.id,
    d.drug_name,
    CASE d.drug_code 
        WHEN 'ANL001' THEN '1 tablet'
        WHEN 'ANL002' THEN '1 tablet'
        WHEN 'ABX001' THEN '1 capsule'
        WHEN 'RES003' THEN '1 tablet'
        WHEN 'GID001' THEN '1 capsule'
    END,
    CASE d.drug_code 
        WHEN 'ANL001' THEN 'SOS for fever'
        WHEN 'ANL002' THEN 'BD after food'
        WHEN 'ABX001' THEN 'TDS'
        WHEN 'RES003' THEN 'OD at night'
        WHEN 'GID001' THEN 'OD before breakfast'
    END,
    CASE d.drug_code 
        WHEN 'ANL001' THEN 'As needed'
        WHEN 'ANL002' THEN '3 days'
        WHEN 'ABX001' THEN '5 days'
        WHEN 'RES003' THEN '5 days'
        WHEN 'GID001' THEN '5 days'
    END,
    'oral',
    CASE d.drug_code 
        WHEN 'ABX001' THEN 'Complete full course'
        WHEN 'ANL002' THEN 'Take with food'
        ELSE NULL
    END,
    CASE d.drug_code 
        WHEN 'ANL001' THEN 1
        WHEN 'ANL002' THEN 2
        WHEN 'ABX001' THEN 3
        WHEN 'RES003' THEN 4
        WHEN 'GID001' THEN 5
    END
FROM template t
CROSS JOIN drugs d
ON CONFLICT DO NOTHING;

-- ==================== FUNCTIONS ====================

-- Function to clone a prescription template
CREATE OR REPLACE FUNCTION clone_prescription_template(
    template_id UUID,
    new_template_name VARCHAR(200),
    new_template_code VARCHAR(50)
) RETURNS UUID AS $$
DECLARE
    new_template_id UUID;
BEGIN
    -- Create new template
    INSERT INTO prescription_templates (
        template_name,
        template_code,
        description,
        department,
        specialty,
        diagnosis_codes,
        is_active,
        is_default,
        created_by
    )
    SELECT 
        new_template_name,
        new_template_code,
        description,
        department,
        specialty,
        diagnosis_codes,
        is_active,
        false, -- Cloned templates are not default
        created_by
    FROM prescription_templates
    WHERE id = template_id
    RETURNING id INTO new_template_id;

    -- Clone template items
    INSERT INTO prescription_template_items (
        template_id,
        drug_id,
        drug_name,
        dosage,
        frequency,
        duration,
        route,
        instructions,
        display_order
    )
    SELECT 
        new_template_id,
        drug_id,
        drug_name,
        dosage,
        frequency,
        duration,
        route,
        instructions,
        display_order
    FROM prescription_template_items
    WHERE template_id = template_id;

    RETURN new_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search drugs
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
        dc.id,
        dc.drug_code,
        dc.drug_name,
        dc.generic_name,
        dc.strength,
        dc.unit,
        dc.route
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

-- ==================== VIEWS ====================

-- View for prescription templates with item count
CREATE OR REPLACE VIEW prescription_templates_view AS
SELECT 
    pt.*,
    COUNT(pti.id) as item_count,
    ARRAY_AGG(DISTINCT pti.drug_name) as drug_names
FROM prescription_templates pt
LEFT JOIN prescription_template_items pti ON pt.id = pti.template_id
GROUP BY pt.id;

-- View for drug interactions (placeholder - will be populated later)
CREATE OR REPLACE VIEW drug_interactions_view AS
SELECT 
    d1.drug_code as drug1_code,
    d1.drug_name as drug1_name,
    d2.drug_code as drug2_code,
    d2.drug_name as drug2_name,
    'Moderate' as severity, -- Placeholder
    'May increase risk of side effects' as description -- Placeholder
FROM drug_catalog d1
CROSS JOIN drug_catalog d2
WHERE d1.id < d2.id
AND d1.drug_type = d2.drug_type
LIMIT 50; -- Placeholder limit

-- ==================== COMMENTS ====================
COMMENT ON TABLE drug_catalog IS 'Master catalog of drugs with details';
COMMENT ON TABLE prescription_templates IS 'Prescription templates for common conditions';
COMMENT ON TABLE prescription_template_items IS 'Individual drugs within prescription templates';
COMMENT ON FUNCTION clone_prescription_template IS 'Clones a prescription template with all items';
COMMENT ON FUNCTION search_drugs IS 'Searches drugs by name, generic name, or code';

-- ==================== UPDATE TRIGGER ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prescription_templates_updated_at 
    BEFORE UPDATE ON prescription_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_catalog_updated_at 
    BEFORE UPDATE ON drug_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();