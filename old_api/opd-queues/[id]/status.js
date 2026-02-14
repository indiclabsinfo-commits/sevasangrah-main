
import pool from '../../../_lib/db.js';
import allowCors from '../../../_lib/cors.js';
import authenticate from '../../../_lib/auth.js';

const handler = async (req, res) => {
    const { id } = req.query; // dynamic route param

    if (req.method === 'PUT') {
        try {
            let { queue_status } = req.body;

            // Normalize status to lowercase and map common values
            const statusMap = {
                'WAITING': 'waiting',
                'waiting': 'waiting',
                'IN_CONSULTATION': 'called',
                'called': 'called',
                'COMPLETED': 'completed',
                'completed': 'completed',
                'VITALS_DONE': 'waiting' // Map VITALS_DONE to waiting
            };

            queue_status = statusMap[queue_status] || (queue_status ? queue_status.toLowerCase() : 'waiting');

            if (!['waiting', 'called', 'completed'].includes(queue_status)) {
                return res.status(400).json({ error: 'Invalid queue status', received: queue_status });
            }

            const result = await pool.query(
                `UPDATE patients
         SET queue_status = $1
         WHERE id = $2
         RETURNING id, patient_id, first_name, last_name, queue_no, queue_status`,
                [queue_status, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error updating queue status:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
