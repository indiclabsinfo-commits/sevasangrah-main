# Claude Code CLI - Supabase Integration Guide

## 📋 Overview
Complete documentation for integrating Claude Code CLI with Magnus Hospital's Supabase database. This guide provides the database schema, TypeScript interfaces, API examples, and business logic for seamless AI-assisted development.

## 🔐 Connection Details
```env
SUPABASE_URL=https://plkbxjedbjpmbfrekmrr.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM
```

## 🗃️ Database Schema

### 📊 Table Summary
| Table | Rows | Description | Key Columns |
|-------|------|-------------|-------------|
| `patients` | 0 | Patient master data | `id`, `patient_id` |
| `doctors` | 0 | Doctor profiles | `id`, `name`, `department` |
| `appointments` | 0 | Appointment bookings | `id`, `patient_id`, `doctor_id` |
| `prescriptions` | 0 | Medication orders | `id`, `patient_id`, `doctor_id` |
| `bills` | 0 | Billing records | `id`, `patient_id`, `amount` |
| `departments` | 0 | Hospital departments | `id`, `name` |
| `users` | 0 | System users | `id`, `email` |
| `transactions` | 0 | Financial transactions | `id`, `patient_id`, `type` |
| `medicines` | 0 | Medicine inventory | `id`, `name` |

---

## 🏥 Core Medical Tables

### 1. Patients Table (`patients`)
**Primary Key**: `id` (UUID)
**Business Key**: `patient_id` (P000001 format)

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL UNIQUE,  -- Format: P000001
  prefix TEXT,                      -- Mr/Mrs/Dr
  first_name TEXT NOT NULL,
  last_name TEXT,
  age INTEGER,
  gender TEXT,                      -- MALE/FEMALE/OTHER
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  blood_group TEXT,                 -- A+, B+, O+, etc.
  notes TEXT,
  date_of_entry TIMESTAMP,
  created_by TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  hospital_id UUID,                 -- Foreign key to hospitals
  -- ... 20+ more columns
);
```

**Sample Patient Record:**
```json
{
  "id": "b00afa82-c9ed-4baf-9e59-d16fc2f63a96",
  "patient_id": "P000001",
  "prefix": "Mr",
  "first_name": "yash",
  "last_name": "",
  "age": 25,
  "gender": "MALE",
  "phone": "9089786756",
  "email": "yash@gmail.com",
  "address": "udaipur",
  "blood_group": "A+",
  "is_active": true
}
```

### 2. Doctors Table (`doctors`)
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- Dr. Rajesh Kumar
  department TEXT NOT NULL,         -- General, Cardiology, etc.
  specialization TEXT,              -- General Medicine, Cardiology
  fee DECIMAL(10,2),                -- Consultation fee
  consultation_fee DECIMAL(10,2),
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Doctor Record:**
```json
{
  "id": "ee07ce03-427e-45ab-a7ab-91ec6fa32ff8",
  "name": "Dr. Rajesh Kumar",
  "department": "General",
  "specialization": "General Medicine",
  "fee": 500.00,
  "is_active": true
}
```

### 3. Departments Table (`departments`)
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,        -- Cardiology, Emergency, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Users Table (`users`)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT,                        -- admin, doctor, nurse, reception
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 Database Relationships

### Foreign Key Relationships
1. **patients.hospital_id** → `hospitals.id` (if hospitals table exists)
2. **appointments.patient_id** → `patients.id`
3. **appointments.doctor_id** → `doctors.id`
4. **prescriptions.patient_id** → `patients.id`
5. **prescriptions.doctor_id** → `doctors.id`
6. **bills.patient_id** → `patients.id`
7. **transactions.patient_id** → `patients.id`

### Business Logic Relationships
- One **Patient** can have many **Appointments**
- One **Doctor** can have many **Appointments**
- One **Appointment** results in one **Prescription**
- One **Patient** can have many **Bills**
- One **Bill** can have many **Transactions**

---

## 📝 TypeScript Interfaces

```typescript
// Complete TypeScript interfaces from supabase_interfaces.ts
export interface Patient {
  id: string;
  patient_id: string;
  prefix: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
  blood_group: string;
  notes: string;
  date_of_entry: string;
  created_by: string;
  updated_at: string;
  is_active: boolean;
  hospital_id: string;
  // ... 20+ more fields
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  fee: number;
  consultation_fee: number;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 🔧 API Usage Examples

### 1. Fetch All Patients
```javascript
const response = await fetch('https://plkbxjedbjpmbfrekmrr.supabase.co/rest/v1/patients?select=*&order=patient_id', {
  headers: {
    'apikey': 'YOUR_SUPABASE_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_KEY'
  }
});
```

### 2. Create New Patient
```javascript
const newPatient = {
  patient_id: 'P000002',  // Auto-generate this
  first_name: 'John',
  last_name: 'Doe',
  age: 30,
  gender: 'MALE',
  phone: '9876543210',
  email: 'john@example.com',
  address: 'Mumbai',
  blood_group: 'O+',
  is_active: true
};

const response = await fetch('https://plkbxjedbjpmbfrekmrr.supabase.co/rest/v1/patients', {
  method: 'POST',
  headers: {
    'apikey': 'YOUR_SUPABASE_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_KEY',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(newPatient)
});
```

### 3. Search Patients by Phone
```javascript
const phone = '9089786756';
const response = await fetch(`https://plkbxjedbjpmbfrekmrr.supabase.co/rest/v1/patients?phone=eq.${phone}&select=*`, {
  headers: {
    'apikey': 'YOUR_SUPABASE_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_KEY'
  }
});
```

### 4. Get Active Doctors by Department
```javascript
const department = 'General';
const response = await fetch(`https://plkbxjedbjpmbfrekmrr.supabase.co/rest/v1/doctors?department=eq.${department}&is_active=eq.true&select=*`, {
  headers: {
    'apikey': 'YOUR_SUPABASE_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_KEY'
  }
});
```

### 5. Update Patient Record
```javascript
const patientId = 'b00afa82-c9ed-4baf-9e59-d16fc2f63a96';
const updates = {
  phone: '9999999999',
  updated_at: new Date().toISOString()
};

