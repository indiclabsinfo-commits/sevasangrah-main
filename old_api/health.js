
import pool from './_lib/db.js';
import allowCors from './_lib/cors.js';

const handler = async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();

        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: result.rows[0].now,
            environment: 'vercel-serverless'
        });
    } catch (error) {
        console.error('Health Check Error:', error);
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
};

export default allowCors(handler);
