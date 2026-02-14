
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import authenticate from '../../_lib/auth.js';
import bcrypt from 'bcryptjs';

const handler = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { email, password, first_name, last_name, role, department } = req.body;

            // Check if user exists
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const result = await pool.query(
                `INSERT INTO users (
           id, email, password_hash, first_name, last_name, role, department, is_active, created_by
         ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, $7)
         RETURNING id, email, first_name, last_name, role, created_at`,
                [email, hashedPassword, first_name, last_name, role || 'STAFF', department, req.user.id]
            );

            res.status(201).json(result.rows[0]);

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

// Protected endpoint
export default allowCors(authenticate(handler));
