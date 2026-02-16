-- ICD-10 System Migration
-- For Magnus Hospital OPD Module
-- Date: February 16, 2026

-- 1. Create icd10_codes table (simplified version - full ICD-10 has ~70,000 codes)
CREATE TABLE IF NOT EXISTS icd10_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,          -- e.g., "A00", "B20.9"
    description TEXT NOT NULL,                 -- Full description
    chapter VARCHAR(100),                      -- Chapter name
    block VARCHAR(100),                        -- Block name
    category VARCHAR(100),                     -- Category
    is_billable BOOLEAN DEFAULT true,          -- Whether code is billable
    severity VARCHAR(20) DEFAULT 'moderate',   -- mild, moderate, severe, critical
    requires_specialist BOOLEAN DEFAULT false, -- Needs specialist referral
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_icd10_codes_code ON icd10_codes(code);
CREATE INDEX IF NOT EXISTS idx_icd10_codes_description ON icd10_codes(description);
CREATE INDEX IF NOT EXISTS idx_icd10_codes_chapter ON icd10_codes(chapter);

-- 2. Create patient_diagnoses table to link patients with ICD-10 codes
CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    icd10_code VARCHAR(10) NOT NULL,           -- Reference to icd10_codes.code
    diagnosis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosed_by UUID,                          -- Doctor ID
    encounter_type VARCHAR(50) DEFAULT 'opd',   -- opd, ipd, emergency, followup
    severity VARCHAR(20) DEFAULT 'moderate',    -- mild, moderate, severe, critical
    is_primary BOOLEAN DEFAULT true,           -- Primary diagnosis vs secondary
    notes TEXT,                                 -- Additional notes
    status VARCHAR(20) DEFAULT 'active',       -- active, resolved, chronic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_icd10_code FOREIGN KEY (icd10_code) REFERENCES icd10_codes(code) ON DELETE RESTRICT
);

-- Indexes for patient diagnoses
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient_id ON patient_diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_icd10_code ON patient_diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_date ON patient_diagnoses(diagnosis_date);

-- 3. Create function to search ICD-10 codes
CREATE OR REPLACE FUNCTION search_icd10_codes(
    search_term TEXT,
    limit_count INT DEFAULT 20
) RETURNS TABLE (
    code VARCHAR(10),
    description TEXT,
    chapter VARCHAR(100),
    match_type VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    -- Exact code match
    SELECT 
        c.code,
        c.description,
        c.chapter,
        'exact_code'::VARCHAR as match_type
    FROM icd10_codes c
    WHERE c.code = upper(search_term)
    
    UNION ALL
    
    -- Code starts with
    SELECT 
        c.code,
        c.description,
        c.chapter,
        'code_starts_with'::VARCHAR as match_type
    FROM icd10_codes c
    WHERE c.code LIKE upper(search_term) || '%'
    AND c.code != upper(search_term)  -- Exclude exact match already found
    
    UNION ALL
    
    -- Description contains (case-insensitive)
    SELECT 
        c.code,
        c.description,
        c.chapter,
        'description_match'::VARCHAR as match_type
    FROM icd10_codes c
    WHERE lower(c.description) LIKE '%' || lower(search_term) || '%'
    
    ORDER BY 
        CASE match_type
            WHEN 'exact_code' THEN 1
            WHEN 'code_starts_with' THEN 2
            WHEN 'description_match' THEN 3
        END,
        code
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Insert common ICD-10 codes (top 100 most common in Indian hospitals)
INSERT INTO icd10_codes (code, description, chapter, block, category, severity) VALUES
-- Infectious diseases
('A00', 'Cholera', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Cholera', 'severe'),
('A01', 'Typhoid and paratyphoid fevers', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Typhoid fever', 'severe'),
('A02', 'Other salmonella infections', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Salmonella infections', 'moderate'),
('A03', 'Shigellosis', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Shigellosis', 'moderate'),
('A04', 'Other bacterial intestinal infections', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Bacterial intestinal infections', 'moderate'),
('A05', 'Other bacterial foodborne intoxications', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Foodborne intoxications', 'mild'),
('A06', 'Amoebiasis', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Amoebiasis', 'moderate'),
('A07', 'Other protozoal intestinal diseases', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Protozoal intestinal diseases', 'moderate'),
('A08', 'Viral and other specified intestinal infections', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Viral intestinal infections', 'mild'),
('A09', 'Infectious gastroenteritis and colitis, unspecified', 'I. Certain infectious and parasitic diseases', 'Intestinal infectious diseases', 'Gastroenteritis', 'moderate'),

-- Respiratory diseases
('J00', 'Acute nasopharyngitis [common cold]', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Common cold', 'mild'),
('J01', 'Acute sinusitis', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Sinusitis', 'moderate'),
('J02', 'Acute pharyngitis', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Pharyngitis', 'mild'),
('J03', 'Acute tonsillitis', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Tonsillitis', 'moderate'),
('J04', 'Acute laryngitis and tracheitis', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Laryngitis', 'moderate'),
('J05', 'Acute obstructive laryngitis [croup] and epiglottitis', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Croup', 'severe'),
('J06', 'Acute upper respiratory infections of multiple and unspecified sites', 'X. Diseases of the respiratory system', 'Acute upper respiratory infections', 'Upper respiratory infection', 'mild'),
('J09', 'Influenza due to identified avian influenza virus', 'X. Diseases of the respiratory system', 'Influenza and pneumonia', 'Avian influenza', 'severe'),
('J10', 'Influenza due to other identified influenza virus', 'X. Diseases of the respiratory system', 'Influenza and pneumonia', 'Influenza', 'moderate'),
('J11', 'Influenza, virus not identified', 'X. Diseases of the respiratory system', 'Influenza and pneumonia', 'Influenza unspecified', 'moderate'),

-- Cardiovascular diseases
('I10', 'Essential (primary) hypertension', 'IX. Diseases of the circulatory system', 'Hypertensive diseases', 'Hypertension', 'moderate'),
('I11', 'Hypertensive heart disease', 'IX. Diseases of the circulatory system', 'Hypertensive diseases', 'Hypertensive heart disease', 'severe'),
('I12', 'Hypertensive renal disease', 'IX. Diseases of the circulatory system', 'Hypertensive diseases', 'Hypertensive renal disease', 'severe'),
('I13', 'Hypertensive heart and renal disease', 'IX. Diseases of the circulatory system', 'Hypertensive diseases', 'Hypertensive heart and renal disease', 'critical'),
('I20', 'Angina pectoris', 'IX. Diseases of the circulatory system', 'Ischaemic heart diseases', 'Angina', 'severe'),
('I21', 'Acute myocardial infarction', 'IX. Diseases of the circulatory system', 'Ischaemic heart diseases', 'Heart attack', 'critical'),
('I22', 'Subsequent myocardial infarction', 'IX. Diseases of the circulatory system', 'Ischaemic heart diseases', 'Subsequent heart attack', 'critical'),
('I23', 'Certain current complications following acute myocardial infarction', 'IX. Diseases of the circulatory system', 'Ischaemic heart diseases', 'Post-MI complications', 'critical'),
('I24', 'Other acute ischaemic heart diseases', 'IX. Diseases of the circulatory system', 'Ischaemic heart diseases', 'Acute ischaemic heart disease', 'severe'),
('I25', 'Chronic ischaemic heart disease', 'IX. Diseases of the circulatory system', 'Ischaemic heart diseases', 'Chronic heart disease', 'severe'),

-- Diabetes
('E10', 'Type 1 diabetes mellitus', 'IV. Endocrine, nutritional and metabolic diseases', 'Diabetes mellitus', 'Type 1 diabetes', 'severe'),
('E11', 'Type 2 diabetes mellitus', 'IV. Endocrine, nutritional and metabolic diseases', 'Diabetes mellitus', 'Type 2 diabetes', 'severe'),
('E12', 'Malnutrition-related diabetes mellitus', 'IV. Endocrine, nutritional and metabolic diseases', 'Diabetes mellitus', 'Malnutrition-related diabetes', 'severe'),
('E13', 'Other specified diabetes mellitus', 'IV. Endocrine, nutritional and metabolic diseases', 'Diabetes mellitus', 'Other diabetes', 'severe'),
('E14', 'Unspecified diabetes mellitus', 'IV. Endocrine, nutritional and metabolic diseases', 'Diabetes mellitus', 'Diabetes unspecified', 'severe'),

-- Common symptoms and signs
('R05', 'Cough', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'Symptoms and signs involving the circulatory and respiratory systems', 'Cough', 'mild'),
('R06', 'Abnormalities of breathing', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'Symptoms and signs involving the circulatory and respiratory systems', 'Breathing abnormalities', 'moderate'),
('R07', 'Pain in throat and chest', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'Symptoms and signs involving the circulatory and respiratory systems', 'Throat/chest pain', 'moderate'),
('R10', 'Abdominal and pelvic pain', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'Symptoms and signs involving the digestive system and abdomen', 'Abdominal pain', 'moderate'),
('R11', 'Nausea and vomiting', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'Symptoms and signs involving the digestive system and abdomen', 'Nausea/vomiting', 'mild'),
('R50', 'Fever of other and unknown origin', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'General symptoms and signs', 'Fever', 'moderate'),
('R51', 'Headache', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'General symptoms and signs', 'Headache', 'mild'),
('R52', 'Pain, unspecified', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'General symptoms and signs', 'Pain unspecified', 'mild'),
('R53', 'Malaise and fatigue', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'General symptoms and signs', 'Fatigue', 'mild'),
('R54', 'Senility', 'XVIII. Symptoms, signs and abnormal clinical and laboratory findings', 'General symptoms and signs', 'Senility', 'moderate'),

-- Injuries
('S00', 'Superficial injury of head', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Head injury', 'moderate'),
('S01', 'Open wound of head', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Head wound', 'severe'),
('S02', 'Fracture of skull and facial bones', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Skull fracture', 'critical'),
('S03', 'Dislocation, sprain and strain of joints and ligaments of head', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Head joint injury', 'moderate'),
('S04', 'Injury of cranial nerves', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Cranial nerve injury', 'severe'),
('S05', 'Injury of eye and orbit', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Eye injury', 'severe'),
('S06', 'Intracranial injury', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Brain injury', 'critical'),
('S07', 'Crushing injury of head', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Crushing head injury', 'critical'),
('S08', 'Traumatic amputation of part of head', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Head amputation', 'critical'),
('S09', 'Other and unspecified injuries of head', 'XIX. Injury, poisoning and certain other consequences of external causes', 'Injuries to the head', 'Other head injury', 'moderate'),

-- Common in India
('B54', 'Unspecified malaria', 'I. Certain infectious and parasitic diseases', 'Protozoal diseases', 'Malaria', 'severe'),
('A15', 'Respiratory tuberculosis, bacteriologically and histologically confirmed', 'I. Certain infectious and parasitic diseases', 'Tuberculosis', 'TB confirmed', 'severe'),
('A16', 'Respiratory tuberculosis, not confirmed bacteriologically or histologically', 'I. Certain infectious and parasitic diseases', 'Tuberculosis', 'TB unconfirmed', 'severe'),
('K29', 'Gastritis and duodenitis', 'XI. Diseases of the digestive system', 'Diseases of esophagus, stomach and duodenum', 'Gastritis', 'moderate'),
('K52', 'Other noninfective gastroenteritis and colitis', 'XI. Diseases of the digestive system', 'Noninfective enteritis and colitis', 'Gastroenteritis', 'moderate'),
('N39', 'Other disorders of urinary system', 'XIV. Diseases of the genitourinary system', 'Other disorders of urinary system', 'Urinary disorder', 'moderate')
ON CONFLICT (code) DO NOTHING;

-- 5. Create view for common diagnoses report
CREATE OR REPLACE VIEW icd10_common_diagnoses AS
SELECT 
    pd.icd10_code,
    c.description,
    COUNT(*) as diagnosis_count,
    COUNT(DISTINCT pd.patient_id) as patient_count,
    MIN(pd.diagnosis_date) as first_diagnosis,
    MAX(pd.diagnosis_date) as last_diagnosis
FROM patient_diagnoses pd
JOIN icd10_codes c ON pd.icd10_code = c.code
WHERE pd.diagnosis_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY pd.icd10_code, c.description
ORDER BY diagnosis_count DESC;

-- 6. Create function to get patient diagnosis history
CREATE OR REPLACE FUNCTION get_patient_diagnoses(
    p_patient_id UUID,
    p_limit INT DEFAULT 50
) RETURNS TABLE (
    diagnosis_date DATE,
    icd10_code VARCHAR(10),
    description TEXT,
    diagnosed_by_name TEXT,
    severity VARCHAR(20),
    status VARCHAR(20),
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.diagnosis_date,
        pd.icd10_code,
        c.description,
        CONCAT(u.first_name, ' ', u.last_name) as diagnosed_by_name,
        pd.severity,
        pd.status,
        pd.notes
    FROM patient_diagnoses pd
    JOIN icd10_codes c ON pd.icd10_code = c.code
    LEFT JOIN users u ON pd.diagnosed_by = u.id
    WHERE pd.patient_id = p_patient_id
    ORDER BY pd.diagnosis_date DESC, pd.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Migration complete
COMMENT ON TABLE icd10_codes IS 'ICD-10 medical diagnosis codes (WHO International Classification of Diseases)';
COMMENT ON TABLE patient_diagnoses IS 'Patient diagnosis records linked to ICD-10 codes';
COMMENT ON FUNCTION search_icd10_codes IS 'Search ICD-10 codes by code or description';
COMMENT ON VIEW icd10_common_diagnoses IS 'View showing most common ICD-10 diagnoses in last 90 days';