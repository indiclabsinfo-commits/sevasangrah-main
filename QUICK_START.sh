#!/bin/bash

# UHID Feature - Quick Start Script
# This script runs the database migrations and restarts the backend

echo "🚀 UHID Feature Deployment - Quick Start"
echo "========================================="
echo ""

# Change to backend directory
cd backend

echo "📦 Step 1: Running database migrations..."
echo ""
node run-migrations.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "🔄 Step 2: Restarting backend server..."
    echo ""

    # Kill existing backend on port 3002
    echo "Stopping existing backend..."
    lsof -ti:3002 | xargs kill 2>/dev/null

    sleep 2

    # Start backend
    echo "Starting backend server..."
    npm start &

    sleep 3

    echo ""
    echo "✅ Backend restarted successfully!"
    echo ""
    echo "========================================="
    echo "🎉 UHID Feature is now active!"
    echo "========================================="
    echo ""
    echo "📝 Next Steps:"
    echo "1. Go to http://localhost:5174"
    echo "2. Login: admin@indic.com / admin123"
    echo "3. Create a new patient"
    echo "4. See UHID: MH2024000001 displayed!"
    echo ""
    echo "📋 Test Checklist:"
    echo "- [ ] Create patient → UHID shows: MH2024000001"
    echo "- [ ] Copy button works"
    echo "- [ ] Patient list shows UHID column"
    echo "- [ ] Search by UHID works"
    echo "- [ ] Second patient gets MH2024000002"
    echo ""
else
    echo ""
    echo "❌ Migration failed! Check error messages above."
    echo ""
    echo "Common fixes:"
    echo "1. Check database credentials in backend/.env"
    echo "2. Ensure Azure PostgreSQL is accessible"
    echo "3. Re-run: node run-migrations.js"
    echo ""
fi
