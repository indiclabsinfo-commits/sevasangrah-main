// Check TAT (Turnaround Time) database schema
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

async function checkTATSchema() {
  console.log('=== TAT (TURNAROUND TIME) SCHEMA CHECK ===\n');
  
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Check patients table for TAT columns
    console.log('1. Checking patients table for TAT columns...');
    const patientsRes = await fetch(`${supabaseUrl}/rest/v1/patients?select=*&limit=1`, { headers });
    const [patientSample] = await patientsRes.json();
    
    const patientColumns = Object.keys(patientSample);
    const tatColumns = patientColumns.filter(col => 
      col.toLowerCase().includes('tat') || 
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('duration') ||
      col.toLowerCase().includes('wait')
    );
    
    console.log(`   Total columns: ${patientColumns.length}`);
    console.log(`   TAT-related columns: ${tatColumns.length > 0 ? tatColumns.join(', ') : 'NONE'}`);
    
    // 2. Check if there's a patient_visits or consultations table
    console.log('\n2. Checking for patient_visits or consultations table...');
    
    // Try to access common table names
    const tablesToCheck = [
      'patient_visits',
      'consultations', 
      'opd_visits',
      'patient_consultations',
      'visits'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const tableRes = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, { headers });
        if (tableRes.ok) {
          const countData = await tableRes.json();
          console.log(`   ✅ ${table} table exists (${countData[0]?.count || 0} records)`);
          
          // Get sample to see columns
          const sampleRes = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
          if (sampleRes.ok) {
            const [sample] = await sampleRes.json();
            const sampleColumns = Object.keys(sample || {});
            const timeColumns = sampleColumns.filter(col => 
              col.includes('time') || col.includes('duration') || col.includes('timestamp')
            );
            if (timeColumns.length > 0) {
              console.log(`     Time columns: ${timeColumns.join(', ')}`);
            }
          }
        }
      } catch (e) {
        // Table doesn't exist or can't access
      }
    }
    
    // 3. Check opd_queues table (from OPDQueueManager)
    console.log('\n3. Checking opd_queues table...');
    try {
      const queuesRes = await fetch(`${supabaseUrl}/rest/v1/opd_queues?select=*&limit=1`, { headers });
      if (queuesRes.ok) {
        const [queueSample] = await queuesRes.json();
        const queueColumns = Object.keys(queueSample || {});
        console.log(`   Queue columns: ${queueColumns.length}`);
        
        const timeColumns = queueColumns.filter(col => 
          col.includes('time') || col.includes('duration') || col.includes('timestamp') || col.includes('created') || col.includes('updated')
        );
        console.log(`   Time columns: ${timeColumns.join(', ')}`);
        
        // Check specific TAT columns
        const hasTATColumns = queueColumns.some(col => 
          col.toLowerCase().includes('tat') ||
          col.toLowerCase().includes('wait_time') ||
          col.toLowerCase().includes('consultation_time')
        );
        
        if (!hasTATColumns) {
          console.log('   ❌ Missing TAT tracking columns');
        }
      }
    } catch (e) {
      console.log('   ❌ opd_queues table not accessible');
    }
    
    // 4. Check for tat_config table
    console.log('\n4. Checking for tat_config table...');
    try {
      const tatConfigRes = await fetch(`${supabaseUrl}/rest/v1/tat_config?select=*&limit=1`, { headers });
      if (tatConfigRes.ok) {
        const tatConfig = await tatConfigRes.json();
        console.log(`   ✅ tat_config table exists (${tatConfig.length} records)`);
      } else {
        console.log('   ❌ tat_config table does not exist');
      }
    } catch (e) {
      console.log('   ❌ tat_config table does not exist');
    }
    
    console.log('\n=== TAT IMPLEMENTATION STATUS ===');
    console.log('❌ US-009: TAT tracking columns - NOT IMPLEMENTED');
    console.log('❌ US-010: TAT calculation service - NOT IMPLEMENTED');
    console.log('❌ US-011: Display TAT on queue screen - NOT IMPLEMENTED');
    console.log('❌ US-012: Record consultation timestamps - PARTIAL (created_at exists)');
    console.log('❌ US-013: TAT alerts configuration - NOT IMPLEMENTED');
    console.log('❌ US-014: TAT reports page - NOT IMPLEMENTED');
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkTATSchema();