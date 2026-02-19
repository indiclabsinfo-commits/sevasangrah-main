-- ==========================================
-- CREATE SECURITY DEFINER FUNCTIONS
-- These bypass RLS entirely because they
-- run as the table owner (postgres role).
-- Run this in the Supabase SQL Editor.
-- ==========================================

-- Also run disable_rls.sql and fix_patient_transactions.sql FIRST if not done.

-- 1. Function to insert a patient record
CREATE OR REPLACE FUNCTION insert_patient_record(patient_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result patients%ROWTYPE;
BEGIN
  INSERT INTO patients (
    patient_id, uhid, first_name, last_name, prefix, age, gender,
    phone, email, address, blood_group, aadhaar_number, abha_id,
    rghs_number, date_of_birth, patient_tag, medical_history,
    allergies, current_medications, emergency_contact_name,
    emergency_contact_phone, has_reference, reference_details,
    photo_url, notes, date_of_entry, assigned_doctor,
    assigned_department, has_pending_appointment, hospital_id
  ) VALUES (
    patient_data->>'patient_id',
    patient_data->>'uhid',
    COALESCE(patient_data->>'first_name', ''),
    COALESCE(patient_data->>'last_name', ''),
    COALESCE(patient_data->>'prefix', 'Mr'),
    COALESCE((patient_data->>'age')::integer, 0),
    COALESCE(patient_data->>'gender', 'MALE'),
    COALESCE(patient_data->>'phone', ''),
    patient_data->>'email',
    COALESCE(patient_data->>'address', ''),
    patient_data->>'blood_group',
    patient_data->>'aadhaar_number',
    patient_data->>'abha_id',
    patient_data->>'rghs_number',
    patient_data->>'date_of_birth',
    COALESCE(patient_data->>'patient_tag', 'Regular'),
    patient_data->>'medical_history',
    patient_data->>'allergies',
    patient_data->>'current_medications',
    COALESCE(patient_data->>'emergency_contact_name', ''),
    COALESCE(patient_data->>'emergency_contact_phone', ''),
    COALESCE((patient_data->>'has_reference')::boolean, false),
    patient_data->>'reference_details',
    patient_data->>'photo_url',
    patient_data->>'notes',
    patient_data->>'date_of_entry',
    patient_data->>'assigned_doctor',
    patient_data->>'assigned_department',
    COALESCE((patient_data->>'has_pending_appointment')::boolean, false),
    CASE WHEN patient_data->>'hospital_id' IS NOT NULL 
         THEN (patient_data->>'hospital_id')::uuid 
         ELSE NULL END
  )
  RETURNING * INTO result;

  RETURN to_jsonb(result);
END;
$$;

-- 2. Function to insert a transaction record
CREATE OR REPLACE FUNCTION insert_transaction_record(transaction_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result patient_transactions%ROWTYPE;
BEGIN
  INSERT INTO patient_transactions (
    patient_id, transaction_type, amount, payment_mode,
    doctor_name, department, description, status,
    transaction_date, discount_type, discount_value,
    discount_reason, online_payment_method, rghs_number
  ) VALUES (
    (transaction_data->>'patient_id')::uuid,
    COALESCE(transaction_data->>'transaction_type', 'CONSULTATION'),
    COALESCE((transaction_data->>'amount')::numeric, 0),
    COALESCE(transaction_data->>'payment_mode', 'CASH'),
    transaction_data->>'doctor_name',
    transaction_data->>'department',
    COALESCE(transaction_data->>'description', ''),
    COALESCE(transaction_data->>'status', 'COMPLETED'),
    transaction_data->>'transaction_date',
    transaction_data->>'discount_type',
    (transaction_data->>'discount_value')::numeric,
    transaction_data->>'discount_reason',
    transaction_data->>'online_payment_method',
    transaction_data->>'rghs_number'
  )
  RETURNING * INTO result;

  RETURN to_jsonb(result);
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION insert_patient_record(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION insert_patient_record(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_transaction_record(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION insert_transaction_record(jsonb) TO authenticated;

-- Verify functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('insert_patient_record', 'insert_transaction_record');
