
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const updates = req.body;
            const setClause = Object.keys(updates)
                .map((key, index) => `${key} = $${index + 2} `)
                .join(', ');

            if (!setClause) return res.status(400).json({ error: 'No updates provided' });

            const values = [id, ...Object.values(updates)];

            const result = await pool.query(
                `UPDATE appointments SET ${setClause} WHERE id = $1 RETURNING * `,
                values
            );

            if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error updating appointment:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
