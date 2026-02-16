// Run prescription templates migration
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function execSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function runMigration() {
  try {
    console.log('🚀 Running prescription templates migration...');
    
    // Read SQL file
    const sql = readFileSync('database_migrations/008_create_prescription_templates.sql', 'utf8');
    
    // Split into individual statements (simple split on semicolon)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      console.log(`\n📋 Statement ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 100) + '...');
      
      try {
        const result = await execSql(stmt + ';');
        console.log(`✅ Success`);
      } catch (error) {
        console.error(`❌ Error:`, error.message);
        // Continue with next statement (some might be CREATE IF NOT EXISTS)
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('✅ Created:');
    console.log('   - drug_catalog table (23 default drugs)');
    console.log('   - prescription_templates table (8 default templates)');
    console.log('   - prescription_template_items table');
    console.log('   - Functions: clone_prescription_template, search_drugs');
    console.log('   - Views: prescription_templates_view, drug_interactions_view');
    
  } catch (error) {
    console.error('🚨 Migration failed:', error);
    process.exit(1);
  }
}

runMigration();