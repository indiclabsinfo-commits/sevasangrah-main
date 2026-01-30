// Quick Database Connection Test for Vercel
// Add this to your server.js to test the connection

// Add this endpoint after your existing routes
app.get('/api/debug/connection', async (req, res) => {
    try {
        // Test basic connection
        const result = await pool.query('SELECT NOW(), current_database(), current_user');

        // Test users table
        const usersCheck = await pool.query(`
      SELECT COUNT(*) as user_count 
      FROM users 
      WHERE email = 'admin@hospital.com'
    `);

        res.json({
            success: true,
            connection: {
                timestamp: result.rows[0].now,
                database: result.rows[0].current_database,
                user: result.rows[0].current_user
            },
            usersTable: {
                adminExists: usersCheck.rows[0].user_count > 0,
                adminCount: parseInt(usersCheck.rows[0].user_count)
            },
            environment: {
                host: process.env.AZURE_DB_HOST,
                database: process.env.AZURE_DB_NAME,
                port: process.env.AZURE_DB_PORT,
                user: process.env.AZURE_DB_USER,
                // Don't expose password!
                passwordSet: !!process.env.AZURE_DB_PASSWORD
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            environment: {
                host: process.env.AZURE_DB_HOST,
                database: process.env.AZURE_DB_NAME,
                port: process.env.AZURE_DB_PORT,
                user: process.env.AZURE_DB_USER,
                passwordSet: !!process.env.AZURE_DB_PASSWORD
            }
        });
    }
});

// Also add a health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
