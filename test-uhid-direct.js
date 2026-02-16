// Direct test of UHID service
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function testUHIDDirect() {
  console.log('=== Direct UHID Service Test ===');
  
  // Test 1: Check uhid_config table
  console.log('\n1. Checking uhid_config table...');
  const configResponse = await fetch(`${supabaseUrl}/rest/v1/uhid_config?select=*`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (configResponse.ok) {
    const config = await configResponse.json();
    console.log('✅ uhid_config:', config);
  } else {
    console.log('❌ uhid_config error:', configResponse.status);
  }
  
  // Test 2: Direct generate_uhid function call
  console.log('\n2. Testing generate_uhid function directly...');
  const functionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
  });
  
  if (functionResponse.ok) {
    const uhid = await functionResponse.text();
    console.log('✅ Direct generate_uhid works! UHID:', uhid);
  } else {
    const errorText = await functionResponse.text();
    console.log('❌ Direct generate_uhid failed:', functionResponse.status, errorText);
  }
  
  // Test 3: Check latest patient UHID
  console.log('\n3. Checking latest patient UHID...');
  const patientResponse = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id,uhid,first_name&order=created_at.desc&limit=3`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (patientResponse.ok) {
    const patients = await patientResponse.json();
    console.log('Latest patients with UHID:');
    patients.forEach(p => {
      console.log(`  - ${p.patient_id}: ${p.first_name}, UHID: ${p.uhid || 'NULL'}`);
    });
  }
}

testUHIDDirect();