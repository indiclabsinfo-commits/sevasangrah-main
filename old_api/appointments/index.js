
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';
import crypto from 'crypto';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        try {
            const { doctor_id, patient_id, date, status } = req.query;
            let query = 'SELECT * FROM appointments WHERE 1=1';
            const params = [];
            let paramCount = 1;

            if (doctor_id) {
                query += ` AND doctor_id = $${paramCount} `;
                params.push(doctor_id);
                paramCount++;
            }
            if (patient_id) {
                query += ` AND patient_id = $${paramCount} `;
                params.push(patient_id);
                paramCount++;
            }
            if (date) {
                query += ` AND DATE(scheduled_at) = $${paramCount} `;
                params.push(date);
                paramCount++;
            }
            if (status) {
                query += ` AND status = $${paramCount} `;
                params.push(status);
                paramCount++;
            }

            query += ' ORDER BY scheduled_at ASC';
            const result = await pool.query(query, params);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else if (req.method === 'POST') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const {
                patient_id, doctor_id, department_id, scheduled_at, duration,
                status, reason, appointment_type, notes, recurrence
            } = req.body;

            const baseDate = new Date(scheduled_at);
            const appointmentsToCreate = [];
            const recurringGroupId = recurrence ? crypto.randomUUID() : null;

            const addDays = (date, days) => {
                const result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            };

            const addMonths = (date, months) => {
                const result = new Date(date);
                result.setMonth(result.getMonth() + months);
                return result;
            };

            if (recurrence && recurrence.endDate) {
                const endDate = new Date(recurrence.endDate);
                let currentDate = baseDate;
                const MAX_OCCURRENCES = 52;
                let count = 0;

                while (currentDate <= endDate && count < MAX_OCCURRENCES) {
                    appointmentsToCreate.push(new Date(currentDate));

                    if (recurrence.frequency === 'daily') {
                        currentDate = addDays(currentDate, 1);
                    } else if (recurrence.frequency === 'weekly') {
                        currentDate = addDays(currentDate, 7);
                    } else if (recurrence.frequency === 'monthly') {
                        currentDate = addMonths(currentDate, 1);
                    } else {
                        break;
                    }
                    count++;
                }
            } else {
                appointmentsToCreate.push(baseDate);
            }

            let firstCreatedAppointment = null;

            for (const aptDate of appointmentsToCreate) {
                const result = await client.query(
                    `INSERT INTO appointments(
              patient_id, doctor_id, department_id, scheduled_at, duration,
              status, reason, appointment_type, notes, created_by, recurring_group_id
            ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING * `,
                    [
                        patient_id, doctor_id, department_id, aptDate.toISOString(), duration,
                        status || 'SCHEDULED', reason, appointment_type, notes, req.user?.id || 'system', recurringGroupId
                    ]
                );
                if (!firstCreatedAppointment) firstCreatedAppointment = result.rows[0];
            }

            await client.query('COMMIT');
            res.status(201).json(firstCreatedAppointment);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating appointment:', error);
            res.status(500).json({ error: 'Server error' });
        } finally {
            client.release();
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
