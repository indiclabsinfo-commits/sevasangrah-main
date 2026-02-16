// Test UHID configuration table
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function testUHIDTable() {
  console.log('=== Testing UHID Configuration Table ===');
  
  try {
    // Test 1: Check if uhid_config table exists
    console.log('\n1. Checking uhid_config table...');
    const response = await fetch(`${supabaseUrl}/rest/v1/uhid_config?select=*&limit=1`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ uhid_config table EXISTS');
      console.log('Data:', data);
      
      // Check structure
      if (data.length > 0) {
        const row = data[0];
        console.log('\nTable structure check:');
        console.log('- id:', 'id' in row ? '✅' : '❌', row.id);
        console.log('- prefix:', 'prefix' in row ? '✅' : '❌', row.prefix);
        console.log('- year_format:', 'year_format' in row ? '✅' : '❌', row.year_format);
        console.log('- current_sequence:', 'current_sequence' in row ? '✅' : '❌', row.current_sequence);
      }
    } else if (response.status === 404) {
      console.log('❌ uhid_config table DOES NOT EXIST');
      
      // Check if migration file exists
      console.log('\nChecking for migration file...');
      const fs = require('fs');
      const path = require('path');
      
      const migrationFile = path.join(__dirname, 'database_migrations/001_create_uhid_config.sql');
      if (fs.existsSync(migrationFile)) {
        console.log('✅ Migration file exists:', migrationFile);
        const migrationContent = fs.readFileSync(migrationFile, 'utf8');
        console.log('Migration SQL (first 500 chars):');
        console.log(migrationContent.substring(0, 500));
      } else {
        console.log('❌ Migration file not found');
      }
    } else {
      console.log('⚠️  Unexpected response:', response.status, response.statusText);
    }
    
    // Test 2: Check patients table for UHID field
    console.log('\n\n2. Checking patients table for UHID field...');
    const patientsResponse = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id,first_name,last_name&limit=3`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (patientsResponse.ok) {
      const patients = await patientsResponse.json();
      console.log('✅ Patients table accessible');
      console.log('Sample patients:', patients);
      
      // Check patient_id format
      if (patients.length > 0) {
        const patient = patients[0];
        console.log('\nPatient ID format check:');
        console.log('Patient ID:', patient.patient_id);
        console.log('Format:', /^[A-Za-z]+-\d+-\d+$/.test(patient.patient_id) ? '✅ Looks like UHID' : '⚠️ Not UHID format');
      }
    }
    
    // Test 3: Check backend API for UHID endpoint
    console.log('\n\n3. Checking UHID API endpoint...');
    try {
      // Try to find backend server
      const backendCheck = require('fs').existsSync(path.join(__dirname, 'backend/server.js'));
      if (backendCheck) {
        console.log('✅ Backend server.js exists');
        
        // Check if UHID endpoint is defined
        const serverContent = require('fs').readFileSync(path.join(__dirname, 'backend/server.js'), 'utf8');
        if (serverContent.includes('uhid') || serverContent.includes('UHID')) {
          console.log('✅ UHID endpoints found in backend');
        } else {
          console.log('⚠️ UHID endpoints not found in backend');
        }
      } else {
        console.log('❌ Backend server.js not found');
      }
    } catch (err) {
      console.log('⚠️ Could not check backend:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testUHIDTable();