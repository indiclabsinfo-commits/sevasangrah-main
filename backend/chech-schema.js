require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
    port: process.env.AZURE_DB_PORT || 5432,
    database: process.env.AZURE_DB_NAME || 'postgres',
    user: process.env.AZURE_DB_USER || 'divyansh04',
    password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'patients'
    `);
        console.log('Patients Schema:', res.rows);

        const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'doctors'
    `);
        console.log('Doctors Schema:', res2.rows);

    } catch (error) {
        console.error('Schema check failed:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();
