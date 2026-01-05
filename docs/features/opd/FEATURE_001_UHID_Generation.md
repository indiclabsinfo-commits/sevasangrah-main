# Feature: UHID (Unique Hospital ID) Generation System

**Feature ID**: FEATURE_001
**Module**: OPD Registration
**Priority**: P0 (Critical - NABH Requirement)
**Status**: Not Started
**Assigned To**: Development Team
**Estimated Effort**: 3 days
**NABH Compliance**: Yes (Mandatory for patient identification)

---

## 1. Overview

### 1.1 Feature Description
UHID (Unique Hospital ID) is a permanent, unique identification number assigned to each patient during their first registration at the hospital. This ID remains constant throughout the patient's lifetime relationship with the hospital, enabling seamless tracking across multiple visits, departments, and services.

### 1.2 Business Value
- **NABH Compliance**: Mandatory requirement for NABH accreditation
- **Patient Safety**: Eliminates patient misidentification errors
- **Data Integrity**: Ensures single patient record across all hospital systems
- **Operational Efficiency**: Quick patient lookup and retrieval
- **Analytics**: Enables accurate patient visit tracking and analytics

### 1.3 User Personas
- **Primary Users**: Frontdesk staff, Registration clerks
- **Secondary Users**: Doctors, Nurses, Lab technicians, Billing staff

---

## 2. Business Requirements

### 2.1 Functional Requirements
- [ ] Generate unique UHID automatically during first patient registration
- [ ] UHID format: Configurable prefix + sequential number (e.g., MH2024001234)
- [ ] UHID should be human-readable and pronounceable for phone communication
- [ ] UHID must be prominently displayed on all patient documents
- [ ] System must prevent duplicate UHID generation
- [ ] Support UHID search with autocomplete functionality
- [ ] Display UHID on patient card/wristband format for printing
- [ ] Maintain UHID even if patient details are updated
- [ ] Support UHID barcode/QR code generation for scanning
- [ ] Validate UHID format during manual entry

### 2.2 Non-Functional Requirements
- **Performance**: UHID generation must complete within 500ms
- **Security**: UHID should not contain PII (Personally Identifiable Information)
- **Scalability**: Support millions of unique IDs (10+ digits)
- **Reliability**: 100% uniqueness guarantee through database constraints
- **Usability**: UHID should be easy to read and communicate verbally
- **Compliance**: Meet NABH patient identification standards

### 2.3 Acceptance Criteria
- [ ] Each patient receives exactly one UHID that never changes
- [ ] UHID is displayed on patient registration form, bills, prescriptions, reports
- [ ] Frontdesk staff can search patients by UHID within 1 second
- [ ] UHID format follows hospital's configured pattern
- [ ] System prevents creation of duplicate patients with same UHID
- [ ] UHID is included in all API responses for patient data
- [ ] QR code containing UHID can be scanned to pull up patient record

---

## 3. Technical Specification

### 3.1 Database Schema

```sql
-- Add UHID column to patients table
ALTER TABLE patients
ADD COLUMN uhid VARCHAR(20) UNIQUE NOT NULL,
ADD CONSTRAINT uhid_format_check CHECK (uhid ~ '^[A-Z]{2}[0-9]{10,12}$');

-- Create index for fast UHID lookups
CREATE INDEX idx_patients_uhid ON patients(uhid);

-- Create sequence for UHID generation
CREATE SEQUENCE uhid_sequence
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 999999999999
  CACHE 20;

-- Create UHID configuration table
CREATE TABLE uhid_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_prefix VARCHAR(10) NOT NULL DEFAULT 'MH', -- Magnus Hospital
  current_year CHAR(4) NOT NULL,
  sequence_length INTEGER NOT NULL DEFAULT 6,
  include_year BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO uhid_config (hospital_prefix, current_year, sequence_length, include_year)
VALUES ('MH', EXTRACT(YEAR FROM NOW())::TEXT, 6, true);

-- Create function to generate UHID
CREATE OR REPLACE FUNCTION generate_uhid()
RETURNS VARCHAR(20) AS $$
DECLARE
  config RECORD;
  next_seq BIGINT;
  new_uhid VARCHAR(20);
BEGIN
  -- Get configuration
  SELECT * INTO config FROM uhid_config ORDER BY created_at DESC LIMIT 1;

  -- Get next sequence number
  next_seq := nextval('uhid_sequence');

  -- Generate UHID based on configuration
  IF config.include_year THEN
    new_uhid := config.hospital_prefix || config.current_year || LPAD(next_seq::TEXT, config.sequence_length, '0');
  ELSE
    new_uhid := config.hospital_prefix || LPAD(next_seq::TEXT, config.sequence_length, '0');
  END IF;

  RETURN new_uhid;
END;
$$ LANGUAGE plpgsql;
```

