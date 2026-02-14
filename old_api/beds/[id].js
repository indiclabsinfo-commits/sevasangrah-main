
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM beds WHERE id = $1', [id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Bed not found' });
            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching bed:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else if (req.method === 'PUT') {
        try {
            const updates = req.body;
            // Filter out only valid columns or use dynamic logic safely
            // For simplicity, we trust the body but should be careful in prod
            // The server.js implementation explicitly checks fields. Let's do dynamic for brevity but safe enough for internal tool

            const allowedFields = [
                'status', 'patient_id', 'ipd_number', 'admission_date', 'admission_id',
                'tat_status', 'tat_remaining_seconds', 'consent_form_submitted',
                'clinical_record_submitted', 'progress_sheet_submitted', 'nurses_orders_submitted'
            ];

            const cleanUpdates = {};
            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    cleanUpdates[key] = updates[key];
                }
            });

            if (Object.keys(cleanUpdates).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            const setClause = Object.keys(cleanUpdates)
                .map((key, index) => `${key} = $${index + 2} `)
                .join(', ');

            const values = [id, ...Object.values(cleanUpdates)];

            const result = await pool.query(
                `UPDATE beds SET ${setClause} WHERE id = $1 RETURNING *`,
                values
            );

            if (result.rows.length === 0) return res.status(404).json({ error: 'Bed not found' });
            res.status(200).json(result.rows[0]);

        } catch (error) {
            console.error('Error updating bed:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
