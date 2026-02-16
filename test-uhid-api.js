// Test UHID API endpoints
const backendUrl = 'http://localhost:3001'; // Default backend port
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function testUHIDAPI() {
  console.log('=== Testing UHID API ===');
  
  // First check if backend is running
  console.log('\n1. Checking backend server...');
  try {
    const backendCheck = await fetch(`${backendUrl}/health`, { timeout: 5000 }).catch(() => null);
    if (backendCheck && backendCheck.ok) {
      console.log('✅ Backend server is running');
      
      // Test UHID config endpoint
      console.log('\n2. Testing /api/uhid/config endpoint...');
      const configResponse = await fetch(`${backendUrl}/api/uhid/config`, {
        headers: {
          'Authorization': `Bearer ${anonKey}`
        }
      }).catch(err => {
        console.log('❌ Config endpoint error:', err.message);
        return null;
      });
      
      if (configResponse && configResponse.ok) {
        const config = await configResponse.json();
        console.log('✅ UHID config endpoint works');
        console.log('Config:', config);
      }
      
      // Test UHID generation endpoint
      console.log('\n3. Testing /api/uhid/generate endpoint...');
      const generateResponse = await fetch(`${backendUrl}/api/uhid/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }).catch(err => {
        console.log('❌ Generate endpoint error:', err.message);
        return null;
      });
      
      if (generateResponse && generateResponse.ok) {
        const result = await generateResponse.json();
        console.log('✅ UHID generate endpoint works');
        console.log('Generated UHID:', result.uhid);
      }
      
    } else {
      console.log('⚠️ Backend server not running or health check failed');
      console.log('Note: Backend might be disabled (VITE_API_URL is empty in .env)');
    }
  } catch (error) {
    console.log('⚠️ Backend check failed:', error.message);
  }
  
  // Test direct Supabase function call (fallback)
  console.log('\n4. Testing direct Supabase function call...');
  const directResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
  });
  
  if (directResponse.ok) {
    const uhid = await directResponse.text();
    console.log('✅ Direct Supabase function works');
    console.log('Generated UHID:', uhid);
  } else {
    console.log('❌ Direct Supabase function failed:', directResponse.status);
  }
  
  // Check frontend service
  console.log('\n5. Checking frontend PatientService...');
  const fs = require('fs');
  const path = require('path');
  
  const patientServicePath = path.join(__dirname, 'src/services/patientService.ts');
  if (fs.existsSync(patientServicePath)) {
    const content = fs.readFileSync(patientServicePath, 'utf8');
    if (content.includes('generateUHID') && content.includes('getNextUHID')) {
      console.log('✅ PatientService has UHID functions');
      
      // Check if it uses azureApiService
      if (content.includes('uhidService')) {
        console.log('✅ Uses uhidService from azureApiService');
        
        // Check azureApiService
        const azureServicePath = path.join(__dirname, 'src/services/azureApiService.ts');
        if (fs.existsSync(azureServicePath)) {
          const azureContent = fs.readFileSync(azureServicePath, 'utf8');
          if (azureContent.includes('uhidService')) {
            console.log('✅ azureApiService has uhidService');
          } else {
            console.log('⚠️ uhidService not found in azureApiService');
          }
        }
      }
    } else {
      console.log('❌ UHID functions not found in PatientService');
    }
  }
  
  console.log('\n=== API Test Complete ===');
  console.log('\nNext: Need to test the actual UI - open patient registration form.');
}

testUHIDAPI();