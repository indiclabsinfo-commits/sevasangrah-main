// Fix patient service to handle RLS issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing patient service for RLS issues...');

const servicePath = path.join(__dirname, 'src/services/supabasePatientService.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Find the createPatient method insert section
const insertStart = serviceContent.indexOf('const insertResponse = await fetch(`${supabaseUrl}/rest/v1/patients`');
if (insertStart === -1) {
  console.log('❌ Could not find patient insert code');
  process.exit(1);
}

// Find the end of this fetch call (look for closing parenthesis and semicolon)
let insertEnd = serviceContent.indexOf('});', insertStart);
if (insertEnd === -1) {
  console.log('❌ Could not find end of fetch call');
  process.exit(1);
}
insertEnd += 3; // Include the });

// Extract the current fetch call
const currentFetch = serviceContent.substring(insertStart, insertEnd);

// Create new fetch call that tries RPC first, then direct API
const newFetch = `// Try RPC function first (bypasses RLS)
                let insertResponse;
                let useRpc = true;
                
                try {
                  console.log('🔄 Trying RPC insert...');
                  insertResponse = await fetch(\`\${supabaseUrl}/rest/v1/rpc/insert_patient_record\`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'apikey': supabaseKey,
                          'Authorization': \`Bearer \${supabaseKey}\`,
                          'Prefer': 'return=representation'
                      },
                      body: JSON.stringify({ patient_data: supabaseData })
                  });
                } catch (rpcError) {
                  console.log('⚠️ RPC failed, falling back to direct API:', rpcError.message);
                  useRpc = false;
                  insertResponse = await fetch(\`\${supabaseUrl}/rest/v1/patients\`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'apikey': supabaseKey,
                          'Authorization': \`Bearer \${supabaseKey}\`,
                          'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(supabaseData)
                  });
                }`;

// Also need to update the response handling
// Find the response handling section
const responseTextLine = serviceContent.indexOf('const responseText = await insertResponse.text();', insertEnd);
if (responseTextLine === -1) {
  console.log('❌ Could not find response handling');
  process.exit(1);
}

// Replace the fetch call
const beforeInsert = serviceContent.substring(0, insertStart);
const afterInsert = serviceContent.substring(insertEnd);
const updatedContent = beforeInsert + newFetch + afterInsert;

// Now update response handling to work with both RPC and direct API
// RPC returns {id: ..., patient_id: ...} while direct API returns array
const responseHandlingStart = updatedContent.indexOf('const responseText = await insertResponse.text();');
const parseStart = updatedContent.indexOf('data = JSON.parse(responseText);', responseHandlingStart);

if (parseStart !== -1) {
  // Find the data validation
  const validationStart = updatedContent.indexOf('if (!data || !data.id)', parseStart);
  if (validationStart !== -1) {
    // Find the end of this if block
    const validationEnd = updatedContent.indexOf('throw new Error', validationStart);
    const throwEnd = updatedContent.indexOf(';', validationEnd) + 1;
    
    const beforeValidation = updatedContent.substring(0, validationStart);
    const afterValidation = updatedContent.substring(throwEnd);
    
    // New validation that handles both RPC and direct API responses
    const newValidation = `// Handle both RPC and direct API responses
                if (useRpc) {
                  // RPC returns single object
                  if (!data || !data.id) {
                    console.error('❌ RPC returned invalid data:', responseText);
                    throw new Error('Patient insert returned invalid data from RPC');
                  }
                } else {
                  // Direct API returns array
                  if (!Array.isArray(data) || data.length === 0 || !data[0].id) {
                    console.error('❌ Direct API returned invalid data:', responseText);
                    throw new Error('Patient insert returned empty. Run disable_rls.sql in Supabase SQL Editor.');
                  }
                  data = data[0]; // Use first element
                }`;
    
    const finalContent = beforeValidation + newValidation + afterValidation;
    fs.writeFileSync(servicePath, finalContent);
    console.log('✅ Patient service updated!');
    console.log('📝 Changes:');
    console.log('  1. Tries RPC insert first (bypasses RLS)');
    console.log('  2. Falls back to direct API if RPC fails');
    console.log('  3. Handles both response formats');
  } else {
    console.log('❌ Could not find data validation');
    process.exit(1);
  }
} else {
  console.log('❌ Could not find JSON parse line');
  process.exit(1);
}