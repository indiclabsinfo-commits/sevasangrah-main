const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
const envPath = path.resolve(__dirname, 'backend/.env');
console.log('📂 Loading env from:', envPath);
dotenv.config({ path: envPath });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function checkAndCreateExpensesTable() {
    console.log('🔌 Connecting to database...');
    try {
        // Check if table exists
        const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'daily_expenses'
      );
    `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Table daily_expenses already exists');

            // Check columns
            const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'daily_expenses'
        ORDER BY ordinal_position;
      `);

            console.log('\n📋 Current columns:');
            columns.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });

            // Check if receipt_number and hospital_id exist
            const hasReceiptNumber = columns.rows.some(col => col.column_name === 'receipt_number');
            const hasHospitalId = columns.rows.some(col => col.column_name === 'hospital_id');

            if (!hasReceiptNumber || !hasHospitalId) {
                console.log('\n⚠️  Missing columns detected. Adding them...');

                if (!hasReceiptNumber) {
                    await pool.query('ALTER TABLE daily_expenses ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100)');
                    console.log('✅ Added receipt_number column');
                }

                if (!hasHospitalId) {
                    await pool.query('ALTER TABLE daily_expenses ADD COLUMN IF NOT EXISTS hospital_id UUID');
                    console.log('✅ Added hospital_id column');
                }
            } else {
                console.log('✅ All required columns exist');
            }

        } else {
            console.log('❌ Table daily_expenses does NOT exist. Creating it...');

            await pool.query(`
        CREATE TABLE daily_expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
          expense_category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_mode VARCHAR(50) DEFAULT 'CASH',
          receipt_number VARCHAR(100),
          hospital_id UUID,
          approved_by VARCHAR(255),
          notes TEXT,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

            console.log('✅ Table created successfully!');

            // Create indexes
            await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(expense_date)');
            await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_expenses_hospital ON daily_expenses(hospital_id)');
            console.log('✅ Indexes created');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('\n🔌 Database connection closed');
    }
}

checkAndCreateExpensesTable();
