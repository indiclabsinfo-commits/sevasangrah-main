-- Drug Interactions System
-- US-021: Drug interactions table
-- US-022: Drug interaction check

-- ==================== DRUG INTERACTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS drug_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drug1_id UUID NOT NULL REFERENCES drug_catalog(id) ON DELETE CASCADE,
    drug2_id UUID NOT NULL REFERENCES drug_catalog(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('contraindicated', 'major', 'moderate', 'minor')),
    description TEXT NOT NULL,
    mechanism TEXT,
    management TEXT,
    evidence_level VARCHAR(50), -- theoretical, case report, established
    references TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(drug1_id, drug2_id)
);

-- ==================== PATIENT ALLERGIES ====================
CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen_type VARCHAR(50) NOT NULL, -- drug, food, environmental, other
    allergen_name VARCHAR(200) NOT NULL,
    drug_id UUID REFERENCES drug_catalog(id),
    reaction VARCHAR(200) NOT NULL, -- rash, anaphylaxis, nausea, etc.
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
    onset_date DATE,
    resolved BOOLEAN DEFAULT false,
    notes TEXT,
    reported_by UUID REFERENCES users(id),
    reported_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ALLERGEN CATALOG ====================
CREATE TABLE IF NOT EXISTS allergen_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    allergen_code VARCHAR(50) UNIQUE NOT NULL,
    allergen_name VARCHAR(200) NOT NULL,
    allergen_type VARCHAR(50) NOT NULL,
    category VARCHAR(100), -- antibiotic, nsaid, penicillin, etc.
    cross_reactivity TEXT[], -- List of cross-reactive allergens
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug1 ON drug_interactions(drug1_id);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug2 ON drug_interactions(drug2_id);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_severity ON drug_interactions(severity);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_active ON drug_interactions(is_active);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_drug ON patient_allergies(drug_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON patient_allergies(resolved);

CREATE INDEX IF NOT EXISTS idx_allergen_catalog_type ON allergen_catalog(allergen_type);
CREATE INDEX IF NOT EXISTS idx_allergen_catalog_active ON allergen_catalog(is_active);

-- ==================== DEFAULT DATA ====================

-- Insert common allergens
INSERT INTO allergen_catalog (allergen_code, allergen_name, allergen_type, category) VALUES
-- Antibiotics
('ALG001', 'Penicillin', 'drug', 'antibiotic'),
('ALG002', 'Amoxicillin', 'drug', 'antibiotic'),
('ALG003', 'Cephalosporins', 'drug', 'antibiotic'),
('ALG004', 'Sulfa drugs', 'drug', 'antibiotic'),
('ALG005', 'Tetracycline', 'drug', 'antibiotic'),

-- NSAIDs
('ALG006', 'Ibuprofen', 'drug', 'nsaid'),
('ALG007', 'Aspirin', 'drug', 'nsaid'),
('ALG008', 'Naproxen', 'drug', 'nsaid'),
('ALG009', 'Diclofenac', 'drug', 'nsaid'),

-- Other drugs
('ALG010', 'Insulin', 'drug', 'hormone'),
('ALG011', 'Local anesthetics', 'drug', 'anesthetic'),
('ALG012', 'Contrast media', 'drug', 'diagnostic'),

-- Food
('ALG101', 'Peanuts', 'food', 'nuts'),
('ALG102', 'Shellfish', 'food', 'seafood'),
('ALG103', 'Eggs', 'food', 'animal'),
('ALG104', 'Milk', 'food', 'dairy'),
('ALG105', 'Soy', 'food', 'legume'),

-- Environmental
('ALG201', 'Dust mites', 'environmental', 'indoor'),
('ALG202', 'Pollen', 'environmental', 'outdoor'),
('ALG203', 'Mold', 'environmental', 'fungal'),
('ALG204', 'Pet dander', 'environmental', 'animal')
ON CONFLICT (allergen_code) DO NOTHING;

-- Insert common drug interactions
WITH drugs AS (
    SELECT id, drug_code FROM drug_catalog WHERE drug_code IN 
    ('ABX001', 'ABX002', 'ANL001', 'ANL002', 'ANL003', 'AHT001', 'AHT002', 'ADB001', 'GID001')
)
INSERT INTO drug_interactions (drug1_id, drug2_id, severity, description, mechanism, management, evidence_level) VALUES
-- Amoxicillin + Oral contraceptives (reduced efficacy)
((SELECT id FROM drugs WHERE drug_code = 'ABX001'), 
 (SELECT id FROM drug_catalog WHERE drug_code = 'OCP001'),
 'moderate',
 'May reduce effectiveness of oral contraceptives',
 'Antibiotics may alter gut flora affecting estrogen reabsorption',
 'Use backup contraception during antibiotic course',
 'established'),

-- Azithromycin + Warfarin (increased bleeding risk)
((SELECT id FROM drugs WHERE drug_code = 'ABX002'),
 (SELECT id FROM drug_catalog WHERE drug_code = 'ANT001'),
 'major',
 'Increased risk of bleeding',
 'Azithromycin may inhibit warfarin metabolism',
 'Monitor INR closely, adjust warfarin dose as needed',
 'established'),

-- Ibuprofen + Lithium (increased lithium levels)
((SELECT id FROM drugs WHERE drug_code = 'ANL002'),
 (SELECT id FROM drug_catalog WHERE drug_code = 'PSY001'),
 'major',
 'Increased lithium toxicity risk',
 'NSAIDs reduce renal lithium clearance',
 'Monitor lithium levels, avoid concurrent use if possible',
 'established'),

-- Diclofenac + ACE inhibitors (reduced antihypertensive effect)
((SELECT id FROM drugs WHERE drug_code = 'ANL003'),
 (SELECT id FROM drugs WHERE drug_code = 'AHT001'),
 'moderate',
 'Reduced antihypertensive effect',
 'NSAIDs may cause fluid retention and reduce ACE inhibitor efficacy',
 'Monitor blood pressure, consider alternative analgesic',
 'established'),

-- Amlodipine + Grapefruit juice (increased drug levels)
((SELECT id FROM drugs WHERE drug_code = 'AHT001'),
 (SELECT id FROM allergen_catalog WHERE allergen_code = 'ALG999'), -- Placeholder for grapefruit
 'moderate',
 'Increased amlodipine levels and side effects',
 'Grapefruit inhibits CYP3A4 metabolism',
 'Avoid grapefruit juice during therapy',
 'established'),

-- Metformin + Contrast media (lactic acidosis risk)
((SELECT id FROM drugs WHERE drug_code = 'ADB001'),
 (SELECT id FROM allergen_catalog WHERE allergen_code = 'ALG012'),
 'major',
 'Risk of lactic acidosis',
 'Contrast media may impair renal function affecting metformin clearance',
 'Withhold metformin 48 hours before and after contrast procedure',
 'established'),

-- Omeprazole + Clopidogrel (reduced antiplatelet effect)
((SELECT id FROM drugs WHERE drug_code = 'GID001'),
 (SELECT id FROM drug_catalog WHERE drug_code = 'ANT002'),
 'major',
 'Reduced clopidogrel effectiveness',
 'Omeprazole inhibits CYP2C19 needed for clopidogrel activation',
 'Use alternative PPI (pantoprazole) or H2 blocker',
 'established')
ON CONFLICT (drug1_id, drug2_id) DO NOTHING;

-- ==================== FUNCTIONS ====================

-- Function to check drug interactions
CREATE OR REPLACE FUNCTION check_drug_interactions(
    drug_ids UUID[],
    patient_id UUID DEFAULT NULL
) RETURNS TABLE (
    drug1_name VARCHAR(200),
    drug2_name VARCHAR(200),
    severity VARCHAR(20),
    description TEXT,
    management TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH drug_pairs AS (
        SELECT unnest(drug_ids) as drug_id
    )
    SELECT 
        dc1.drug_name as drug1_name,
        dc2.drug_name as drug2_name,
        di.severity,
        di.description,
        di.management
    FROM drug_interactions di
    JOIN drug_catalog dc1 ON di.drug1_id = dc1.id
    JOIN drug_catalog dc2 ON di.drug2_id = dc2.id
    WHERE di.is_active = true
    AND (
        (di.drug1_id = ANY(drug_ids) AND di.drug2_id = ANY(drug_ids))
        OR (di.drug2_id = ANY(drug_ids) AND di.drug1_id = ANY(drug_ids))
    )
    AND dc1.id <> dc2.id
    ORDER BY 
        CASE di.severity 
            WHEN 'contraindicated' THEN 1
            WHEN 'major' THEN 2
            WHEN 'moderate' THEN 3
            WHEN 'minor' THEN 4
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to check patient allergies against drug list
CREATE OR REPLACE FUNCTION check_patient_allergies(
    patient_id UUID,
    drug_ids UUID[]
) RETURNS TABLE (
    allergen_name VARCHAR(200),
    reaction VARCHAR(200),
    severity VARCHAR(20),
    drug_name VARCHAR(200)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.allergen_name,
        pa.reaction,
        pa.severity,
        dc.drug_name
    FROM patient_allergies pa
    LEFT JOIN drug_catalog dc ON pa.drug_id = dc.id
    WHERE pa.patient_id = check_patient_allergies.patient_id
    AND pa.resolved = false
    AND (
        pa.drug_id = ANY(drug_ids)
        OR EXISTS (
            SELECT 1 FROM allergen_catalog ac 
            WHERE ac.id = pa.allergen_id
            AND ac.category IN (
                SELECT category FROM drug_catalog dc2 
                WHERE dc2.id = ANY(drug_ids)
                AND dc2.category IS NOT NULL
            )
        )
    )
    ORDER BY 
        CASE pa.severity
            WHEN 'life-threatening' THEN 1
            WHEN 'severe' THEN 2
            WHEN 'moderate' THEN 3
            WHEN 'mild' THEN 4
            ELSE 5
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get cross-reactive allergens
CREATE OR REPLACE FUNCTION get_cross_reactive_allergens(
    allergen_id UUID
) RETURNS TABLE (
    allergen_code VARCHAR(50),
    allergen_name VARCHAR(200),
    allergen_type VARCHAR(50),
    cross_reactivity_percent INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac2.allergen_code,
        ac2.allergen_name,
        ac2.allergen_type,
        80 as cross_reactivity_percent -- Placeholder, would be actual data
    FROM allergen_catalog ac1
    CROSS JOIN allergen_catalog ac2
    WHERE ac1.id = allergen_id
    AND ac2.id <> ac1.id
    AND ac1.category = ac2.category
    AND ac2.is_active = true
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ==================== VIEWS ====================

-- View for drug interactions with details
CREATE OR REPLACE VIEW drug_interactions_view AS
SELECT 
    di.*,
    dc1.drug_code as drug1_code,
    dc1.drug_name as drug1_name,
    dc2.drug_code as drug2_code,
    dc2.drug_name as drug2_name,
    CASE di.severity
        WHEN 'contraindicated' THEN '🔴 Contraindicated'
        WHEN 'major' THEN '🟠 Major'
        WHEN 'moderate' THEN '🟡 Moderate'
        WHEN 'minor' THEN '🟢 Minor'
    END as severity_display
FROM drug_interactions di
JOIN drug_catalog dc1 ON di.drug1_id = dc1.id
JOIN drug_catalog dc2 ON di.drug2_id = dc2.id
WHERE di.is_active = true;

-- View for patient allergy summary
CREATE OR REPLACE VIEW patient_allergies_view AS
SELECT 
    pa.*,
    p.first_name || ' ' || p.last_name as patient_name,
    p.uhid,
    dc.drug_code,
    dc.drug_name,
    ac.allergen_code,
    ac.category as allergen_category
FROM patient_allergies pa
JOIN patients p ON pa.patient_id = p.id
LEFT JOIN drug_catalog dc ON pa.drug_id = dc.id
LEFT JOIN allergen_catalog ac ON pa.allergen_id = ac.id
WHERE pa.resolved = false;

-- ==================== TRIGGERS ====================

CREATE TRIGGER update_drug_interactions_updated_at 
    BEFORE UPDATE ON drug_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_allergies_updated_at 
    BEFORE UPDATE ON patient_allergies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== COMMENTS ====================
COMMENT ON TABLE drug_interactions IS 'Drug-drug interactions with severity and management';
COMMENT ON TABLE patient_allergies IS 'Patient allergy records';
COMMENT ON TABLE allergen_catalog IS 'Master catalog of allergens';
COMMENT ON FUNCTION check_drug_interactions IS 'Checks for interactions between given drugs';
COMMENT ON FUNCTION check_patient_allergies IS 'Checks patient allergies against drug list';
COMMENT ON FUNCTION get_cross_reactive_allergens IS 'Returns cross-reactive allergens for a given allergen';

-- ==================== SAFETY CHECK ====================
-- Create a safety check that runs before prescription
CREATE OR REPLACE FUNCTION safety_check_prescription(
    patient_id UUID,
    drug_ids UUID[]
) RETURNS JSONB AS $$
DECLARE
    interactions JSONB;
    allergies JSONB;
    result JSONB;
BEGIN
    -- Check drug interactions
    SELECT jsonb_agg(jsonb_build_object(
        'type', 'interaction',
        'drug1_name', di.drug1_name,
        'drug2_name', di.drug2_name,
        'severity', di.severity,
        'description', di.description,
        'management', di.management
    )) INTO interactions
    FROM check_drug_interactions(drug_ids, patient_id) di;

    -- Check allergies
    SELECT jsonb_agg(jsonb_build_object(
        'type', 'allergy',
        'allergen_name', ca.allergen_name,
        'reaction', ca.reaction,
        'severity', ca.severity,
        'drug_name', ca.drug_name
    )) INTO allergies
    FROM check_patient_allergies(patient_id, drug_ids) ca;

    -- Build result
    result = jsonb_build_object(
        'has_interactions', interactions IS NOT NULL,
        'has_allergies', allergies IS NOT NULL,
        'interactions', COALESCE(interactions, '[]'::jsonb),
        'allergies', COALESCE(allergies, '[]'::jsonb),
        'is_safe', (interactions IS NULL AND allergies IS NULL) OR
                   (NOT EXISTS (
                       SELECT 1 FROM jsonb_array_elements(COALESCE(interactions, '[]'::jsonb)) i
                       WHERE (i->>'severity') IN ('contraindicated', 'major')
                   ))
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;