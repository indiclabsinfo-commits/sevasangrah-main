
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        try {
            const { status } = req.query;
            let query = 'SELECT * FROM beds';
            const params = [];

            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
            }

            query += ' ORDER BY bed_number';

            const result = await pool.query(query, params);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching beds:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