### 3.2 API Endpoints

#### Endpoint 1: Generate UHID (Internal)
```
Method: POST
Path: /api/uhid/generate
Authentication: Required (Internal use only)
Request Body:
{
  "purpose": "patient_registration"
}
Response:
{
  "status": "success",
  "data": {
    "uhid": "MH2024000001",
    "format": "MH-YYYY-NNNNNN",
    "generatedAt": "2024-12-24T10:30:00Z"
  }
}
```

#### Endpoint 2: Validate UHID
```
Method: POST
Path: /api/uhid/validate
Authentication: Required
Request Body:
{
  "uhid": "MH2024000001"
}
Response:
{
  "status": "success",
  "data": {
    "isValid": true,
    "exists": true,
    "patientId": "uuid-here"
  }
}
```

#### Endpoint 3: Search by UHID
```
Method: GET
Path: /api/patients/search?uhid=MH2024000001
Authentication: Required
Response:
{
  "status": "success",
  "data": {
    "patient": {
      "id": "uuid",
      "uhid": "MH2024000001",
      "firstName": "John",
      "lastName": "Doe",
      // ... other patient fields
    }
  }
}
```

#### Endpoint 4: Get UHID Configuration
```
Method: GET
Path: /api/uhid/config
Authentication: Required (Admin only)
Response:
{
  "status": "success",
  "data": {
    "hospitalPrefix": "MH",
    "currentYear": "2024",
    "sequenceLength": 6,
    "includeYear": true,
    "format": "MH-YYYY-NNNNNN",
    "nextUhid": "MH2024000042"
  }
}
```

### 3.3 Frontend Components

**File Structure**:
```
src/
├── components/
│   └── OPD/
│       ├── UHIDDisplay.tsx          # Display UHID prominently
│       ├── UHIDSearchBar.tsx        # Search patients by UHID
│       ├── UHIDCard.tsx             # Printable UHID card
│       └── UHIDQRCode.tsx           # QR code generation
├── pages/
│   └── OPD/
│       └── PatientRegistration.tsx   # Modified to include UHID
├── services/
│   └── uhidService.ts                # UHID API calls
└── types/
    └── uhid.ts                        # UHID TypeScript types
```

**Key Components**:
- `UHIDDisplay`: Shows UHID prominently on patient profile/forms (large font, copyable)
- `UHIDSearchBar`: Autocomplete search bar with UHID format hints
- `UHIDCard`: Printable card with UHID, patient name, QR code
- `UHIDQRCode`: Generates QR code containing UHID for scanning

### 3.4 State Management
- **Global State**: Current UHID configuration (Zustand store)
- **Local State**: UHID search query, validation status
- **API Cache**: Patient lookup by UHID (React Query with 5min cache)

### 3.5 Validation Rules
```typescript
// UHID validation schema
import { z } from 'zod';

export const uhidSchema = z.object({
  uhid: z.string()
    .regex(/^[A-Z]{2}\d{10,12}$/, 'Invalid UHID format')
    .min(12)
    .max(14)
});

export const uhidConfigSchema = z.object({
  hospitalPrefix: z.string().length(2).regex(/^[A-Z]{2}$/),
  currentYear: z.string().length(4).regex(/^\d{4}$/),
  sequenceLength: z.number().min(4).max(10),
  includeYear: z.boolean()
});
```

### 3.6 Error Handling
- **User Errors**:
  - "UHID format invalid" - Show format hint
  - "Patient not found with UHID" - Suggest registration
- **System Errors**:
  - "UHID generation failed" - Retry with exponential backoff
  - "Duplicate UHID detected" - Alert admin, regenerate
- **Edge Cases**:
  - Year rollover - Auto-update configuration
  - Sequence exhaustion - Alert admin before reaching limit

---

## 4. User Interface

### 4.1 UHID Display Locations

**Patient Registration Form**:
```
┌─────────────────────────────────────────┐
│ Patient Registration                     │
├─────────────────────────────────────────┤
│                                          │
│ UHID: MH2024000001  [📋 Copy] [🖨️ Print]│
│       ▲                                  │
│       └─ Large, bold, prominent          │
│                                          │
│ First Name: [___________]                │
│ Last Name:  [___________]                │
│ ...                                      │
└─────────────────────────────────────────┘
```

