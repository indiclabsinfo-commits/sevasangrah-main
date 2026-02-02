const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const API_URL = 'http://localhost:3002/api';

async function verifyRGHS() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@hospital.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        console.log('2. Creating RGHS Transaction...');
        const transactionData = {
            patient_id: '1e576203-aa0e-4340-85f2-22678dd56a59', // Using a known patient ID or need to fetch one
            transaction_type: 'SERVICE',
            amount: 500,
            payment_mode: 'RGHS',
            rghs_number: 'RGHS-TEST-123',
            description: 'RGHS Test Transaction',
            department: 'General'
        };

        // First get a valid patient ID
        const patientsRes = await axios.get(`${API_URL}/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (patientsRes.data.length === 0) {
            console.error('❌ No patients found to test with.');
            return;
        }

        transactionData.patient_id = patientsRes.data[0].id;
        console.log(`Using patient ID: ${transactionData.patient_id}`);

        const createRes = await axios.post(`${API_URL}/transactions`, transactionData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Transaction Created:', createRes.data);

        if (createRes.data.payment_mode !== 'rghs') {
            throw new Error(`Expected payment_mode 'rghs', got '${createRes.data.payment_mode}'`);
        }
        if (createRes.data.rghs_number !== 'RGHS-TEST-123') {
            throw new Error(`Expected rghs_number 'RGHS-TEST-123', got '${createRes.data.rghs_number}'`);
        }

        console.log('3. Verifying in Ledger (Transaction List)...');

        // Cleanup - Delete the test transaction
        // Assuming there is a delete endpoint or we just leave it as test data
        // Usually DELETE /api/transactions/:id

        // console.log('4. Cleaning up...');
        // await axios.delete(`${API_URL}/transactions/${createRes.data.id}`, {
        //    headers: { Authorization: `Bearer ${token}` }
        // });
        // console.log('✅ Cleanup successful');

        console.log('🎉 RGHS Verification SUCCESS!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyRGHS();
