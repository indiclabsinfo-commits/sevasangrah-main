#!/bin/bash
# Update all supabase calls to use getSupabase()

echo "🔧 Updating Supabase calls to use async getSupabase()..."

# Process supabaseHospitalService.ts
if [ -f "src/services/supabaseHospitalService.ts" ]; then
    echo "Processing supabaseHospitalService.ts..."
    
    # Replace direct supabase. calls with await getSupabase().
    sed -i "s/const { data, error } = await supabase\./const supabase = await getSupabase();\n    const { data, error } = await supabase./g" src/services/supabaseHospitalService.ts
    
    # Add await getSupabase() at start of each function
    sed -i "/^  static async /{N;s/\(\n  static async .*\)/\n    const supabase = await getSupabase();\1/}" src/services/supabaseHospitalService.ts
    
    # Fix any remaining direct supabase references
    sed -i "s/^  static async \(.*\){/  static async \1{\n    const supabase = await getSupabase();/" src/services/supabaseHospitalService.ts
fi

echo "✅ Done!"