**Patient Search Bar**:
```
┌─────────────────────────────────────────┐
│ 🔍 Search by UHID, Name, or Phone       │
│    [MH2024____________________________] │
│                                          │
│    Suggestions:                          │
│    • MH2024000001 - John Doe             │
│    • MH2024000023 - Jane Smith           │
└─────────────────────────────────────────┘
```

**Printable UHID Card** (3.5" x 2" format):
```
┌──────────────────────────┐
│  MAGNUS HOSPITAL         │
│                          │
│  [QR CODE]  UHID:        │
│             MH2024000001 │
│                          │
│  Name: John Doe          │
│  DOB: 01/01/1990         │
│  Blood: O+               │
└──────────────────────────┘
```

### 4.2 User Flow

**First-Time Patient Registration**:
1. Frontdesk clicks "New Patient" button
2. System auto-generates UHID: MH2024000042
3. UHID is displayed prominently at top of registration form
4. Staff enters patient demographics
5. On save, UHID is permanently associated with patient
6. System prints UHID card for patient to keep

**Returning Patient Lookup**:
1. Patient provides UHID card (MH2024000001)
2. Frontdesk enters UHID in search bar
3. System retrieves patient record within 1 second
4. Patient details auto-populate for appointment/billing
5. Visit count increments automatically

### 4.3 Responsive Design
- **Desktop**: UHID shown in large font (24px) at top-right of patient forms
- **Tablet**: UHID shown in header with copy button
- **Mobile**: UHID prominently displayed, tap to copy

---

## 5. User Guide

### 5.1 How to Access
Navigate to: **OPD → Patient Registration**
Required Permission: `create_patients`

### 5.2 Step-by-Step Instructions

#### Task 1: Register New Patient with UHID
1. Click **"New Patient"** button
2. System automatically generates UHID (e.g., MH2024000042)
3. UHID is displayed at the top of the form - verify it's correct
4. Enter patient demographics (Name, Age, Gender, Phone, etc.)
5. Click **"Save Patient"**
6. System confirms: "Patient registered successfully with UHID MH2024000042"
7. Click **"Print UHID Card"** to give patient their ID card

#### Task 2: Search Patient by UHID
1. In the search bar, type the UHID (e.g., MH2024000001)
2. System auto-suggests matching patients as you type
3. Select patient from suggestions or press Enter
4. Patient record opens with full details

#### Task 3: Print UHID Card for Existing Patient
1. Search and open patient record
2. Click **"Print UHID Card"** button
3. Preview card with UHID, QR code, and basic details
4. Click **"Print"** to print physical card

### 5.3 Common Scenarios

- **Scenario 1: Patient Lost UHID Card**
  - Search patient by name or phone
  - Open patient record
  - UHID is displayed at top
  - Click "Print UHID Card" to issue new card

- **Scenario 2: UHID Not Readable**
  - Use QR code scanner to scan patient's card
  - System automatically pulls up patient record
  - Verify UHID matches patient details

### 5.4 Troubleshooting

- **Issue: "UHID generation failed"**
  - Solution: Refresh page and try again. If persists, contact IT support.

- **Issue: "Duplicate UHID detected"**
  - Solution: System will auto-regenerate. This should never happen if database constraints are in place.

---

## 6. Testing

### 6.1 Unit Tests
- [ ] Test UHID generation function returns valid format
- [ ] Test UHID uniqueness constraint prevents duplicates
- [ ] Test UHID validation regex accepts valid UHIDs
- [ ] Test UHID validation regex rejects invalid formats
- [ ] Test year rollover updates configuration automatically

### 6.2 Integration Tests
- [ ] Test patient registration creates patient with UHID
- [ ] Test UHID search returns correct patient
- [ ] Test UHID appears in all patient-related API responses
- [ ] Test UHID is included in bill generation
- [ ] Test QR code scanning retrieves correct patient

### 6.3 E2E Tests
- [ ] Register new patient and verify UHID is generated
- [ ] Search patient by UHID and verify details load
- [ ] Print UHID card and verify format
- [ ] Scan QR code and verify patient lookup works