const response = await fetch(`https://plkbxjedbjpmbfrekmrr.supabase.co/rest/v1/patients?id=eq.${patientId}`, {
  method: 'PATCH',
  headers: {
    'apikey': 'YOUR_SUPABASE_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updates)
});
```

### 6. Delete (Soft Delete) Patient
```javascript
const patientId = 'b00afa82-c9ed-4baf-9e59-d16fc2f63a96';
const response = await fetch(`https://plkbxjedbjpmbfrekmrr.supabase.co/rest/v1/patients?id=eq.${patientId}`, {
  method: 'PATCH',
  headers: {
    'apikey': 'YOUR_SUPABASE_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_active: false,
    updated_at: new Date().toISOString()
  })
});
```

---

## 🏥 Business Logic & Workflows

### Patient Registration Flow
1. **Check for duplicates** by phone/email
2. **Generate patient_id** (P000001 format)
3. **Create patient record** with mandatory fields
4. **Assign to hospital/department** if applicable
5. **Create initial visit/appointment**

### Doctor Consultation Flow
1. **Patient checks in** (queue management)
2. **Vitals recorded** by nurse
3. **Doctor consultation** with history taking
4. **Diagnosis & prescription**
5. **Billing & payment**
6. **Follow-up scheduling**

### Appointment Management
1. **Doctor schedule** configuration
2. **Slot availability** checking
3. **Appointment booking** (new/follow-up)
4. **Reminders** (SMS/WhatsApp)
5. **Queue management** for walk-ins

---

## 📊 Common Queries for Claude CLI

### 1. Get Today's Active Patients
```sql
SELECT * FROM patients 
WHERE is_active = true 
AND date_of_entry::date = CURRENT_DATE
ORDER BY patient_id;
```

### 2. Find Doctors by Specialization
```sql
SELECT * FROM doctors 
WHERE department = 'Cardiology' 
AND is_active = true
ORDER BY name;
```

### 3. Search Patients with Filters
```sql
SELECT * FROM patients 
WHERE 
  (first_name ILIKE '%john%' OR last_name ILIKE '%john%')
  AND gender = 'MALE'
  AND age BETWEEN 20 AND 40
  AND is_active = true
