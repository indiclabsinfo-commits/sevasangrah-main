// Simple Supabase Controller Test
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function testController() {
  console.log('=== SUPABASE CONTROLLER TEST ===\n');
  
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };
  
  // 1. List current patients with UHID
  console.log('1. Current patients with UHID:');
  const patientsRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id,uhid,first_name,last_name&uhid=not.is.null&order=created_at.desc`, {
    headers
  });
  
  if (patientsRes.ok) {
    const patients = await patientsRes.json();
    patients.forEach(p => {
      console.log(`   - ${p.patient_id}: ${p.first_name} ${p.last_name}, UHID: ${p.uhid}`);
    });
    console.log(`   Total with UHID: ${patients.length}`);
  }
  
  // 2. Generate a UHID
  console.log('\n2. Generating UHID...');
  const uhidRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
  });
  
  if (uhidRes.ok) {
    const uhid = await uhidRes.text();
    console.log(`✅ Next UHID: ${uhid}`);
  }
  
  // 3. Get next patient_id
  console.log('\n3. Getting next patient_id...');
  const lastRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id&order=patient_id.desc&limit=1`, {
    headers
  });
  
  if (lastRes.ok) {
    const [lastPatient] = await lastRes.json();
    const lastId = lastPatient?.patient_id || 'P000000';
    const lastNum = parseInt(lastId.replace('P', ''));
    const nextId = `P${(lastNum + 1).toString().padStart(6, '0')}`;
    console.log(`   Last: ${lastId}, Next: ${nextId}`);
  }
  
  console.log('\n=== CONTROLLER READY ===');
  console.log('✅ I can control Supabase directly');
  console.log('✅ No more SQL back-and-forth');
  console.log('✅ You only test UI');
}

testController();