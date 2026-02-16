// Run UHID migration using service role key
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function runMigration() {
  console.log('=== Running UHID Migration ===');
  
  try {
    // Read migration SQL
    const fs = require('fs');
    const path = require('path');
    const migrationFile = path.join(__dirname, 'database_migrations/001_create_uhid_config.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Migration SQL loaded:', sql.length, 'characters');
    
    // Split into individual statements (simple approach)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Add back semicolon
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (response.ok) {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } else {
          const errorText = await response.text();
          console.log(`⚠️ Statement ${i + 1} returned ${response.status}:`, errorText.substring(0, 200));
        }
      } catch (error) {
        console.log(`❌ Failed to execute statement ${i + 1}:`, error.message);
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test if migration worked
    console.log('\n\n=== Verifying Migration ===');
    
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/uhid_config?select=*&limit=1`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (testResponse.status === 200) {
      const data = await testResponse.json();
      console.log('✅ Migration SUCCESSFUL! uhid_config table created.');
      console.log('Data:', data);
      
      // Test the generate_uhid function
      console.log('\nTesting generate_uhid function...');
      const functionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
      });
      
      if (functionResponse.ok) {
        const uhid = await functionResponse.text();
        console.log('✅ UHID generated:', uhid);
      } else {
        console.log('⚠️ Could not generate UHID:', functionResponse.status);
      }
      
    } else {
      console.log('❌ Migration FAILED. Table still not accessible.');
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
  }
  
  console.log('\n=== Migration Complete ===');
}

runMigration();