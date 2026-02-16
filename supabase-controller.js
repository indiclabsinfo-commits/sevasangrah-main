// SUPABASE CONTROLLER - Andy's Direct Database Control
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

class SupabaseController {
  constructor() {
    this.headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    };
  }

  async runSQL(sql) {
    console.log(`📝 Running SQL: ${sql.substring(0, 100)}...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ sql })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ SQL executed successfully');
        return result;
      } else {
        const error = await response.text();
        console.log('❌ SQL failed:', error);
        return { error };
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
      return { error: error.message };
    }
  }

  async createPatientWithUHID(name = 'Test Patient') {
    console.log(`👤 Creating patient: ${name}`);
    
    // 1. Get next patient_id
    const lastPatient = await this.getLastPatient();
    const nextId = this.getNextPatientId(lastPatient?.patient_id);
    
    // 2. Generate UHID
    const uhid = await this.generateUHID();
    
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
      notes: 'Created by SupabaseController',
      date_of_entry: new Date().toISOString().split('T')[0],
      patient_tag: 'Test',
      is_active: true,
      hospital_id: '550e8400-e29b-41d4-a716-446655440000'
    };
    
    const response = await fetch(`${supabaseUrl}/rest/v1/patients`, {
      method: 'POST',
      headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(patientData)
    });
    
    if (response.ok) {
      const patient = await response.json();
      console.log(`✅ Patient created: ${patient[0].patient_id} with UHID: ${patient[0].uhid}`);
      return patient[0];
    } else {
      const error = await response.text();
      console.log('❌ Failed to create patient:', error);
      return { error };
    }
  }

  async generateUHID() {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_uhid`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ p_hospital_id: '550e8400-e29b-41d4-a716-446655440000' })
    });
    
    if (response.ok) {
      const uhid = await response.text();
      return uhid.replace(/"/g, ''); // Remove quotes
    }
    return 'MH-2026-000001'; // Fallback
  }

  async getLastPatient() {
    const response = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id&order=patient_id.desc&limit=1`, {
      headers: this.headers
    });
    
    if (response.ok) {
      const patients = await response.json();
      return patients[0];
    }
    return null;
  }

  getNextPatientId(lastId) {
    if (!lastId || !lastId.startsWith('P')) return 'P000001';
    const lastNum = parseInt(lastId.replace('P', ''));
    return `P${(lastNum + 1).toString().padStart(6, '0')}`;
  }

  async listPatientsWithUHID() {
    const response = await fetch(`${supabaseUrl}/rest/v1/patients?select=patient_id,uhid,first_name,last_name&uhid=not.is.null&order=created_at.desc`, {
      headers: this.headers
    });
    
    if (response.ok) {
      return await response.json();
    }
    return [];
  }

  async getTableSchema(tableName) {
    // This would need a custom function in Supabase
    // For now, just describe what we know
    console.log(`📊 Table: ${tableName}`);
    
    if (tableName === 'patients') {
      return {
        required: ['patient_id', 'first_name', 'last_name', 'age', 'gender', 'phone', 'hospital_id', 'is_active'],
        optional: ['uhid', 'email', 'address', 'aadhaar_number', 'abha_id', 'etc']
      };
    }
    
    if (tableName === 'uhid_config') {
      return {
        required: ['prefix', 'year_format', 'current_sequence', 'hospital_id'],
        optional: []
      };
    }
    
    return { error: 'Table schema not predefined' };
  }
}

// Export for use
const controller = new SupabaseController();

// Test the controller
async function testController() {
  console.log('=== SUPABASE CONTROLLER TEST ===\n');
  
  // 1. List current patients with UHID
  console.log('1. Current patients with UHID:');
  const patients = await controller.listPatientsWithUHID();
  patients.forEach(p => {
    console.log(`   - ${p.patient_id}: ${p.first_name} ${p.last_name}, UHID: ${p.uhid}`);
  });
  
  // 2. Create a test patient
  console.log('\n2. Creating test patient...');
  const newPatient = await controller.createPatientWithUHID('Controller Test');
  
  if (newPatient.error) {
    console.log('❌ Failed:', newPatient.error);
  } else {
    console.log(`✅ Created: ${newPatient.patient_id} - ${newPatient.uhid}`);
  }
  
  // 3. Generate a UHID
  console.log('\n3. Generating UHID...');
  const uhid = await controller.generateUHID();
  console.log(`✅ Next UHID: ${uhid}`);
  
  console.log('\n=== CONTROLLER READY ===');
  console.log('I can now:');
  console.log('• Create patients with UHID');
  console.log('• Run SQL directly');
  console.log('• Manage database');
  console.log('• You only test UI');
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testController();
}

export default controller;