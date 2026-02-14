
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    const { id } = req.query; // in Vercel dynamic routes, path params are in query

    if (req.method === 'GET') {
        // GET /api/patients/:id
        try {
            const result = await pool.query(
                'SELECT * FROM patients WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching patient:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else if (req.method === 'PUT') {
        // PUT /api/patients/:id
        try {
            const updates = req.body;

            // Build dynamic update query
            const setClause = Object.keys(updates)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');

            if (!setClause) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            const values = [id, ...Object.values(updates)];

            const result = await pool.query(
                `UPDATE patients SET ${setClause} WHERE id = $1 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error updating patient:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else if (req.method === 'DELETE') {
        // DELETE /api/patients/:id
        try {
            console.log('🗑️ Deleting patient with ID:', id);

            // First, delete related records to avoid foreign key constraints
            // Delete patient transactions
            await pool.query('DELETE FROM patient_transactions WHERE patient_id = $1', [id]);

            // Delete patient admissions
            await pool.query('DELETE FROM patient_admissions WHERE patient_id = $1', [id]);

            // Delete patient refunds
            await pool.query('DELETE FROM patient_refunds WHERE patient_id = $1', [id]);

            // Delete complete patient record related data if exists
            const clinicalTables = [
                'patient_high_risk',
                'patient_chief_complaints',
                'patient_examination',
                'patient_investigation',
                'patient_diagnosis',
                'patient_enhanced_prescription',
                'patient_record_summary'
            ];

            for (const table of clinicalTables) {
                try {
                    await pool.query(`DELETE FROM ${table} WHERE patient_id = $1`, [id]);
                } catch (err) {
                    // Tables might not exist or other errors, continue best effort
                    console.warn(`⚠️ Error or missing table ${table}, continuing...`);
                }
            }

            // Finally, delete the patient
            const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            console.log('✅ Patient deleted successfully');
            res.status(200).json({ message: 'Patient deleted successfully', id: result.rows[0].id });
        } catch (error) {
            console.error('❌ Error deleting patient:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
