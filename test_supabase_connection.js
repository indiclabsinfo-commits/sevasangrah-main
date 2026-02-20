// Test Supabase connection and check RLS
import fetch from 'node-fetch';

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    // Test 1: Can we reach Supabase?
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log(`✅ Supabase reachable: ${healthResponse.status} ${healthResponse.statusText}`);
    
    // Test 2: Check if patients table exists and RLS status
    console.log('\n🔍 Checking patients table RLS...');
    const patientsResponse = await fetch(`${supabaseUrl}/rest/v1/patients?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      }
    });
    
    console.log(`Patients table status: ${patientsResponse.status} ${patientsResponse.statusText}`);
    
    if (patientsResponse.status === 200) {
      const count = patientsResponse.headers.get('content-range');
      console.log(`✅ Patients table accessible. Count: ${count}`);
    } else if (patientsResponse.status === 401 || patientsResponse.status === 403) {
      console.log('❌ RLS is blocking access to patients table');
    }
    
    // Test 3: Try to insert a test patient (should fail with RLS)
    console.log('\n🧪 Testing patient insert (should fail with RLS)...');
    const testPatient = {
      patient_id: 'TEST-' + Date.now(),
      first_name: 'Test',
      last_name: 'Patient',
      phone: '9999999999',
      gender: 'MALE',
      age: 30
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testPatient)
    });
    
    const responseText = await insertResponse.text();
    console.log(`Insert response: ${insertResponse.status} ${insertResponse.statusText}`);
    
    if (insertResponse.status === 201) {
      console.log('✅ Insert succeeded (RLS might be disabled)');
      console.log('Response:', responseText.substring(0, 200));
    } else {
      console.log('❌ Insert failed (likely RLS blocking)');
      console.log('Error:', responseText.substring(0, 500));
    }
    
    // Test 4: Check if RPC functions exist
    console.log('\n🔧 Checking RPC functions...');
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/insert_patient_record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ patient_data: testPatient })
    });
    
    console.log(`RPC function status: ${rpcResponse.status} ${rpcResponse.statusText}`);
    
    if (rpcResponse.status === 404) {
      console.log('❌ RPC function does not exist');
    } else if (rpcResponse.status === 200 || rpcResponse.status === 201) {
      console.log('✅ RPC function exists and works');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();