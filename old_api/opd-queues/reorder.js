
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { items } = req.body; // Array of { id, order }

            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid request: items array required' });
            }

            // Update queue_no for each patient based on new order
            const updatePromises = items.map(item =>
                pool.query(
                    'UPDATE patients SET queue_no = $1 WHERE id = $2',
                    [item.order, item.id]
                )
            );

            await Promise.all(updatePromises);

            res.status(200).json({ success: true, message: 'Queue reordered successfully' });
        } catch (error) {
            console.error('Error reordering queue:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
