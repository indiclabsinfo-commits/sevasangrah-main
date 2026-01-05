const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to DB\n');

        // Check patients table schema
        const res = await client.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'patients'
            ORDER BY ordinal_position;
        `);

        console.log('=== PATIENTS TABLE SCHEMA ===');
        res.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} | Default: ${col.column_default} | Nullable: ${col.is_nullable}`);
        });

        await client.end();
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
