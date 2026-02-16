// Check if aadhaar columns exist in database
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function checkAadhaar() {
  console.log('=== Checking Aadhaar Database Setup ===\n');
  
  try {
    // Check patients table schema
    console.log('1. Checking patients table columns...');
    const res = await fetch(`${supabaseUrl}/rest/v1/patients?select=*&limit=1`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    
    if (res.ok) {
      const [patient] = await res.json();
      const columns = Object.keys(patient);
      const aadhaarColumns = columns.filter(col => col.toLowerCase().includes('aadhaar') || col.toLowerCase().includes('aadhar'));
      
      console.log('✅ Patients table columns found:', columns.length);
      console.log('🔍 Aadhaar-related columns:', aadhaarColumns);
      
      if (aadhaarColumns.length > 0) {
        console.log('   Sample value:', patient[aadhaarColumns[0]]);
      } else {
        console.log('❌ No aadhaar columns found in patients table');
      }
    }
    
    // Check if any patients have aadhaar data
    console.log('\n2. Checking patients with Aadhaar data...');
    const patientsRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=first_name,aadhaar_number&order=created_at.desc&limit=5`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    
    if (patientsRes.ok) {
      const patients = await patientsRes.json();
      console.log('Latest patients with Aadhaar:');
      patients.forEach(p => {
        console.log(`   - ${p.first_name}: Aadhaar = ${p.aadhaar_number || 'NULL'}`);
      });
      
      const withAadhaar = patients.filter(p => p.aadhaar_number).length;
      console.log(`\n📊 ${withAadhaar} out of ${patients.length} patients have Aadhaar`);
    }
    
    // Test Aadhaar validation
    console.log('\n3. Testing Aadhaar validation logic...');
    const testAadhaars = [
      '123456789012', // Invalid (starts with 1)
      '234567890123', // Valid format (but might fail Verhoeff)
      '999999999999', // Invalid (all same digits)
      '' // Empty
    ];
    
    console.log('   Note: Frontend has Verhoeff validation algorithm');
    console.log('   Need to test UI validation in browser');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAadhaar();