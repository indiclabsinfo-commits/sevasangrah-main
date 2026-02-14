
import pool from '../../../_lib/db.js';
import allowCors from '../../../_lib/cors.js';
import authenticate from '../../../_lib/auth.js';

const handler = async (req, res) => {
    const { id } = req.query; // dynamic route param

    if (req.method === 'PUT') {
        try {
            const { keep_patient } = req.body; // If true, keep patient but mark as rejected

            if (keep_patient) {
                // Just set is_active to false to hide patient
                const result = await pool.query(
                    `UPDATE patients
           SET has_pending_appointment = false,
               is_active = false
           WHERE id = $1
           RETURNING *`,
                    [id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Patient not found' });
                }
                res.status(200).json(result.rows[0]);
            } else {
                // Delete patient (and cascade)
                // Similar to delete patient logic, but minimal for now or reuse delete logic
                // The server.js implementation line 852 creates a cascade delete similar to DELETE /api/patients/:id
                // For simplicity, let's just delete the patient record if no other data exists, or do a full delete

                // Full delete logic duplicated from DELETE /api/patients/[id] to ensure consistency

                // Delete related records
                await pool.query('DELETE FROM patient_transactions WHERE patient_id = $1', [id]);
                await pool.query('DELETE FROM patient_admissions WHERE patient_id = $1', [id]);
                await pool.query('DELETE FROM patient_refunds WHERE patient_id = $1', [id]);

                const clinicalTables = [
                    'patient_high_risk', 'patient_chief_complaints', 'patient_examination',
                    'patient_investigation', 'patient_diagnosis', 'patient_enhanced_prescription',
                    'patient_record_summary'
                ];

                for (const table of clinicalTables) {
                    try { await pool.query(`DELETE FROM ${table} WHERE patient_id = $1`, [id]); } catch (e) { }
                }

                const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Patient not found' });
                }

                res.status(200).json({ message: 'Patient deleted successfully', id: result.rows[0].id });
            }

        } catch (error) {
            console.error('Error rejecting appointment:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
