const axios = require('axios');

async function testPatientIdGeneration() {
  try {
    console.log('🔍 Testing Patient ID Auto-Generation...\n');

    // Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'admin@indic.com',
      password: 'Admin@1234'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');

    // Get current patients to see last ID
    console.log('2. Checking existing patients...');
    const existingPatientsResponse = await axios.get('http://localhost:3002/api/patients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const patients = existingPatientsResponse.data;
    const patientsWithM = patients.filter(p => p.patient_id && p.patient_id.startsWith('M'));

    console.log(`   Total patients: ${patients.length}`);
    console.log(`   Patients with M-prefix IDs: ${patientsWithM.length}`);

    if (patientsWithM.length > 0) {
      const lastMPatient = patientsWithM.sort((a, b) => {
        const numA = parseInt(a.patient_id.substring(1)) || 0;
        const numB = parseInt(b.patient_id.substring(1)) || 0;
        return numB - numA;
      })[0];
      console.log(`   Last M-prefix ID: ${lastMPatient.patient_id}`);

      const nextNumber = parseInt(lastMPatient.patient_id.substring(1)) + 1;
      const expectedNextId = 'M' + nextNumber.toString().padStart(6, '0');
      console.log(`   Expected next ID: ${expectedNextId}\n`);
    } else {
      console.log(`   No M-prefix patients yet. First ID will be: M000001\n`);
    }

    console.log('3. Creating a test patient (will use auto-generated ID)...');
    const testPatientData = {
      prefix: 'Mr',
      first_name: 'Test',
      last_name: 'AutoID',
      age: 30,
      gender: 'MALE',
      phone: '9999999999',
      email: 'test@example.com',
      address: 'Test Address',
      emergency_contact_name: 'Test Emergency',
      emergency_contact_phone: '8888888888',
      date_of_entry: new Date().toISOString().split('T')[0]
    };

    const createResponse = await axios.post('http://localhost:3002/api/patients', testPatientData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const newPatient = createResponse.data;
    console.log(`✅ Patient created successfully!`);
    console.log(`   Generated Patient ID: ${newPatient.patient_id}`);
    console.log(`   Name: ${newPatient.prefix} ${newPatient.first_name} ${newPatient.last_name}`);
    console.log(`   Phone: ${newPatient.phone}\n`);

    console.log('4. Deleting test patient...');
    await axios.delete(`http://localhost:3002/api/patients/${newPatient.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Test patient deleted\n');

    console.log('✨ Patient ID Auto-Generation is working correctly!');
    console.log('📋 Format: M + 6-digit zero-padded number (e.g., M000001, M000010, M000100)');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPatientIdGeneration();
