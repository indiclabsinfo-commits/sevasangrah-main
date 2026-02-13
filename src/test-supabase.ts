import { supabase } from './lib/supabaseClient';

// Test Supabase connection
async function testSupabaseConnection() {
    console.log('🧪 Testing Supabase Connection...');
    console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

    try {
        // Test 1: Simple select
        console.log('\n📋 Test 1: Fetching patients...');
        const { data: patients, error: selectError } = await supabase
            .from('patients')
            .select('*')
            .limit(5);

        if (selectError) {
            console.error('❌ Select Error:', selectError);
        } else {
            console.log('✅ Select Success! Found', patients?.length || 0, 'patients');
            console.log('Patients:', patients);
        }

        // Test 2: Insert test patient
        console.log('\n📝 Test 2: Creating test patient...');
        const testPatient = {
            patient_id: 'TEST001',
            full_name: 'Test Patient',
            age: 30,
            gender: 'Male',
            phone: '9999999999',
            patient_tag: 'Test',
        };

        const { data: newPatient, error: insertError } = await supabase
            .from('patients')
            .insert([testPatient])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Insert Error:', insertError);
            console.error('Error Code:', insertError.code);
            console.error('Error Message:', insertError.message);
            console.error('Error Details:', insertError.details);
        } else {
            console.log('✅ Insert Success!', newPatient);

            // Clean up - delete test patient
            await supabase.from('patients').delete().eq('patient_id', 'TEST001');
            console.log('🧹 Cleaned up test patient');
        }

    } catch (error) {
        console.error('❌ Connection Test Failed:', error);
    }
}

// Run test when page loads
testSupabaseConnection();

export default testSupabaseConnection;
