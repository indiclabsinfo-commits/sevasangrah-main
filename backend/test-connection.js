const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log('🔌 Testing Supabase connection...');
        console.log('📍 Host:', process.env.AZURE_DB_HOST);
        console.log('🔑 User:', process.env.AZURE_DB_USER);

        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        const result = await client.query('SELECT NOW()');
        console.log('⏰ Server time:', result.rows[0].now);

        client.release();
        await pool.end();

        console.log('✅ Connection test passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testConnection();
