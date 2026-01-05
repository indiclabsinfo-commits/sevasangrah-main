/**
 * Database Migration Runner
 * Run this script to execute all database migrations
 * Usage: node run-migrations.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
  port: process.env.AZURE_DB_PORT || 5432,
  database: process.env.AZURE_DB_NAME || 'postgres',
  user: process.env.AZURE_DB_USER || 'divyansh04',
  password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
  ssl: { rejectUnauthorized: false }
};

async function runMigrations() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connected to Azure PostgreSQL database');

    // Migration files in order
    const migrations = [
      '../docs/database/migration_scripts/001_add_uhid_system.sql',
      '../docs/database/migration_scripts/002_module_access_control.sql'
    ];

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, migrationFile);
      const migrationName = path.basename(migrationFile);

      console.log(`\n📦 Running migration: ${migrationName}`);

      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found: ${migrationPath}`);
        continue;
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ ${migrationName} completed successfully`);
      } catch (error) {
        console.error(`❌ Error running ${migrationName}:`, error.message);

        // Check if error is because objects already exist
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${migrationName} - Some objects already exist, continuing...`);
        } else {
          throw error;
        }
      }
    }

    // Verify migrations
    console.log('\n🔍 Verifying migrations...\n');

    // Check UHID tables
    const uhidCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'uhid_config'
      ) as uhid_exists
    `);
    console.log(`UHID System: ${uhidCheck.rows[0].uhid_exists ? '✅ Installed' : '❌ Not found'}`);

    // Check module tables
    const moduleCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'modules'
      ) as modules_exists
    `);
    console.log(`Module Access Control: ${moduleCheck.rows[0].modules_exists ? '✅ Installed' : '❌ Not found'}`);

    // Check if patients table has uhid column
    const uhidColumnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'uhid'
      ) as uhid_column_exists
    `);
    console.log(`Patients UHID Column: ${uhidColumnCheck.rows[0].uhid_column_exists ? '✅ Added' : '❌ Not found'}`);

    // Count modules
    if (moduleCheck.rows[0].modules_exists) {
      const moduleCount = await client.query('SELECT COUNT(*) as count FROM modules');
      console.log(`Modules Created: ${moduleCount.rows[0].count} modules`);
    }

    // Test UHID generation
    if (uhidCheck.rows[0].uhid_exists) {
      const testUhid = await client.query('SELECT generate_uhid() as test_uhid');
      console.log(`Test UHID Generation: ${testUhid.rows[0].test_uhid} ✅`);
    }

    console.log('\n✅ All migrations completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
console.log('🚀 Starting database migrations...\n');
runMigrations();
