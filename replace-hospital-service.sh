#!/bin/bash
# Script to replace HospitalService imports with SupabaseHospitalService

echo "🔧 Replacing HospitalService imports..."

# Find all TypeScript/JS files importing HospitalService
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "import.*HospitalService" {} \; | while read file; do
    echo "Processing: $file"
    
    # Check if already importing SupabaseHospitalService
    if grep -q "SupabaseHospitalService" "$file"; then
        echo "  ✓ Already has SupabaseHospitalService"
        # Remove HospitalService import
        sed -i "/import.*HospitalService/d" "$file"
    else
        # Replace HospitalService import with SupabaseHospitalService
        sed -i "s/import HospitalService from '\.\.\/services\/hospitalService'/import SupabaseHospitalService from '..\/services\/supabaseHospitalService'/g" "$file"
        sed -i "s/import HospitalService from '\.\.\/services\/hospitalService'/import SupabaseHospitalService from '..\/services\/supabaseHospitalService'/g" "$file"
        sed -i "s/import { HospitalService } from '\.\.\/services\/hospitalService'/import SupabaseHospitalService from '..\/services\/supabaseHospitalService'/g" "$file"
        sed -i "s/import HospitalService from '\.\.\/\.\.\/services\/hospitalService'/import SupabaseHospitalService from '..\/..\/services\/supabaseHospitalService'/g" "$file"
        
        # Also replace usage in the file
        sed -i "s/HospitalService\./SupabaseHospitalService\./g" "$file"
    fi
done

echo "✅ Done!"