
import pool from '../../../../_lib/db.js'; // Adjust path for nested folder
import allowCors from '../../../../_lib/cors.js';
import authenticate from '../../../../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        const { date, limit } = req.query;

        try {
            let query = `
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
        WHERE p.date_of_entry::date = $1
          AND (p.is_active = true OR p.is_active IS NULL)
        ORDER BY p.date_of_entry DESC
      `;

            const params = [date];

            if (limit) {
                query += ` LIMIT $2`;
                params.push(limit);
            }

            const result = await pool.query(query, params);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching patients by date:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
