const { Pool } = require('pg');
const path = require('path');
// Load .env from backend directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Environment loaded.');
console.log('DB Host:', process.env.AZURE_DB_HOST);
console.log('DB User:', process.env.AZURE_DB_USER);
console.log('DB Port:', process.env.AZURE_DB_PORT);

const pool = new Pool({
    host: process.env.AZURE_DB_HOST,
    port: parseInt(process.env.AZURE_DB_PORT || '5432'),
    database: process.env.AZURE_DB_NAME || 'postgres',
    user: process.env.AZURE_DB_USER,
    password: process.env.AZURE_DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000 // 10s timeout
});

const migrationSql = `
-- Add RGHS support to patient_transactions table

-- 1. Add rghs_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patient_transactions' 
        AND column_name = 'rghs_number'
    ) THEN
        ALTER TABLE patient_transactions ADD COLUMN rghs_number TEXT;
        RAISE NOTICE 'Added rghs_number column';
    ELSE
        RAISE NOTICE 'rghs_number column already exists';
    END IF;
END $$;

-- 2. Update payment_mode check constraint to include 'RGHS'
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all constraints on payment_mode to be safe and recreate one
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'patient_transactions' AND column_name = 'payment_mode'
    ) LOOP
        EXECUTE 'ALTER TABLE patient_transactions DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped constraint %', r.constraint_name;
    END LOOP;
END $$;

-- 3. Add the new constraint with RGHS included
ALTER TABLE patient_transactions 
ADD CONSTRAINT patient_transactions_payment_mode_check 
CHECK (payment_mode IN ('cash', 'online', 'card', 'upi', 'insurance', 'adjustment', 'rghs', 'cheque', 'bank_transfer', 'CREDIT', 'DEBIT', 'neft', 'rtgs'));
`;

async function runMigration() {
    let client;
    try {
        console.log('Connecting to database...');
        client = await pool.connect();
        console.log('Connected. Running migration...');

        await client.query(migrationSql);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

runMigration();
