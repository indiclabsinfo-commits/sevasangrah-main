
import pool from './_lib/db.js';

async function testConnection() {
    try {
        console.log('🔌 Testing DB connection from _lib/db.js...');
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful:', res.rows[0]);
    } catch (err) {
        console.error('❌ DB Connection Failed:', err);
    } finally {
        pool.end();
    }
}

testConnection();
