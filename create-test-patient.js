// Create test patient via Supabase Controller
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function createTestPatient(name = 'Controller Test') {
  console.log(`👤 Creating patient: ${name}`);
  
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };
  
  // 1. Get next patient_id
  const lastRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id&order=patient_id.desc&limit=1`, { headers });
  const [lastPatient] = await lastRes.json();
  const lastId = lastPatient?.patient_id || 'P000000';
  const lastNum = parseInt(lastId.replace('P', ''));
  const nextId = `P${(lastNum + 1).toString().padStart(6, '0')}`;
  
  // 2. Generate UHID
  const uhidRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
  });
  const uhid = (await uhidRes.text()).replace(/"/g, '');
  
  // 3. Create patient
  const patientData = {
    patient_id: nextId,
    uhid: uhid,
    prefix: 'Mr',
    first_name: name.split(' ')[0] || 'Test',
    last_name: name.split(' ').slice(1).join(' ') || 'Patient',
    age: 30,
    gender: 'MALE',
    phone: '9998887777',
    email: 'test@example.com',
    address: 'Test Address',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '9998887777',
    medical_history: 'None',
    allergies: 'None',
    current_medications: 'None',
    blood_group: 'O+',
    notes: 'Created by Andy via Supabase Controller',
    date_of_entry: new Date().toISOString().split('T')[0],
    patient_tag: 'Test',
    is_active: true,
    hospital_id: '550e8400-e29b-41d4-a716-446655440000'
  };
  
  const createRes = await fetch(`${supabaseUrl}/rest/v1/patients`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(patientData)
  });
  
  if (createRes.ok) {
    const patient = await createRes.json();
    console.log(`✅ Patient created: ${patient[0].patient_id}`);
    console.log(`✅ UHID: ${patient[0].uhid}`);
    console.log(`✅ Name: ${patient[0].first_name} ${patient[0].last_name}`);
    return patient[0];
  } else {
    const error = await createRes.text();
    console.log('❌ Failed:', error);
    return { error };
  }
}

// Create a test patient
createTestPatient('Andy Controller Test');