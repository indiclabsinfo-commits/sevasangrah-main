const { Pool } = require('pg');
require('dotenv').config();

// Azure PostgreSQL connection
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

async function testPatients() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Count all patients
    const countResult = await pool.query('SELECT COUNT(*) as total FROM patients');
    console.log(`📊 Total patients in database: ${countResult.rows[0].total}`);

    // Test 2: Get first 5 patients
    const patientsResult = await pool.query(`
      SELECT id, patient_id, first_name, last_name, date_of_entry, created_at, is_active
      FROM patients
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`\n👥 First 5 patients:`);
    patientsResult.rows.forEach((p, i) => {
      console.log(`${i + 1}. ${p.first_name} ${p.last_name} (ID: ${p.patient_id}) - ${p.date_of_entry || p.created_at}`);
    });

    // Test 3: Count transactions
    const transResult = await pool.query('SELECT COUNT(*) as total FROM patient_transactions');
    console.log(`\n💰 Total transactions: ${transResult.rows[0].total}`);

    // Test 4: Test the query with joins
    const joinResult = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pt.id,
              'transaction_type', pt.transaction_type,
              'amount', pt.amount
            )
          ) FILTER (WHERE pt.id IS NOT NULL),
          '[]'::json
        ) as transactions
      FROM patients p
      LEFT JOIN patient_transactions pt ON p.id = pt.patient_id
      WHERE (p.is_active = true OR p.is_active IS NULL)
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 3
    `);

    console.log(`\n🔗 Patients with transactions (sample):`);
    joinResult.rows.forEach((p, i) => {
      console.log(`${i + 1}. ${p.first_name} ${p.last_name} - ${JSON.parse(p.transactions).length} transactions`);
    });

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testPatients();
