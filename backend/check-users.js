const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to DB\n');

        // Check all users
        const res = await client.query("SELECT id, email, first_name, last_name, role, is_active FROM users ORDER BY email");

        console.log('=== ALL USERS IN DATABASE ===');
        console.log('Total users:', res.rows.length);
        console.log('');

        res.rows.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.first_name} ${user.last_name}`);
            console.log(`Role: ${user.role}`);
            console.log(`Active: ${user.is_active}`);
            console.log('---');
        });

        await client.end();
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
