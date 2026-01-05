# Week 2 Setup Guide - Make Features Visible

This guide shows how to implement the documented features so they appear in the UI.

---

## Step 1: Run Database Migrations

### 1.1 Connect to Azure Database
```bash
cd backend
psql -h sevasangraha.postgres.database.azure.com -U divyansh04 -d postgres
# Password: Rawal@00
```

### 1.2 Run UHID Migration
```sql
\i ../docs/database/migration_scripts/001_add_uhid_system.sql
```

### 1.3 Run Module Access Migration
```sql
\i ../docs/database/migration_scripts/002_module_access_control.sql
```

### 1.4 Verify Tables Created
```sql
-- Check if UHID tables exist
\dt uhid*

-- Check if module tables exist
\dt modules
\dt user_module_access
\dt testing_credentials

-- Check if patients table now has uhid column
\d patients
```

---

## Step 2: Test Backend API Endpoints

After migrations, test the new module access endpoints:

### Get All Modules
```bash
# First login to get token
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@indic.com","password":"admin123"}'

# Copy the token from response, then:
curl http://localhost:3002/api/modules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response: List of 15 modules (OPD, IPD, Billing, etc.)

### Get My Accessible Modules
```bash
curl http://localhost:3002/api/modules/my-access \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: As admin, you should see all 15 modules

---

## Step 3: Implement UHID in Patient Registration UI

### 3.1 Update Patient Registration Form

File: `src/pages/PatientEntry.tsx` or `src/components/forms/PatientRegistrationForm.tsx`

Add UHID display at the top of the form:

```tsx
import { useState, useEffect } from 'react';

// After patient is created, display UHID
{patient?.uhid && (
  <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">Patient UHID</p>
        <p className="text-2xl font-bold text-blue-600">{patient.uhid}</p>
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(patient.uhid)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        📋 Copy
      </button>
    </div>
  </div>
)}
```

### 3.2 Update Backend Patient Creation

The backend already generates UUIDs. After migration, the trigger will auto-generate UHID.

Test by creating a new patient - UHID should appear automatically!

---

## Step 4: Add UHID Search to Patient List

File: `src/pages/Patients/PatientList.tsx` or similar

Add search by UHID:

```tsx
<input
  type="text"
  placeholder="Search by UHID, Name, or Phone"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="px-4 py-2 border rounded-lg"
/>
```

Filter logic:
```tsx
const filteredPatients = patients.filter(patient =>
  patient.uhid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  patient.phone?.includes(searchTerm)
);
```

---

## Step 5: Filter Navigation by Module Access (Optional for Testing)

File: `src/components/layout/Sidebar.tsx`

```tsx
import { moduleAccessService } from '../services/moduleAccessService';
import { useEffect, useState } from 'react';

const [accessibleModules, setAccessibleModules] = useState<string[]>([]);

useEffect(() => {
  // Get user's accessible modules
  moduleAccessService.getMyModules()
    .then(modules => {
      const codes = modules
        .filter(m => m.isCurrentlyAccessible)
        .map(m => m.moduleCode);
      setAccessibleModules(codes);
    });
}, []);

// Filter menu items
const filteredMenuItems = menuItems.filter(item => {
  // Show if no module code specified
  if (!item.moduleCode) return true;

  // Check if user has access
  return accessibleModules.includes(item.moduleCode);
});
```

---

## Step 6: Test with Mr. Farooq's Account

### 6.1 Set Password for Test Account

```sql
-- Connect to database
psql -h sevasangraha.postgres.database.azure.com -U divyansh04 -d postgres

-- Update Mr. Farooq's password
UPDATE users
SET password_hash = '$2a$10$YourBcryptHashHere'
WHERE email = 'farooq.testing@magnushospital.com';
```

Or create new test user:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'farooq.test@magnushospital.com',
  '$2a$10$...',  -- bcrypt hash of 'test123'
  'Farooq',
  'Testing',
  'TESTER',
  true
);
```

### 6.2 Grant OPD Module Access

```sql
SELECT grant_module_access(
  (SELECT id FROM users WHERE email = 'farooq.testing@magnushospital.com'),
  ARRAY['OPD'],
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
  NULL,
  'OPD Module Testing - Phase 1'
);
```

### 6.3 Login and Verify

1. Login with farooq.testing@magnushospital.com
2. Should only see OPD menu items
3. Cannot access IPD, Billing, etc.

---

## Quick Implementation Checklist

- [ ] Run database migrations (Step 1)
- [ ] Verify UHID auto-generation works
- [ ] Test module access API endpoints (Step 2)
- [ ] Add UHID display to patient form (Step 3)
- [ ] Add UHID search to patient list (Step 4)
- [ ] Optional: Filter navigation by modules (Step 5)
- [ ] Optional: Test with Mr. Farooq account (Step 6)

---

## What You'll See After Implementation

### UHID Feature:
- ✅ New patients get UHID automatically (e.g., MH2024000001)
- ✅ UHID displayed prominently on patient forms
- ✅ Can search patients by UHID
- ✅ UHID appears in all patient records

### Module Access Feature:
- ✅ API to check user's module access
- ✅ Can grant/revoke module access (admin only)
- ✅ Mr. Farooq sees only OPD module
- ✅ Ready for phased testing

---

## Estimated Time

- Database migrations: **5 minutes**
- Test backend APIs: **5 minutes**
- Add UHID to UI: **30 minutes**
- Filter navigation: **1 hour**
- **Total: ~2 hours for basic implementation**

---

## Need Help?

Refer to the detailed documentation:
- UHID: `/docs/features/opd/FEATURE_001_UHID_Generation.md`
- Module Access: `/docs/database/migration_scripts/002_module_access_control.sql`

