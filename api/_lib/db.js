
import pg from 'pg';

const { Pool } = pg;

// Use a cached pool to reuse connections in serverless environment
let pool;

if (!pool) {
    pool = new Pool({
        connectionString: 'postgresql://postgres:indicwings%4000@db.plkbxjedbjpmbfrekmrr.supabase.co:5432/postgres',
        ssl: {
            rejectUnauthorized: false
        },
        max: 1, // Limit max connections per lambda to avoid exhausting pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
}

export default pool;
