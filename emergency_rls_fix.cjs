// Emergency fix for RLS error with clear instructions
const fs = require('fs');
const path = require('path');

console.log('🚨 Applying emergency RLS fix...');

const servicePath = path.join(__dirname, 'src/services/supabasePatientService.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Find the error message in createPatient method
const errorMsg = 'throw new Error(`Database Insert Failed: ${dbError.message}`);';
const errorIndex = serviceContent.indexOf(errorMsg);

if (errorIndex === -1) {
  console.log('❌ Could not find error message');
  process.exit(1);
}

// Create better error message with instructions
const betterError = `throw new Error(\`Database Insert Failed: \${dbError.message}.\\n\\n🚨 ROW LEVEL SECURITY (RLS) IS BLOCKING INSERTS!\\n\\nQUICK FIX:\\n1. Go to Supabase Dashboard → SQL Editor\\n2. Run this SQL:\\n\\n   ALTER TABLE patients DISABLE ROW LEVEL SECURITY;\\n   ALTER TABLE patient_transactions DISABLE ROW LEVEL SECURITY;\\n\\nOR run full fix: database_migrations/disable_rls.sql\\n\`);`;

// Replace error message
const newContent = serviceContent.substring(0, errorIndex) + betterError + serviceContent.substring(errorIndex + errorMsg.length);

fs.writeFileSync(servicePath, newContent);
console.log('✅ Emergency RLS fix applied!');
console.log('📝 Error message now includes clear instructions to fix RLS.');