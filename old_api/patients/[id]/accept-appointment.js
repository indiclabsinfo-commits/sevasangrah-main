
import pool from '../../../_lib/db.js';
import allowCors from '../../../_lib/cors.js';
import authenticate from '../../../_lib/auth.js';

const handler = async (req, res) => {
    const { id } = req.query; // dynamic route param

    if (req.method === 'PUT') {
        try {
            const result = await pool.query(
                `UPDATE patients
         SET has_pending_appointment = false,
             queue_status = 'waiting'
         WHERE id = $1
         RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error accepting appointment:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
