// Fix all functions in supabaseHospitalService.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/supabaseHospitalService.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing all functions in supabaseHospitalService.ts...');

// Pattern to find function declarations
const functionPattern = /(static async \w+\([^{]*\):[^{]*{)/g;
let matches;
const functions = [];

while ((matches = functionPattern.exec(content)) !== null) {
    functions.push({
        match: matches[0],
        index: matches.index
    });
}

// Sort by index (reverse to avoid messing up indices)
functions.sort((a, b) => b.index - a.index);

// Fix each function
for (const func of functions) {
    const start = func.index;
    const funcStart = content.substring(start);
    const funcBodyMatch = funcStart.match(/{(.*?)}(?=\s*(?:static|private|$))/s);
    
    if (!funcBodyMatch) continue;
    
    const funcBody = funcBodyMatch[0];
    const funcBodyStart = funcBody.substring(0, 100); // First 100 chars
    
    // Check if function already has const supabase = await getSupabase();
    if (funcBody.includes('const supabase = await getSupabase();')) {
        console.log(`✅ Function already has supabase: ${func.match.substring(0, 50)}...`);
        continue;
    }
    
    // Check if function uses supabase.
    if (funcBody.includes('supabase.')) {
        console.log(`⚠️  Function uses supabase but missing declaration: ${func.match.substring(0, 50)}...`);
        
        // Insert const supabase = await getSupabase(); after opening brace
        const fixedFuncBody = funcBody.replace('{', '{\n    const supabase = await getSupabase();');
        content = content.substring(0, start) + funcStart.replace(funcBody, fixedFuncBody);
        
        console.log(`   Fixed`);
    }
}

// Write fixed content
fs.writeFileSync(filePath, content);
console.log('✅ All functions fixed!');

// Verify no more supabase. without declaration
const lines = content.split('\n');
let hasErrors = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('supabase.') && !lines[i].includes('const supabase')) {
        // Check if previous lines in same function have declaration
        let hasDeclaration = false;
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
            if (lines[j].includes('const supabase = await getSupabase();')) {
                hasDeclaration = true;
                break;
            }
            if (lines[j].includes('static async') || lines[j].includes('private async')) {
                break; // Reached function start
            }
        }
        
        if (!hasDeclaration) {
            console.log(`❌ Line ${i + 1}: supabase. without declaration: ${lines[i].trim()}`);
            hasErrors = true;
        }
    }
}

if (!hasErrors) {
    console.log('🎉 No syntax errors found!');
} else {
    console.log('⚠️  Some errors may remain. Manual check recommended.');
}