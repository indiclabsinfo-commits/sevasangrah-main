
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        try {
            const result = await pool.query(`
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
        WHERE p.date_of_entry >= $1 AND p.date_of_entry <= $2
          AND (p.is_active = true OR p.is_active IS NULL)
        ORDER BY p.date_of_entry DESC
      `, [start_date, end_date]);

            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching patients by date range:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
