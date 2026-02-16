#!/bin/bash

echo "=== Magnus Hospital HMS - Build Status Check ==="
echo "Date: $(date)"
echo ""

# Check Node.js version
echo "1. Node.js Environment:"
node --version
npm --version
echo ""

# Check dependencies
echo "2. Dependencies Status:"
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json exists"
else
    echo "⚠️  package-lock.json missing"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
    # Count dependencies
    DEPS_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "   Dependencies installed: $((DEPS_COUNT - 1))"
else
    echo "❌ node_modules directory missing"
    echo "   Run: npm install"
fi
echo ""

# Check TypeScript compilation
echo "3. TypeScript Compilation:"
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
    # Try type check
    npx tsc --noEmit 2>&1 | head -20
else
    echo "❌ tsconfig.json missing"
fi
echo ""

# Check Vite build
echo "4. Vite Build Check:"
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts exists"
    # Check if build would work
    echo "   Testing build command..."
    npx vite build --mode development 2>&1 | tail -10
else
    echo "❌ vite.config.ts missing"
fi
echo ""

# Check environment variables
echo "5. Environment Configuration:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    # Check Supabase config
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo "✅ Supabase URL configured"
    else
        echo "❌ Supabase URL missing"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo "✅ Supabase Anon Key configured"
    else
        echo "❌ Supabase Anon Key missing"
    fi
else
    echo "❌ .env file missing"
fi
echo ""

# Check source code structure
echo "6. Source Code Structure:"
if [ -d "src" ]; then
    echo "✅ src directory exists"
    # Count components
    COMPONENTS_COUNT=$(find src/components -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
    echo "   React components: $COMPONENTS_COUNT"
    
    # Count pages
    PAGES_COUNT=$(find src/pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
    echo "   Page components: $PAGES_COUNT"
    
    # Check main files
    if [ -f "src/App.tsx" ]; then
        echo "✅ Main App.tsx exists"
    else
        echo "❌ Main App.tsx missing"
    fi
    
    if [ -f "src/main.tsx" ]; then
        echo "✅ Entry point main.tsx exists"
    else
        echo "❌ Entry point main.tsx missing"
    fi
else
    echo "❌ src directory missing"
fi
echo ""

# Check Supabase connection
echo "7. Supabase Connection Test:"
if [ -f "test-supabase-connection.js" ]; then
    node test-supabase-connection.js 2>&1 | grep -E "(✅|❌|Testing|Sample)"
else
    echo "⚠️  Test script not found"
fi
echo ""

echo "=== Summary ==="
echo "The codebase appears to be a complete React + TypeScript + Vite application"
echo "with Supabase backend integration."
echo ""
echo "Next steps:"
echo "1. Run: npm install (if node_modules missing)"
echo "2. Run: npm run build:typecheck"
echo "3. Run: npm run build"
echo "4. Deploy to Vercel for testing"
echo "5. Begin Magnus-specific customizations"