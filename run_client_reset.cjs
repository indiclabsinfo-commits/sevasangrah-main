const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Try loading .env from backend folder first, then root
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
if (!process.env.DATABASE_URL) {
    dotenv.config();
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const run = async () => {
    try {
        const sqlPath = path.join(__dirname, 'reset_database_for_client.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running reset database script...');
        await pool.query(sql);
        console.log('✅ Database reset successfully!');
    } catch (e) {
        console.error('❌ Error resetting database:', e);
    } finally {
        await pool.end();
    }
};
run();
