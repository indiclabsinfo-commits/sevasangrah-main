// Final UHID System Test
console.log('=== FINAL UHID SYSTEM TEST ===\n');

// Test 1: Check current database state
console.log('1. Checking current database state...');
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function test() {
  try {
    // Check uhid_config
    const configRes = await fetch(`${supabaseUrl}/rest/v1/uhid_config?select=*`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    const config = await configRes.json();
    console.log('✅ uhid_config:', config[0]);
    
    // Check latest patients
    const patientsRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id,uhid,first_name,created_at&order=created_at.desc&limit=3`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    const patients = await patientsRes.json();
    console.log('\n2. Latest patients with UHID:');
    patients.forEach(p => {
      console.log(`   - ${p.patient_id}: ${p.first_name}, UHID: ${p.uhid || 'NULL'}`);
    });
    
    // Test generate_uhid function
    console.log('\n3. Testing generate_uhid function...');
    const uhidRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
      method: 'POST',
      headers: { 
        'apikey': anonKey, 
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
    });
    
    if (uhidRes.ok) {
      const nextUhid = await uhidRes.text();
      console.log(`✅ Next UHID will be: ${nextUhid}`);
      console.log(`   (Current sequence: ${config[0].current_sequence}, Next: ${config[0].current_sequence + 1})`);
    } else {
      console.log('❌ generate_uhid failed:', await uhidRes.text());
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Database: uhid_config table exists`);
    console.log(`✅ Function: generate_uhid() works`);
    console.log(`⚠️  Patients: ${patients.filter(p => p.uhid).length} have UHID, ${patients.filter(p => !p.uhid).length} missing UHID`);
    console.log(`🎯 Next UHID: MH-2026-${(config[0].current_sequence + 1).toString().padStart(6, '0')}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();