LIMIT 10;
```

### 4. Get Patient Count by Blood Group
```sql
SELECT blood_group, COUNT(*) as patient_count
FROM patients
WHERE is_active = true
GROUP BY blood_group
ORDER BY patient_count DESC;
```

### 5. Department-wise Doctor Count
```sql
SELECT department, COUNT(*) as doctor_count
FROM doctors
WHERE is_active = true
GROUP BY department
ORDER BY doctor_count DESC;
```

---

## 🚀 Claude CLI Integration Patterns

### Pattern 1: CRUD Operations
```typescript
// Claude CLI should generate functions like:
async function createPatient(data: Partial<Patient>): Promise<Patient>
async function getPatientById(id: string): Promise<Patient>
async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient>
async function searchPatients(filters: PatientFilters): Promise<Patient[]>
```

### Pattern 2: Business Logic Functions
```typescript
// Medical-specific functions
async function registerNewPatient(patientData: NewPatientData): Promise<RegistrationResult>
async function scheduleAppointment(patientId: string, doctorId: string, date: Date): Promise<Appointment>
async function generatePrescription(consultationData: ConsultationData): Promise<Prescription>
async function processPayment(patientId: string, amount: number, method: string): Promise<Transaction>
```

### Pattern 3: Validation Rules
```typescript
// Data validation for Claude CLI to enforce
const patientValidationRules = {
  phone: { required: true, pattern: /^[6-9]\d{9}$/, minLength: 10, maxLength: 10 },
  email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  age: { required: true, min: 0, max: 120 },
  blood_group: { enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] }
};
```

---

## 🔒 Security & Compliance

### Row Level Security (RLS)
- All tables should have RLS enabled
- Policies based on user roles (admin, doctor, reception)
- Patients can only access their own data
- Doctors can access their patients' data

### Data Privacy (DPDP 2023)
- Patient consent management required
- Data encryption at rest and in transit
- Audit trails for all data access
- Right to erasure implementation

### Medical Compliance
- ABDM integration for ABHA IDs
- HIPAA compliance for US standards
- IT Act 2000 for digital records
- Clinical data retention policies

---

## 📈 Performance Optimization

### Indexing Strategy
```sql
-- Essential indexes for performance
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_is_active ON patients(is_active);
CREATE INDEX idx_doctors_department ON doctors(department, is_active);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
```

### Query Optimization
- Use `select=` to limit returned columns
- Add `limit=` for pagination
- Use `order=` for consistent sorting
- Implement caching for frequent queries

---

## 🐛 Common Issues & Solutions

### Issue 1: "Table doesn't exist"
**Solution**: Check if RLS is blocking access. Use service role key for admin operations.

### Issue 2: "Duplicate patient_id"
**Solution**: Implement atomic increment for patient_id generation.

### Issue 3: "Missing required fields"
**Solution**: Validate all required fields before insert/update.

### Issue 4: "Performance slow with large data"
**Solution**: Add appropriate indexes and implement pagination.

---

## 🎯 Next Steps for Development

### Phase 1: Core CRUD (Week 1)
- Complete patient management
- Doctor schedule management
- Basic appointment system

### Phase 2: Medical Workflows (Week 2-3)
- Consultation module
- Prescription system
- Billing integration

### Phase 3: Advanced Features (Week 4)
- Queue management
- Reporting & analytics
- Mobile app integration

### Phase 4: Compliance (Week 5)
- ABDM integration
- DPDP compliance
- Audit trails

---

## 📞 Support & Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [React + Supabase Examples](https://github.com/supabase/examples-js)

### Tools
- **Supabase Studio**: Web-based database management
- **pgAdmin**: Advanced PostgreSQL administration
- **TablePlus**: Desktop database client

### Testing
- Use Supabase's built-in API testing
- Implement unit tests for business logic
- Load testing for performance validation

---

## ✅ Checklist for Claude CLI Implementation

- [ ] Database connection established
- [ ] TypeScript interfaces imported
- [ ] CRUD operations implemented
- [ ] Business logic validated
- [ ] Error handling in place
- [ ] Performance optimized
- [ ] Security policies applied
- [ ] Testing completed
- [ ] Documentation updated

---

**Last Updated**: February 21, 2026  
**Version**: