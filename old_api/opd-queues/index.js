
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        // GET /api/opd-queues
        try {
            const { date, status, doctor_id } = req.query;

            // Default to today if no date provided
            const queryDate = date || new Date().toISOString().split('T')[0];
            const params = [queryDate];
            let paramIndex = 2;

            let query = `
        SELECT
          id,
          patient_id,
          first_name,
          last_name,
          age,
          gender,
          phone,
          patient_id as patient_code,
          queue_no,
          COALESCE(queue_status, 'waiting') as queue_status,
          queue_date,
          assigned_doctor,
          created_at
        FROM patients
        WHERE queue_date = $1
      `;

            if (status) {
                query += ` AND queue_status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (doctor_id) {
                query += ` AND assigned_doctor = $${paramIndex}`;
                params.push(doctor_id);
                paramIndex++;
            }

            query += ` ORDER BY queue_no ASC`;

            const result = await pool.query(query, params);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching OPD queue:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else if (req.method === 'POST') {
        // POST /api/opd-queues - Add to OPD Queue (Manual Add)
        try {
            const { patient_id, doctor_id, appointment_id, priority, notes } = req.body;
            const today = new Date().toISOString().split('T')[0];

            // Get last queue number for today
            const lastQueueResult = await pool.query(
                `SELECT queue_no FROM patients
         WHERE queue_date = $1
         ORDER BY queue_no DESC
         LIMIT 1`,
                [today]
            );

            let queueNumber = 1;
            if (lastQueueResult.rows.length > 0 && lastQueueResult.rows[0].queue_no) {
                queueNumber = lastQueueResult.rows[0].queue_no + 1;
            }

            // Resolve Doctor ID to Name (Legacy Compatibility)
            let doctorName = null;
            if (doctor_id) {
                try {
                    // Check if doctor_id is a UUID
                    if (doctor_id.match(/^[0-9a-fA-F-]{36}$/)) {
                        const docResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [doctor_id]);
                        if (docResult.rows.length > 0) {
                            const doc = docResult.rows[0];
                            doctorName = `Dr. ${doc.first_name} ${doc.last_name}`;
                        }
                    }
                } catch (err) {
                    console.warn('Could not resolve doctor name from ID:', doctor_id);
                }
            }

            const finalDoctorValue = doctorName || (doctor_id && !doctor_id.match(/^[0-9a-fA-F-]{36}$/) ? doctor_id : null);

            const updateQuery = `
        UPDATE patients
        SET 
          queue_no = $1,
          queue_status = 'waiting',
          queue_date = $2,
          assigned_doctor = COALESCE($3, assigned_doctor),
          has_pending_appointment = false,
          is_active = true
        WHERE id = $4
        RETURNING *
      `;

            const result = await pool.query(updateQuery, [queueNumber, today, finalDoctorValue, patient_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            res.status(200).json(result.rows[0]);

        } catch (error) {
            console.error('Error adding to OPD queue:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
