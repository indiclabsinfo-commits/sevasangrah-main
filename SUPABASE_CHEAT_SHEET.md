# Supabase Cheat Sheet for Claude CLI

## 🚀 Quick Start

### Connection
```javascript
const SUPABASE_URL = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};
```

## 📊 Core Tables Reference

### 1. Patients (`patients`)
**Key Fields**: `id` (UUID), `patient_id` (P000001), `phone`, `is_active`
**Sample Query**: `SELECT * FROM patients WHERE phone = '9089786756' AND is_active = true`

### 2. Doctors (`doctors`)  
**Key Fields**: `id`, `name`, `department`, `specialization`, `fee`, `is_active`
**Sample Query**: `SELECT * FROM doctors WHERE department = 'General' AND is_active = true`

### 3. Departments (`departments`)
**Key Fields**: `id`, `name`, `is_active`
**Sample Query**: `SELECT * FROM departments WHERE is_active = true ORDER BY name`

### 4. Users (`users`)
**Key Fields**: `id`, `email`, `role`, `department`, `is_active`
**Sample Query**: `SELECT * FROM users WHERE role = 'doctor' AND is_active = true`

## 🔧 Common Operations

### Create Record
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'return=representation' },
  body: JSON.stringify({
    patient_id: 'P000002',
    first_name: 'John',
    phone: '9876543210',
    is_active: true
  })
});
```

### Read Record
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.UUID_HERE`, {
  headers
});
```

### Update Record
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.UUID_HERE`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    phone: '9999999999',
    updated_at: new Date().toISOString()
  })
});
```

### Delete (Soft Delete)
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.UUID_HERE`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    is_active: false,
    updated_at: new Date().toISOString()
  })
});
```

## 🎯 Business Logic Templates

### Patient Registration
```javascript
async function registerPatient(data) {
  // 1. Check duplicate by phone
  const duplicate = await fetch(`${SUPABASE_URL}/rest/v1/patients?phone=eq.${data.phone}&is_active=eq.true`, { headers });
  
  if (duplicate.data.length > 0) {
    throw new Error('Patient with this phone already exists');
  }
  
  // 2. Generate patient_id (P000001 format)
  const lastPatient = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=patient_id&order=patient_id.desc&limit=1`, { headers });
  const lastId = lastPatient.data[0]?.patient_id || 'P000000';
  const nextId = `P${String(parseInt(lastId.substring(1)) + 1).padStart(6, '0')}`;
  
  // 3. Create patient
  const patient = {
    patient_id: nextId,
    first_name: data.first_name,
    last_name: data.last_name || '',
    phone: data.phone,
    age: data.age,
    gender: data.gender,
    is_active: true,
    date_of_entry: new Date().toISOString()
  };
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(patient)
  });
  
  return response.data[0];
}
```

### Doctor Assignment
```javascript
async function assignDoctor(patientId, department) {
  // 1. Get available doctors in department
  const doctors = await fetch(`${SUPABASE_URL}/rest/v1/doctors?department=eq.${department}&is_active=eq.true`, { headers });
  
  if (doctors.data.length === 0) {
    throw new Error(`No doctors available in ${department} department`);
  }
  
  // 2. Assign first available doctor (or implement round-robin)
  const assignedDoctor = doctors.data[0];
  
  // 3. Update patient record
  await fetch(`${SUPABASE_URL}/rest/v1/patients?id=eq.${patientId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      assigned_doctor_id: assignedDoctor.id,
      updated_at: new Date().toISOString()
    })
  });
  
  return assignedDoctor;
}
```

## ⚡ Performance Tips

### 1. Always use `select=` to limit columns
```javascript
// ❌ Bad: SELECT * 
// ✅ Good: SELECT id, name, phone
await fetch(`${SUPABASE_URL}/rest/v1/patients?select=id,name,phone`, { headers });
```

### 2. Use `limit=` for pagination
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients?select=*&limit=10&offset=0`, { headers });
```

### 3. Add `order=` for consistent sorting
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients?select=*&order=patient_id`, { headers });
```

### 4. Use `count=exact` for total rows
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/patients?select=id&limit=1`, {
  headers: { ...headers, 'Prefer': 'count=exact' }
});
// Check response.headers['content-range']
```

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Invalid API key | Check SUPABASE_KEY |
| `404 Not Found` | Table doesn't exist | Check table name |
| `425 Too Early` | RLS blocking | Use service role key |
| `Duplicate key` | Unique constraint | Check for existing records |

## 📞 Quick Reference URLs

### Patients
- **All patients**: `/rest/v1/patients?select=*&order=patient_id`
- **Active patients**: `/rest/v1/patients?is_active=eq.true`
- **By phone**: `/rest/v1/patients?phone=eq.9089786756`

### Doctors  
- **All doctors**: `/rest/v1/doctors?select=*&order=name`
- **By department**: `/rest/v1/doctors?department=eq.General`
- **Active doctors**: `/rest/v1/doctors?is_active=eq.true`

### Departments
- **All departments**: `/rest/v1/departments?select=*&order=name`
- **Active departments**: `/rest/v1/departments?is_active=eq.true`

## 🎯 Claude CLI Prompt Templates

### For CRUD Operations
```
Create a function to [action] for the [table] table in Supabase.
Use the schema from supabase_interfaces.ts.
Include error handling and validation.
```

### For Business Logic
```
Implement the [workflow] workflow using Supabase.
Follow the business logic from CLAUDE_CLI_SUPABASE_INTEGRATION.md.
Include all necessary API calls and data transformations.
```

### For Data Analysis
```
Analyze data from the [table] table to [goal].
Use appropriate Supabase queries with filters and aggregations.
Return the results in [format].
```

---

**Last Updated**: February 21, 2026  
**Use With**: `supabase_interfaces.ts`, `supabase_schema.sql`, `CLAUDE_CLI_SUPABASE_INTEGRATION.md`