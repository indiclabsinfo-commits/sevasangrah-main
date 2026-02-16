// Simple test to check and create uhid_config table
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function testAndCreate() {
  console.log('=== UHID Table Test & Create ===');
  
  // First, check if table exists
  console.log('\n1. Checking if uhid_config exists...');
  const checkResponse = await fetch(`${supabaseUrl}/rest/v1/uhid_config?select=count`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  });
  
  if (checkResponse.status === 200) {
    console.log('✅ uhid_config table already exists');
    const data = await fetch(`${supabaseUrl}/rest/v1/uhid_config?select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());
    console.log('Current data:', data);
    return;
  }
  
  console.log('❌ uhid_config table does not exist or not accessible');
  console.log('Status:', checkResponse.status);
  
  // Try to create the table using a simple SQL execution
  console.log('\n2. Attempting to create table via SQL...');
  
  // Simple CREATE TABLE statement
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS uhid_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      prefix VARCHAR(10) NOT NULL DEFAULT 'MH',
      year_format VARCHAR(10) NOT NULL DEFAULT 'YYYY',
      current_sequence INTEGER NOT NULL DEFAULT 0,
      hospital_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    INSERT INTO uhid_config (prefix, year_format, current_sequence, hospital_id)
    SELECT 'MH', 'YYYY', 0, '550e8400-e29b-41d4-a716-446655440000'
    WHERE NOT EXISTS (
      SELECT 1 FROM uhid_config WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000'
    );
  `;
  
  // Try to execute via pg_rest API if available
  console.log('Note: Need to run SQL in Supabase SQL Editor manually');
  console.log('\nSQL to run in Supabase SQL Editor:');
  console.log('--- COPY BELOW ---');
  console.log(createTableSQL);
  console.log('--- END SQL ---');
  
  // Check patients table for uhid column
  console.log('\n3. Checking patients table structure...');
  const patientsResponse = await fetch(`${supabaseUrl}/rest/v1/patients?select=*&limit=1`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (patientsResponse.ok) {
    const [patient] = await patientsResponse.json();
    console.log('Patient columns:', Object.keys(patient));
    
    if ('uhid' in patient) {
      console.log('✅ uhid column exists in patients table');
    } else {
      console.log('❌ uhid column missing in patients table');
      console.log('\nSQL to add uhid column:');
      console.log('ALTER TABLE patients ADD COLUMN IF NOT EXISTS uhid VARCHAR(20) UNIQUE;');
    }
  }
}

testAndCreate();