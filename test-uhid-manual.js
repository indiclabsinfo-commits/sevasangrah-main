// Manual UHID Test - Create patient with UHID
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function testUHIDManual() {
  console.log('=== MANUAL UHID TEST ===\n');
  
  try {
    // 1. Get next patient_id
    console.log('1. Getting next patient_id...');
    const lastPatientRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id&order=patient_id.desc&limit=1`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    
    const lastPatients = await lastPatientRes.json();
    const lastId = lastPatients[0]?.patient_id || 'P000000';
    const lastNum = parseInt(lastId.replace('P', ''));
    const nextId = `P${(lastNum + 1).toString().padStart(6, '0')}`;
    console.log(`   Last: ${lastId}, Next: ${nextId}`);
    
    // 2. Generate UHID
    console.log('\n2. Generating UHID...');
    const uhidRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
      method: 'POST',
      headers: { 
        'apikey': anonKey, 
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
    });
    
    const uhid = await uhidRes.text();
    console.log(`   Generated UHID: ${uhid}`);
    
    // 3. Create patient with UHID
    console.log('\n3. Creating patient with UHID...');
    const patientData = {
      patient_id: nextId,
      uhid: uhid.replace(/"/g, ''), // Remove quotes from JSON string
      prefix: 'Mr',
      first_name: 'UHID',
      last_name: 'Test',
      age: 30,
      gender: 'MALE',
      phone: '9998887777', // REQUIRED field
      email: 'test@example.com',
      address: 'Test Address',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '9998887777',
      medical_history: 'None',
      allergies: 'None',
      current_medications: 'None',
      blood_group: 'O+',
      notes: 'Test patient for UHID verification',
      date_of_entry: new Date().toISOString().split('T')[0],
      patient_tag: 'Test',
      is_active: true,
      hospital_id: '550e8400-e29b-41d4-a716-446655440000'
    };
    
    const createRes = await fetch(`${supabaseUrl}/rest/v1/patients`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(patientData)
    });
    
    if (createRes.ok) {
      const createdPatient = await createRes.json();
      console.log('✅ Patient created successfully!');
      console.log(`   Patient ID: ${createdPatient[0].patient_id}`);
      console.log(`   UHID: ${createdPatient[0].uhid}`);
      console.log(`   Name: ${createdPatient[0].first_name} ${createdPatient[0].last_name}`);
    } else {
      const error = await createRes.text();
      console.log('❌ Failed to create patient:', error);
    }
    
    // 4. Verify
    console.log('\n4. Verifying UHID in database...');
    const verifyRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id,uhid,first_name,last_name&order=created_at.desc&limit=3`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    
    const patients = await verifyRes.json();
    console.log('Latest patients with UHID:');
    patients.forEach(p => {
      console.log(`   - ${p.patient_id}: ${p.first_name} ${p.last_name}, UHID: ${p.uhid || 'NULL'}`);
    });
    
    const withUHID = patients.filter(p => p.uhid).length;
    console.log(`\n📊 ${withUHID} out of ${patients.length} patients have UHID`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUHIDManual();