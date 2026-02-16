-- Patient Photo Upload Migration
-- Feature #9: Patient photo upload
-- Date: February 16, 2026

-- 1. Add photo_url column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP WITH TIME ZONE;

-- 2. Create storage bucket for patient photos (if not exists)
-- Note: This requires RLS policies to be set up in Supabase Storage
COMMENT ON COLUMN patients.photo_url IS 'URL to full-size patient photo in Supabase Storage';
COMMENT ON COLUMN patients.photo_thumbnail_url IS 'URL to thumbnail version of patient photo';
COMMENT ON COLUMN patients.photo_uploaded_at IS 'Timestamp when photo was uploaded';

-- 3. Create function to generate patient photo path
CREATE OR REPLACE FUNCTION generate_patient_photo_path(
    patient_id UUID,
    filename TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN 'patient-photos/' || patient_id || '/' || filename;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to update photo metadata
CREATE OR REPLACE FUNCTION update_patient_photo(
    p_patient_id UUID,
    p_photo_url TEXT,
    p_thumbnail_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE patients
    SET 
        photo_url = p_photo_url,
        photo_thumbnail_url = COALESCE(p_thumbnail_url, p_photo_url),
        photo_uploaded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_patient_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to remove patient photo
CREATE OR REPLACE FUNCTION remove_patient_photo(
    p_patient_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE patients
    SET 
        photo_url = NULL,
        photo_thumbnail_url = NULL,
        photo_uploaded_at = NULL,
        updated_at = NOW()
    WHERE id = p_patient_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Create view for patients with photos
CREATE OR REPLACE VIEW patients_with_photos AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.age,
    p.gender,
    p.phone,
    p.uhid,
    p.photo_url,
    p.photo_thumbnail_url,
    p.photo_uploaded_at,
    CASE 
        WHEN p.photo_url IS NOT NULL THEN true
        ELSE false
    END as has_photo,
    EXTRACT(DAY FROM NOW() - p.photo_uploaded_at) as days_since_photo_upload
FROM patients p
ORDER BY p.photo_uploaded_at DESC NULLS LAST;

-- 7. Create function to get photo statistics
CREATE OR REPLACE FUNCTION get_patient_photo_stats()
RETURNS TABLE (
    total_patients BIGINT,
    patients_with_photos BIGINT,
    patients_without_photos BIGINT,
    photo_coverage_percentage DECIMAL(5,2),
    latest_photo_upload TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as patients_with_photos,
        COUNT(CASE WHEN photo_url IS NULL THEN 1 END) as patients_without_photos,
        ROUND(
            COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) * 100.0 / 
            NULLIF(COUNT(*), 0), 
            2
        ) as photo_coverage_percentage,
        MAX(photo_uploaded_at) as latest_photo_upload
    FROM patients;
END;
$$ LANGUAGE plpgsql;

-- Migration complete
COMMENT ON FUNCTION generate_patient_photo_path IS 'Generates storage path for patient photos';
COMMENT ON FUNCTION update_patient_photo IS 'Updates patient photo metadata in database';
COMMENT ON FUNCTION remove_patient_photo IS 'Removes patient photo metadata from database';
COMMENT ON VIEW patients_with_photos IS 'View showing patients with photo information';
COMMENT ON FUNCTION get_patient_photo_stats IS 'Get statistics about patient photo coverage';