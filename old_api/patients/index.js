
import pool from '../_lib/db.js';
import allowCors from '../_lib/cors.js';
import authenticate from '../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        // GET /api/patients
        // Supports query params: start_date, end_date (for filtering)
        try {
            const { start_date, end_date } = req.query;

            let queryText = `
        SELECT
          p.*,
          COALESCE(
            (SELECT json_agg(row_to_json(pt.*))
             FROM patient_transactions pt
             WHERE pt.patient_id = p.id),
            '[]'::json
          ) as transactions,
          COALESCE(
            (SELECT json_agg(row_to_json(pa.*))
             FROM patient_admissions pa
             WHERE pa.patient_id = p.id),
            '[]'::json
          ) as admissions
        FROM patients p
        WHERE (p.is_active = true OR p.is_active IS NULL)
      `;

            const params = [];

            if (start_date && end_date) {
                queryText += ` AND p.date_of_entry >= $1 AND p.date_of_entry <= $2`;
                params.push(start_date, end_date);
            }

            queryText += ` ORDER BY p.created_at DESC`;

            const result = await pool.query(queryText, params);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching patients:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else if (req.method === 'POST') {
        // POST /api/patients - Create new patient
        try {
            const {
                first_name,
                last_name,
                age,
                gender,
                phone,
                email,
                address,
                emergency_contact_name,
                emergency_contact_phone,
                medical_history,
                allergies,
                current_medications,
                blood_group,
                notes,
                date_of_entry,
                photo_url,
                patient_tag,
                prefix,
                date_of_birth,
                assigned_doctor,
                assigned_department,
                has_reference,
                reference_details,
                abha_id,
                aadhaar_number,
                has_pending_appointment
            } = req.body;

            // Auto-generate patient_id in format M000001
            let generatedPatientId;

            const lastPatientResult = await pool.query(
                `SELECT patient_id FROM patients
         WHERE patient_id LIKE 'M%'
         ORDER BY patient_id DESC
         LIMIT 1`
            );

            if (lastPatientResult.rows.length > 0 && lastPatientResult.rows[0].patient_id) {
                const lastId = lastPatientResult.rows[0].patient_id;
                const numericPart = parseInt(lastId.substring(1)) || 0;
                const nextNumber = numericPart + 1;
                generatedPatientId = 'M' + nextNumber.toString().padStart(6, '0');
            } else {
                generatedPatientId = 'M000001';
            }

            // Auto-generate queue number (resets daily)
            const today = new Date().toISOString().split('T')[0];

            const lastQueueResult = await pool.query(
                `SELECT queue_no FROM patients
         WHERE queue_date = $1
         ORDER BY queue_no DESC
         LIMIT 1`,
                [today]
            );

            let queueNumber;
            if (lastQueueResult.rows.length > 0 && lastQueueResult.rows[0].queue_no) {
                queueNumber = lastQueueResult.rows[0].queue_no + 1;
            } else {
                queueNumber = 1;
            }

            // Create Patient
            const result = await pool.query(
                `INSERT INTO patients (
          id, patient_id, prefix, first_name, last_name, age, gender, phone, email, address,
          emergency_contact_name, emergency_contact_phone, medical_history,
          allergies, current_medications, blood_group, notes, date_of_entry, date_of_birth,
          photo_url, patient_tag, abha_id, aadhaar_number, assigned_doctor, assigned_department,
          has_reference, reference_details, created_by, is_active,
          queue_no, queue_status, queue_date, has_pending_appointment
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
        RETURNING *`,
                [
                    generatedPatientId, prefix || 'Mr', first_name || '', last_name || '', age || '0', gender ? gender.toUpperCase() : 'MALE', phone || '', email, address,
                    emergency_contact_name, emergency_contact_phone, medical_history,
                    allergies, current_medications, blood_group, notes, date_of_entry, date_of_birth,
                    photo_url, patient_tag, abha_id, aadhaar_number, assigned_doctor, assigned_department,
                    has_reference, reference_details, req.user?.id || 'system', true,
                    queueNumber, 'waiting', today, has_pending_appointment || false
                ]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating patient:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
