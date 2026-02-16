// Manual TAT migration - run SQL in parts
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2ODkwMSwiZXhwIjoyMDg2NTQ0OTAxfQ.fnCu-HazEGuirsjLATPnDF_Nnbvy6BsZ9kEr2DQKg0E';

const headers = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Content-Type': 'application/json'
};

async function runSQLPart(sql) {
  console.log(`📝 Running: ${sql.substring(0, 80)}...`);
  
  try {
    // Try to execute via REST API - for simple queries
    if (sql.trim().toUpperCase().startsWith('CREATE TABLE') || 
        sql.trim().toUpperCase().startsWith('ALTER TABLE') ||
        sql.trim().toUpperCase().startsWith('CREATE OR REPLACE')) {
      
      // For DDL statements, we need to use a different approach
      // Let's try to create a simple function first that can execute SQL
      console.log('⚠️  DDL statement - need alternative approach');
      return { success: false, error: 'DDL not supported via REST' };
    }
    
    // For simple SELECT/INSERT, use REST
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      if (tableMatch) {
        const table = tableMatch[1];
        const selectRes = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
        if (selectRes.ok) {
          return { success: true, data: await selectRes.json() };
        }
      }
    }
    
    if (sql.trim().toUpperCase().startsWith('INSERT INTO')) {
      // Parse INSERT statement (simplified)
      const match = sql.match(/INSERT INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
      if (match) {
        const [, table, columnsStr, valuesStr] = match;
        const columns = columnsStr.split(',').map(c => c.trim());
        const values = valuesStr.split(',').map(v => v.trim().replace(/'/g, ''));
        
        const data = {};
        columns.forEach((col, i) => {
          data[col] = values[i];
        });
        
        const insertRes = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify(data)
        });
        
        if (insertRes.ok) {
          return { success: true };
        }
      }
    }
    
    return { success: false, error: 'Unsupported SQL type' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function migrateTAT() {
  console.log('🚀 Starting TAT System Migration...\n');
  
  // We'll need to create the tables via a different method
  // For now, let's check what exists and update the tracker
  
  console.log('🔍 Checking current TAT implementation...\n');
  
  try {
    // 1. Check if tat_config table exists
    console.log('1. Checking tat_config table...');
    const configRes = await fetch(`${supabaseUrl}/rest/v1/tat_config?select=count`, { headers });
    if (configRes.ok) {
      const config = await configRes.json();
      console.log(`   ✅ tat_config table exists (${config[0]?.count || 0} records)`);
    } else {
      console.log('   ❌ tat_config table does not exist');
    }
    
    // 2. Check opd_queues for TAT columns
    console.log('\n2. Checking opd_queues TAT columns...');
    const queuesRes = await fetch(`${supabaseUrl}/rest/v1/opd_queues?select=*&limit=1`, { headers });
    if (queuesRes.ok) {
      const [queue] = await queuesRes.json();
      const queueColumns = Object.keys(queue || {});
      
      const tatColumns = ['wait_time', 'consultation_start_time', 'consultation_end_time', 
                         'consultation_duration', 'total_tat', 'tat_status', 'tat_notes'];
      
      const existingColumns = tatColumns.filter(col => queueColumns.includes(col));
      const missingColumns = tatColumns.filter(col => !queueColumns.includes(col));
      
      if (existingColumns.length > 0) {
        console.log(`   ✅ Some TAT columns exist: ${existingColumns.join(', ')}`);
      }
      if (missingColumns.length > 0) {
        console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}`);
      }
    }
    
    // 3. Check patient_visits table
    console.log('\n3. Checking patient_visits table...');
    const visitsRes = await fetch(`${supabaseUrl}/rest/v1/patient_visits?select=count`, { headers });
    if (visitsRes.ok) {
      const visits = await visitsRes.json();
      console.log(`   ✅ patient_visits table exists (${visits[0]?.count || 0} records)`);
    } else {
      console.log('   ❌ patient_visits table does not exist');
    }
    
    // 4. Check calculate_tat function
    console.log('\n4. Checking calculate_tat function...');
    try {
      // Try to call the function
      const funcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/calculate_tat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_queue_id: '00000000-0000-0000-0000-000000000000' })
      });
      
      if (funcRes.ok || funcRes.status === 400) {
        console.log('   ✅ calculate_tat function exists');
      } else {
        console.log('   ❌ calculate_tat function does not exist');
      }
    } catch (e) {
      console.log('   ❌ calculate_tat function does not exist');
    }
    
    console.log('\n📊 TAT IMPLEMENTATION STATUS:');
    console.log('❌ US-009: TAT tracking columns - PARTIAL (some may exist)');
    console.log('❌ US-010: TAT calculation service - NOT IMPLEMENTED');
    console.log('❌ US-011: Display TAT on queue screen - NOT IMPLEMENTED');
    console.log('✅ US-012: Record consultation timestamps - PARTIAL (created_at exists)');
    console.log('❌ US-013: TAT alerts configuration - NOT IMPLEMENTED');
    console.log('❌ US-014: TAT reports page - NOT IMPLEMENTED');
    
    console.log('\n⚠️  NOTE: Full TAT migration requires database admin access.');
    console.log('   For now, we can implement UI components with mock data.');
    
  } catch (error) {
    console.error('❌ Error checking migration:', error);
  }
}

migrateTAT();