const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing backend API...\n');

    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'admin@indic.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful! Token received.');

    // Test getting all patients
    console.log('\n2. Fetching all patients...');
    const patientsResponse = await axios.get('http://localhost:3002/api/patients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const patients = patientsResponse.data;
    console.log(`✅ Retrieved ${patients.length} patients`);

    if (patients.length > 0) {
      const sample = patients[0];
      console.log('\n📋 Sample patient:');
      console.log(`   Name: ${sample.first_name} ${sample.last_name}`);
      console.log(`   ID: ${sample.patient_id || 'N/A'}`);
      console.log(`   Transactions: ${sample.transactions ? sample.transactions.length : 0}`);
      console.log(`   Admissions: ${sample.admissions ? sample.admissions.length : 0}`);
    }

    // Test date range query
    console.log('\n3. Testing date range query (2000-01-01 to 2100-12-31)...');
    const dateRangeResponse = await axios.get('http://localhost:3002/api/patients/by-date-range', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: {
        start_date: '2000-01-01',
        end_date: '2100-12-31'
      }
    });

    const dateRangePatients = dateRangeResponse.data;
    console.log(`✅ Retrieved ${dateRangePatients.length} patients for date range`);

    console.log('\n✨ All API tests passed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
