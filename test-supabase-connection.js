// Simple Supabase connection test using fetch API
const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test REST API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/patients?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Supabase connection successful!');
      console.log('Sample patient data:', data);
      
      // Try to get table count
      const countResponse = await fetch(`${supabaseUrl}/rest/v1/patients?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      
      if (countResponse.ok) {
        const count = countResponse.headers.get('content-range');
        console.log('Patient count:', count);
      }
    } else {
      console.error('❌ Supabase connection failed:', response.status, response.statusText);
      
      // Try a different endpoint
      const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (tablesResponse.ok) {
        console.log('REST API available, checking available endpoints...');
      }
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testSupabase();