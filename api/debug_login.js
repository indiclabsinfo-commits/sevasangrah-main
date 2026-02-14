
import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcryptjs'; // You might need to install this or mock it if strictly needed, but let's try just DB first

const pool = new Pool({
    connectionString: 'postgresql://postgres:indicwings%4000@db.plkbxjedbjpmbfrekmrr.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function debugLogin() {
    const email = 'admin@hospital.com'; // Testing the hardcoded credential
    console.log(`🔍 Attempting to debug login for: ${email}`);

    try {
        // 1. Simulate the exact query from api/index.js
        console.log('1. Running SELECT * FROM users...');
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log('✅ Query successful!');
        console.log(`   Found ${result.rows.length} users.`);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('   User data:', JSON.stringify(user, null, 2));

            // 2. Check password hash
            if (user.password_hash) {
                console.log('   Password hash exists.');
            } else {
                console.log('   ⚠️ Password hash is MISSING or null.');
            }
        } else {
            console.log('   ⚠️ User not found in public.users table.');
        }

    } catch (err) {
        console.error('❌ CRITICAL ERROR during DB query:');
        console.error(err);
        console.log('\nThis error explains why login fails (500 Internal Server Error).');
    } finally {
        pool.end();
    }
}

debugLogin();
