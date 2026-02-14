
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:indicwings%4000@db.plkbxjedbjpmbfrekmrr.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function debugOPD() {
    try {
        const queryDate = new Date().toISOString().split('T')[0];
        console.log('📅 Debugging OPD Queue for date:', queryDate);

        // Simulate the query construction from handleGetOPDQueues
        let q = `SELECT * FROM patients WHERE queue_date = $1`;
        let vals = [queryDate];
        let idx = 2;

        // Simulating parameters that might be sent
        // const status = 'waiting'; 
        // if (status) { q += ` AND queue_status = $${idx++}`; vals.push(status); }

        q += ' ORDER BY queue_no ASC';

        console.log('📝 Executing Query:', q);
        console.log('Values:', vals);

        const result = await pool.query(q, vals);
        console.log(`✅ Success! Found ${result.rows.length} records.`);
        if (result.rows.length > 0) {
            console.log('Sample record:', JSON.stringify(result.rows[0], null, 2));
        }
    } catch (e) {
        console.error('❌ CRITICAL ERROR in OPD Query:');
        console.error(e);
    } finally {
        pool.end();
    }
}

debugOPD();
