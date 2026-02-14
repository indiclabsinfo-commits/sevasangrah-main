
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:indicwings%4000@db.plkbxjedbjpmbfrekmrr.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, email, role, is_active FROM users');
        console.log('Users found:', res.rows.length);
        console.log(res.rows);
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        pool.end();
    }
}

checkUsers();
