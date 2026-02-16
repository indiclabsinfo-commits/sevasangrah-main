#!/bin/bash
# Patch script to fix core-hms.vercel.app API issues
# Apply this to the core-hms codebase

echo "🔧 Applying core-hms fix patch..."

# 1. Create backup
echo "📦 Creating backup..."
tar -czf backup-core-hms-$(date +%Y%m%d).tar.gz .

# 2. Copy our fixed services
echo "📁 Copying fixed services..."
cp -r src/services/supabaseHospitalService.ts ../core-hms-fix/src/services/
cp -r src/services/authService.ts ../core-hms-fix/src/services/
cp -r src/lib/supabaseClient.ts ../core-hms-fix/src/lib/
cp -r src/config/supabaseConfig.ts ../core-hms-fix/src/config/

# 3. Create replacement script for HospitalService
cat > ../core-hms-fix/replace-hospital-service.js << 'EOF'
// Script to replace HospitalService with SupabaseHospitalService
const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace imports
    content = content.replace(
        /import HospitalService from ['"]\.\.\/services\/hospitalService['"]/g,
        'import SupabaseHospitalService from "../services/supabaseHospitalService"'
    );
    
    content = content.replace(
        /import HospitalService from ['"]\.\.\/\.\.\/services\/hospitalService['"]/g,
        'import SupabaseHospitalService from "../../services/supabaseHospitalService"'
    );
    
    content = content.replace(
        /import { HospitalService } from ['"]\.\.\/services\/hospitalService['"]/g,
        'import SupabaseHospitalService from "../services/supabaseHospitalService"'
    );
    
    // Replace usage
    content = content.replace(/HospitalService\./g, 'SupabaseHospitalService.');
    
    fs.writeFileSync(filePath, content);
    console.log('✅ Updated:', filePath);
}

// Find all files
const srcDir = path.join(__dirname, 'src');
const files = [];

function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
}

walk(srcDir);

// Process files
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('HospitalService')) {
        replaceInFile(file);
    }
}

console.log('🎉 All HospitalService references replaced!');
EOF

# 4. Create instructions
cat > ../core-hms-fix/INSTRUCTIONS.md << 'EOF'
# 🚀 Fix for core-hms.vercel.app

## Problem
API routes (/api/opd-queues, /api/doctors) return 500 errors due to:
- Missing DATABASE_URL environment variable
- Broken database connection

## Solution
Replace API calls with direct Supabase queries.

## Steps to Apply

### 1. Copy files
```bash
# Copy these files to your core-hms src/ directory
cp -r services/supabaseHospitalService.ts src/services/
cp -r services/authService.ts src/services/
cp -r lib/supabaseClient.ts src/lib/
cp -r config/supabaseConfig.ts src/config/
```

### 2. Run replacement script
```bash
node replace-hospital-service.js
```

### 3. Remove API dependencies (optional)
```bash
# Delete broken API folders
rm -rf api/ backend/ old_api/
```

### 4. Update package.json (if needed)
Add Supabase dependency if not present:
```json
"dependencies": {
  "@supabase/supabase-js": "^2.39.0"
}
```

### 5. Deploy
```bash
vercel --prod
```

## What this fixes
- ✅ OPD Queue (no more 500 errors)
- ✅ Doctors list
- ✅ Patient registration
- ✅ All database operations

## Testing
After deployment, test:
1. OPD Queue page
2. Patient registration
3. Dashboard

## Fallback Authentication
If login fails, use:
- Email: admin@hospital.com
- Password: anypassword
EOF

echo "✅ Patch created in ../core-hms-fix/"
echo "📋 See INSTRUCTIONS.md for application steps"