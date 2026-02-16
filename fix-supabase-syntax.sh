#!/bin/bash
# Fix syntax errors in supabaseHospitalService.ts

echo "🔧 Fixing supabaseHospitalService.ts syntax errors..."

FILE="src/services/supabaseHospitalService.ts"

# Fix 1: Remove const supabase = await getSupabase(); from function parameters
sed -i 's/static async \(.*\)(data: {[\n ]*const supabase = await getSupabase();/static async \1(data: {/' "$FILE"

# Fix 2: Ensure const supabase = await getSupabase(); is at start of function body
# For each function that has the error
sed -i '/static async .*{/{N;s/static async \(.*\){[\n ]*const supabase = await getSupabase();[\n ]*try/static async \1{\n    const supabase = await getSupabase();\n    try/}' "$FILE"

# Fix 3: Move any remaining const supabase lines from parameters to body
sed -i ':a;N;$!ba;s/{\n[[:space:]]*const supabase = await getSupabase();\n[[:space:]]*\([a-z_]*:\)/{\n    \1/g' "$FILE"

echo "✅ Syntax fixes applied. Checking for remaining errors..."

# Check for obvious syntax errors
if grep -q "const supabase = await getSupabase();.*:" "$FILE"; then
    echo "⚠️  Still found const supabase in wrong place"
    grep -n "const supabase = await getSupabase();.*:" "$FILE"
fi

echo "📝 Manual check needed for:" 
grep -n "static async" "$FILE" | while read line; do
    func=$(echo "$line" | cut -d: -f2-)
    echo "  - $func"
done