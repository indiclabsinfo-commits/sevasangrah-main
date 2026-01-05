const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
    port: process.env.AZURE_DB_PORT || 5432,
    database: process.env.AZURE_DB_NAME || 'postgres',
    user: process.env.AZURE_DB_USER || 'divyansh04',
    password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkQuery() {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    try {
        const sql = `
      SELECT
        p.*,
        COALESCE(SUM(CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN t.amount
          ELSE 0
        END), 0) as total_spent,
        COALESCE(COUNT(DISTINCT CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN DATE(t.transaction_date)
          ELSE NULL
        END), 0) as visit_count
      FROM patients p
      LEFT JOIN patient_transactions t ON p.patient_id = t.patient_id
      WHERE (p.is_active = true OR p.is_active IS NULL)
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

        console.log('🔄 Running server query...');
        const res = await client.query(sql);
        console.log(`✅ Query successful! Returned ${res.rowCount} rows.`);
        console.table(res.rows.slice(0, 3));

    } catch (err) {
        console.error('❌ Query failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkQuery();
