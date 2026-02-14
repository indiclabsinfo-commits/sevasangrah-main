
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        try {
            // Get total patients
            const patientsResult = await pool.query(
                'SELECT COUNT(*) as count FROM patients WHERE is_active = true'
            );

            // Get active admissions
            const admissionsResult = await pool.query(
                'SELECT COUNT(*) as count FROM patient_admissions WHERE status = $1',
                ['active']
            );

            // Get today's revenue
            const revenueResult = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) as total 
         FROM patient_transactions 
         WHERE transaction_date = CURRENT_DATE`
            );

            // Get available beds
            const bedsResult = await pool.query(
                'SELECT COUNT(*) as count FROM beds WHERE status = $1',
                ['available']
            );

            res.status(200).json({
                totalPatients: parseInt(patientsResult.rows[0].count),
                activeAdmissions: parseInt(admissionsResult.rows[0].count),
                todayRevenue: parseFloat(revenueResult.rows[0].total),
                availableBeds: parseInt(bedsResult.rows[0].count)
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
