
import allowCors from '../_lib/cors.js';
import authenticate from '../_lib/auth.js';

const handler = async (req, res) => {
    if (req.method === 'GET') {
        try {
            // Return hardcoded doctors (matching dataService.ts and backend/server.js)
            const hardcodedDoctors = [
                {
                    id: 'hemant-khajja',
                    name: 'DR. HEMANT KHAJJA',
                    first_name: 'HEMANT',
                    last_name: 'KHAJJA',
                    department: 'ORTHOPAEDIC',
                    specialization: 'Orthopaedic Surgeon',
                    fee: 800,
                    is_active: true
                },
                {
                    id: 'lalita-suwalka',
                    name: 'DR. LALITA SUWALKA',
                    first_name: 'LALITA',
                    last_name: 'SUWALKA',
                    department: 'DIETICIAN',
                    specialization: 'Clinical Dietician',
                    fee: 500,
                    is_active: true
                },
                {
                    id: 'poonam-jain-physiotherapy',
                    name: 'DR. POONAM JAIN',
                    first_name: 'POONAM',
                    last_name: 'JAIN',
                    department: 'PHYSIOTHERAPY',
                    specialization: 'Physiotherapist',
                    fee: 600,
                    is_active: true
                }
            ];
            res.status(200).json(hardcodedDoctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default allowCors(authenticate(handler));
