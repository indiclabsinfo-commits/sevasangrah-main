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

async function setupAdminUser() {
    try {
        console.log('🔌 Connecting to Azure PostgreSQL...');

        // Test connection
        const testResult = await pool.query('SELECT NOW()');
        console.log('✅ Connected to database at:', testResult.rows[0].now);

        // Check if users table exists
        const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

        if (!tableCheck.rows[0].exists) {
            console.log('⚠️  Users table does not exist. Creating...');

            // Create users table
            await pool.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'FRONTDESK')),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
            console.log('✅ Users table created');
        } else {
            console.log('✅ Users table exists');
        }

        // Check if admin user exists
        const adminCheck = await pool.query(`
      SELECT * FROM users WHERE email = 'admin@hospital.com'
    `);

        if (adminCheck.rows.length === 0) {
            console.log('⚠️  Admin user does not exist. Creating...');

            // Create admin user
            const result = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES ('admin@hospital.com', crypt('admin123', gen_salt('bf')), 'Admin', 'User', 'ADMIN', true)
        RETURNING id, email, first_name, last_name, role, is_active
      `);

            console.log('✅ Admin user created:');
            console.log(result.rows[0]);
        } else {
            console.log('✅ Admin user already exists:');
            console.log(adminCheck.rows[0]);

            // Update password just in case
            await pool.query(`
        UPDATE users 
        SET password_hash = crypt('admin123', gen_salt('bf')),
            is_active = true
        WHERE email = 'admin@hospital.com'
      `);
            console.log('✅ Password reset to: admin123');
        }

        console.log('\n🎉 Setup complete!');
        console.log('👉 Login credentials:');
        console.log('   Email: admin@hospital.com');
        console.log('   Password: admin123');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
}

setupAdminUser();
