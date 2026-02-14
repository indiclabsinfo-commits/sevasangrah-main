
import pool from '../../_lib/db.js';
import allowCors from '../../_lib/cors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const handler = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { email, password } = req.body;

            // 1. Try to find user in DB
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

            let user = null;

            if (result.rows.length > 0) {
                user = result.rows[0];
            }

            // 2. Fallback / Hardcoded Admin Check (if not in DB or for recovery)
            if (email === 'admin@hospital.com' && password === 'admin123') {
                const token = jwt.sign(
                    {
                        id: '00000000-0000-0000-0000-000000000000',
                        email: 'admin@hospital.com',
                        role: 'ADMIN',
                        first_name: 'Dev',
                        last_name: 'Admin'
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                return res.json({
                    token,
                    user: {
                        id: '00000000-0000-0000-0000-000000000000',
                        email: 'admin@hospital.com',
                        role: 'ADMIN',
                        first_name: 'Dev',
                        last_name: 'Admin'
                    }
                });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is deactivated' });
            }

            // 4. Generate Token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    department: user.department
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

// No authenticate middleware for login
export default allowCors(handler);
