
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticate = (fn) => async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const bypassUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@hospital.com',
        role: 'ADMIN',
        first_name: 'Dev',
        last_name: 'Admin',
        is_active: true
    };

    // Case 1: No Token -> Force Bypass (Dev/Fallback)
    if (!token) {
        console.log('🔓 [Serverless] No token provided - performing Admin bypass');
        req.user = bypassUser;
        return await fn(req, res);
    }

    try {
        // Case 2: Verify Token
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        return await fn(req, res);
    } catch (err) {
        console.warn('⚠️ [Serverless Auth] Token verification failed:', err.message);
        // Fallback to bypass user on invalid token to maintain current behavior
        console.log('🔓 [Serverless] Invalid token - performing Admin bypass');
        req.user = bypassUser;
        return await fn(req, res);
    }
};

export default authenticate;
