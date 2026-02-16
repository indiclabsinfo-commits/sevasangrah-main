// Simple test endpoint
export default function handler(req, res) {
    res.status(200).json({
        status: 'API is working',
        timestamp: new Date().toISOString(),
        project: 'sevasangrah-main',
        version: '2.0',
        endpoint: '/api/test.js'
    });
}