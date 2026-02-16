// Verify and fix supabaseHospitalService.ts
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/services/supabaseHospitalService.ts', 'utf8');
const lines = content.split('\n');

console.log('🔍 Checking for supabase usage without declaration...');

let inFunction = false;
let currentFunction = '';
let hasSupabaseDeclaration = false;
let errors: string[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect function start
  if (line.match(/^\s*(static|private)\s+async\s+\w+\(/)) {
    inFunction = true;
    currentFunction = line.trim();
    hasSupabaseDeclaration = false;
  }
  
  // Detect function end
  if (inFunction && line.match(/^\s*}\s*$/)) {
    inFunction = false;
    currentFunction = '';
    hasSupabaseDeclaration = false;
  }
  
  // Check for supabase declaration
  if (inFunction && line.includes('const supabase = await getSupabase();')) {
    hasSupabaseDeclaration = true;
  }
  
  // Check for supabase usage without declaration
  if (inFunction && line.includes('supabase.') && !hasSupabaseDeclaration) {
    errors.push(`Line ${i + 1}: ${currentFunction.substring(0, 50)}...`);
    
    // Find where to insert declaration (after opening brace)
    let braceLine = i;
    while (braceLine >= 0 && !lines[braceLine].includes('{')) {
      braceLine--;
    }
    
    if (braceLine >= 0) {
      lines[braceLine] = lines[braceLine] + '\n    const supabase = await getSupabase();';
      console.log(`✅ Fixed: Inserted declaration at line ${braceLine + 1}`);
    }
  }
}

if (errors.length > 0) {
  console.log(`\n⚠️  Found ${errors.length} functions with supabase. usage but no declaration:`);
  errors.forEach(err => console.log(`  - ${err}`));
  
  // Write fixed file
  writeFileSync('src/services/supabaseHospitalService.ts', lines.join('\n'));
  console.log('\n✅ File fixed!');
} else {
  console.log('✅ All functions have proper supabase declarations!');
}

// Also check for the specific error pattern from Vercel
console.log('\n🔍 Checking for specific syntax errors...');
const problematicLines = lines.filter((line, idx) => {
  return line.includes('const supabase = await getSupabase();') && 
         line.includes(':') &&
         !line.includes('//') &&
         !line.includes('*');
});

if (problematicLines.length > 0) {
  console.log('⚠️  Found potentially problematic lines:');
  problematicLines.forEach((line, idx) => {
    const lineNum = lines.indexOf(line) + 1;
    console.log(`  Line ${lineNum}: ${line.trim()}`);
  });
} else {
  console.log('✅ No obvious syntax errors found.');
}