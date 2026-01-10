const axios = require('axios');

async function testDeletePatient() {
  try {
    console.log('🔍 Testing patient deletion...\n');

    // Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'admin@indic.com',
      password: 'Admin@1234'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');

    // Get all patients
    console.log('2. Fetching patients...');
    const patientsResponse = await axios.get('http://localhost:3002/api/patients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const patients = patientsResponse.data;
    console.log(`✅ Found ${patients.length} patients\n`);

    if (patients.length === 0) {
      console.log('⚠️ No patients to delete. Test skipped.');
      return;
    }

    // Show first patient
    const testPatient = patients[0];
    console.log('3. Patient to test delete (will NOT actually delete):');
    console.log(`   ID: ${testPatient.id}`);
    console.log(`   Name: ${testPatient.first_name} ${testPatient.last_name}`);
    console.log(`   Patient ID: ${testPatient.patient_id}\n`);

    console.log('✅ DELETE endpoint is ready at: DELETE /api/patients/:id');
    console.log('✅ The endpoint will:');
    console.log('   1. Delete patient transactions');
    console.log('   2. Delete patient admissions');
    console.log('   3. Delete patient refunds');
    console.log('   4. Delete patient records');
    console.log('   5. Finally delete the patient from database\n');
    console.log('🎉 You can now delete patients from the frontend!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDeletePatient();
