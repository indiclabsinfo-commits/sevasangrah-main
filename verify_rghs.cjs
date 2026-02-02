const axios = require('axios');
const path = require('path');
// Load .env from backend directory
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const API_URL = 'http://localhost:3002/api';

async function verifyRGHS() {
    try {
        console.log('1. Logging in...');
        // Note: Assuming backend is running on 3002
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@hospital.com',
            password: 'admin123'
            // Note: If admin password is different, this might fail, but let's try default
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        console.log('2. Fetching a patient to attach transaction to...');
        const patientsRes = await axios.get(`${API_URL}/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (patientsRes.data.length === 0) {
            console.error('❌ No patients found to test with.');
            return;
        }

        const patientId = patientsRes.data[0].id;
        console.log(`Using patient ID: ${patientId}`);

        console.log('3. Creating RGHS Transaction...');
        const transactionData = {
            patient_id: patientId,
            transaction_type: 'SERVICE',
            amount: 500,
            payment_mode: 'RGHS', // Lowercase in DB, but API might handle case
            rghs_number: 'RGHS-TEST-123',
            description: 'RGHS Verification Test',
            department: 'General'
        };

        const createRes = await axios.post(`${API_URL}/transactions`, transactionData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Transaction Created:', createRes.data);

        // Check fields
        if (createRes.data.payment_mode !== 'rghs') {
            throw new Error(`Expected payment_mode 'rghs', got '${createRes.data.payment_mode}'`);
        }
        if (createRes.data.rghs_number !== 'RGHS-TEST-123') {
            throw new Error(`Expected rghs_number 'RGHS-TEST-123', got '${createRes.data.rghs_number}'`);
        }

        console.log('🎉 RGHS Verification SUCCESS!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
        process.exit(1); // Exit with error code
    }
}

verifyRGHS();
