
import pool from './_lib/db.js';
import allowCors from './_lib/cors.js';
import authenticate from './_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM departments ORDER BY name');
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching departments:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
