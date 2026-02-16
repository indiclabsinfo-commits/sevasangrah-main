
import pg from 'pg';

const { Pool } = pg;

// Use a cached pool to reuse connections in serverless environment
let pool;

if (!pool) {
    // Use environment variable or fallback to Supabase connection
    const connectionString = process.env.DATABASE_URL || 
        'postgresql://postgres:indicwings%4000@db.plkbxjedbjpmbfrekmrr.supabase.co:5432/postgres';
    
    console.log('🔌 Database connection string:', connectionString ? 'Set' : 'Missing');
    
    pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        max: 1, // Limit max connections per lambda to avoid exhausting pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
    
    // Test connection
    pool.query('SELECT NOW()')
        .then(() => console.log('✅ Database connection successful'))
        .catch(err => console.error('❌ Database connection failed:', err.message));
}

export default pool;
