// Check what tables exist in Supabase
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

// Common tables in HMS
const tablesToCheck = [
  'patients',
  'patient_transactions',
  'patient_admissions',
  'daily_expenses',
  'doctors',
  'departments',
  'users',
  'beds',
  'appointments',
  'patient_visits',
  'medicines',
  'services',
  'audit_logs',
  'email_logs',
  'sms_logs',
  'refunds',
  'expenses',
  'ipd_summaries',
  'discharge_summaries',
  'patient_medical_records'
];

async function checkTable(tableName) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    if (response.status === 200) {
      const count = response.headers.get('content-range') || 'unknown';
      console.log(`✅ ${tableName.padEnd(25)} - Exists (count: ${count})`);
      return { exists: true, count };
    } else if (response.status === 404) {
      console.log(`❌ ${tableName.padEnd(25)} - Does not exist`);
      return { exists: false, count: 0 };
    } else {
      console.log(`⚠️  ${tableName.padEnd(25)} - Error: ${response.status}`);
      return { exists: false, count: 0 };
    }
  } catch (error) {
    console.log(`⚠️  ${tableName.padEnd(25)} - Connection error: ${error.message}`);
    return { exists: false, count: 0 };
  }
}

async function checkAllTables() {
  console.log('Checking Supabase tables...\n');
  
  const results = [];
  for (const table of tablesToCheck) {
    const result = await checkTable(table);
    results.push({ table, ...result });
  }
  
  console.log('\n=== Summary ===');
  const existingTables = results.filter(r => r.exists);
  console.log(`Total tables checked: ${tablesToCheck.length}`);
  console.log(`Tables found: ${existingTables.length}`);
  
  // Get sample data from key tables
  console.log('\n=== Sample Data ===');
  
  // Check patients count
  const patientsResponse = await fetch(`${supabaseUrl}/rest/v1/patients?select=*&limit=3`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (patientsResponse.ok) {
    const patients = await patientsResponse.json();
    console.log(`Patients (${patients.length} sample):`);
    patients.forEach(p => {
      console.log(`  - ${p.patient_id}: ${p.first_name} ${p.last_name}, ${p.age}y, ${p.gender}`);
    });
  }
  
  // Check transactions
  const transactionsResponse = await fetch(`${supabaseUrl}/rest/v1/patient_transactions?select=*&limit=3`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (transactionsResponse.ok) {
    const transactions = await transactionsResponse.json();
    console.log(`\nTransactions (${transactions.length} sample):`);
    transactions.forEach(t => {
      console.log(`  - ${t.transaction_type}: ₹${t.amount}, ${t.payment_mode}, ${t.description}`);
    });
  }
}

checkAllTables();