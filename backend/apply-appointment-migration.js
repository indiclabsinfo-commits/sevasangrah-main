require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
    port: process.env.AZURE_DB_PORT || 5432,
    database: process.env.AZURE_DB_NAME || 'postgres',
    user: process.env.AZURE_DB_USER || 'divyansh04',
    password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
    ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', '003_update_appointments.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying migration...');
        await pool.query(sql);
        console.log('Migration applied successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

applyMigration();