### 6.4 Test Data
```json
{
  "testPatients": [
    {
      "uhid": "MH2024000001",
      "firstName": "Test",
      "lastName": "Patient One",
      "phone": "9999999991"
    },
    {
      "uhid": "MH2024000002",
      "firstName": "Test",
      "lastName": "Patient Two",
      "phone": "9999999992"
    }
  ]
}
```

### 6.5 Testing Checklist for Mr. Farooq
- [ ] Login with test credentials for OPD module
- [ ] Register 5 new patients and verify each gets unique UHID
- [ ] Verify UHID format follows pattern: MH2024XXXXXX
- [ ] Search patients by UHID and verify quick retrieval (<1 sec)
- [ ] Print UHID card and verify QR code scans correctly
- [ ] Verify UHID appears on appointment slip, prescription, bill
- [ ] Verify UHID cannot be edited or changed manually
- [ ] Test mobile responsiveness of UHID display

---

## 7. Deployment

### 7.1 Environment Variables
```env
# UHID Configuration
UHID_HOSPITAL_PREFIX=MH
UHID_INCLUDE_YEAR=true
UHID_SEQUENCE_LENGTH=6
```

### 7.2 Database Migrations
```bash
# Run migration script
psql -h sevasangraha.postgres.database.azure.com -U divyansh04 -d postgres -f docs/database/migration_scripts/001_add_uhid_system.sql
```

### 7.3 Deployment Steps
1. Backup current patients table
2. Run database migration to add UHID column and functions
3. Generate UHIDs for existing patients (backfill script)
4. Deploy backend API changes
5. Deploy frontend changes
6. Test UHID generation with test patient
7. Monitor logs for any UHID generation errors

### 7.4 Rollback Plan
1. Revert frontend deployment
2. Revert backend deployment
3. Drop UHID column and functions (data loss acceptable if caught early)
4. Restore from backup if needed

---

## 8. Dependencies

### 8.1 Technical Dependencies
- **NPM Packages**:
  - `qrcode.react` - QR code generation
  - `react-to-print` - Printing UHID cards
- **APIs**: PostgreSQL sequence generation
- **Services**: None (fully internal)

### 8.2 Feature Dependencies
- **Prerequisite Features**:
  - Patient registration system must exist
- **Related Features**:
  - FEATURE_002: Queue Management (uses UHID for token generation)
  - FEATURE_007: ABHA Integration (links UHID to ABHA ID)

---

## 9. Security & Permissions

### 9.1 Role-Based Access
- **Admin**: Can view/configure UHID settings, regenerate UHIDs
- **Doctor**: Can view UHID, search by UHID (read-only)
- **Nurse**: Can view UHID, search by UHID (read-only)
- **Frontdesk**: Can view UHID, search by UHID, print UHID cards
- **Accountant**: Can view UHID for billing purposes

### 9.2 Data Protection
- **PII/PHI**: UHID itself is not PII (doesn't contain patient info)
- **Encryption**: UHID transmitted over HTTPS
- **Audit Trail**: Log all UHID generation events with timestamp and user

---

## 10. Screenshots

### Before Implementation
Currently, patients use `patient_id` field which is not standardized or human-readable.

### After Implementation
![UHID Display Screenshot - To be added]
![UHID Card Print Preview - To be added]
![UHID Search - To be added]

---

## 11. Related Features

- **FEATURE_002**: Queue Management System - Uses UHID for token generation
- **FEATURE_007**: ABHA Integration - Links UHID to national health ID
- **FEATURE_015**: Patient Record Merging - Uses UHID as primary identifier

---

## 12. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-24 | 1.0 | Development Team | Initial documentation created |

---

## 13. Known Issues

- [ ] None yet - feature not implemented

---

## 14. Future Enhancements

- [ ] Support multiple hospital branches with different prefixes (MH-Branch1, MH-Branch2)
- [ ] Integration with national patient registry for cross-hospital UHID
- [ ] UHID card with NFC/RFID chip for tap-to-retrieve patient data
- [ ] Mobile app for patients to access their UHID digitally

---

## 15. References

- **NABH Standards**: NABH 5th Edition - Patient Identification Standard (PCC.7)
- **Medical Guidelines**: MCI guidelines on patient record management
- **External Documentation**:
  - ABHA ID integration guidelines
  - QR code standard for healthcare (ISO/IEC 18004)
- **Meeting Notes**: Magnus Hospital kickoff meeting - UHID requirement discussion

---

**Last Updated**: 2024-12-24
**Reviewed By**: Pending
**Approved By**: Pending
