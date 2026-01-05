const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:3002/api';

async function testCreatePatient() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@hospital.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful');
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Patient
        console.log('Creating patient...');
        const patientData = {
            patient_id: `P${Math.floor(Math.random() * 10000)}`,
            first_name: 'Test',
            last_name: 'Patient',
            age: 30,
            gender: 'MALE',
            phone: '1234567890',
            date_of_entry: new Date().toISOString()
        };

        const createRes = await axios.post(`${API_URL}/patients`, patientData, { headers });
        console.log('✅ Patient created:', createRes.data);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

testCreatePatient();
