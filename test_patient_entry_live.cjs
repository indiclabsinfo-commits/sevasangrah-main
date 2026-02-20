// Test patient entry on live Vercel deployment
// Simulates what the app does when creating a patient

const https = require('https');

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'plkbxjedbjpmbfrekmrr.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testPatientEntry() {
  console.log('🧪 TESTING PATIENT ENTRY ON LIVE DEPLOYMENT\n');
  
  const timestamp = Date.now();
  const testPatientId = `TEST-${timestamp}`;
  
  // Test patient data (mimics what the app sends)
  const patientData = {
    patient_id: testPatientId,
    prefix: 'Mr',
    first_name: 'Live',
    last_name: 'Test',
    age: 25,
    gender: 'MALE',
    phone: `98765${timestamp.toString().slice(-5)}`,
    email: `test${timestamp}@example.com`,
    address: 'Test Address',
    blood_group: 'O+',
    date_of_birth: '2000-01-01',
    patient_tag: 'Regular',
    medical_history: 'None',
    allergies: 'None',
    current_medications: 'None',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '9999999999',
    has_reference: false,
    reference_details: '',
    photo_url: null,
    notes: 'Test patient from automated test',
    date_of_entry: '2026-02-20',
    assigned_doctor: null,
    assigned_department: null,
    has_pending_appointment: false,
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    is_active: true
  };

  console.log('📋 Test Patient Data:');
  console.log(`  ID: ${patientData.patient_id}`);
  console.log(`  Name: ${patientData.first_name} ${patientData.last_name}`);
  console.log(`  Phone: ${patientData.phone}`);
  console.log(`  Age: ${patientData.age}, Gender: ${patientData.gender}`);
  
  console.log('\n🚀 Attempting to insert patient via Supabase REST API...');
  
  try {
    // Test 1: Direct insert (what the app does now)
    const response = await makeRequest('POST', '/rest/v1/patients', patientData);
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 201) {
      console.log('✅ SUCCESS: Patient inserted successfully!');
      
      try {
        const result = JSON.parse(response.body);
        if (Array.isArray(result) && result.length > 0) {
          const patient = result[0];
          console.log(`   Created patient with UUID: ${patient.id}`);
          console.log(`   UHID: ${patient.uhid || 'Not assigned'}`);
          console.log(`   Created at: ${patient.created_at}`);
          
          // Test 2: Verify we can retrieve the patient
          console.log('\n🔍 Verifying patient retrieval...');
          const getResponse = await makeRequest('GET', `/rest/v1/patients?patient_id=eq.${testPatientId}`);
          
          if (getResponse.status === 200) {
            const patients = JSON.parse(getResponse.body);
            if (patients.length > 0) {
              console.log('✅ Patient retrieval successful');
              console.log(`   Found ${patients.length} matching patient(s)`);
            } else {
              console.log('⚠️ Patient inserted but not found on retrieval');
            }
          }
        }
      } catch (parseError) {
        console.log('⚠️ Response parse error:', parseError.message);
        console.log('Raw response:', response.body.substring(0, 500));
      }
      
    } else if (response.status === 409) {
      console.log('❌ Conflict: Patient ID already exists');
      console.log('Response:', response.body.substring(0, 500));
      
    } else if (response.status === 401 || response.status === 403) {
      console.log('❌ Authentication/Authorization error (RLS might be blocking)');
      console.log('Response:', response.body.substring(0, 500));
      
    } else {
      console.log('❌ Unexpected error');
      console.log('Response:', response.body.substring(0, 500));
    }
    
  } catch (error) {
    console.log('❌ Network/Request error:', error.message);
  }
  
  // Test 3: Clean up - delete test patient
  console.log('\n🧹 Cleaning up test patient...');
  try {
    const deleteResponse = await makeRequest('DELETE', `/rest/v1/patients?patient_id=eq.${testPatientId}`);
    if (deleteResponse.status === 204) {
      console.log('✅ Test patient cleaned up');
    } else {
      console.log(`⚠️ Cleanup status: ${deleteResponse.status}`);
    }
  } catch (cleanupError) {
    console.log('⚠️ Cleanup failed:', cleanupError.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 TEST COMPLETE');
  console.log('='.repeat(50));
  console.log('\n📊 What this test proves:');
  console.log('1. Supabase connection works');
  console.log('2. RLS is NOT blocking inserts (if test succeeded)');
  console.log('3. Direct REST API works');
  console.log('\n🔧 If test succeeded but app still fails:');
  console.log('- App might have validation errors');
  console.log('- App might be missing required fields');
  console.log('- Check browser console for JavaScript errors');
}

testPatientEntry().catch(console.error);