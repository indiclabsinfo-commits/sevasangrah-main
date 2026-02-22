# SevaSangraha HMS - OPD Features Documentation

**Version**: 3.1.0
**Date**: 22 February 2026
**Prepared For**: Client Deployment & Testing
**System**: SevaSangraha - Advanced Healthcare Management System

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Patient Registration](#2-patient-registration)
3. [UHID Generation & Configuration](#3-uhid-generation--configuration)
4. [Doctor Console](#4-doctor-console)
5. [OPD Queue Management](#5-opd-queue-management)
6. [Queue Display Screen](#6-queue-display-screen)
7. [Waiting Hall Display](#7-waiting-hall-display)
8. [Appointment Scheduling](#8-appointment-scheduling)
9. [Teleconsult Appointments](#9-teleconsult-appointments)
10. [Patient Search & History](#10-patient-search--history)
11. [Digital Medical Records](#11-digital-medical-records)
12. [Medical Certificate Generation](#12-medical-certificate-generation)
13. [Document Upload System](#13-document-upload-system)
14. [Episode of Care](#14-episode-of-care)
15. [Prescription System](#15-prescription-system)
16. [Discharge Summary](#16-discharge-summary)
17. [Notification System (SMS/WhatsApp)](#17-notification-system-smswhatsapp)
18. [OTP Verification](#18-otp-verification)
19. [OPD Reports & MIS Dashboard](#19-opd-reports--mis-dashboard)
20. [Referral Management](#20-referral-management)
21. [Billing Section](#21-billing-section)
22. [Pharmacy Module](#22-pharmacy-module)
23. [Patient Photo Upload](#23-patient-photo-upload)
24. [Self-Registration Kiosk](#24-self-registration-kiosk)
25. [External Appointment Capture](#25-external-appointment-capture)
26. [Print Schedule](#26-print-schedule)
27. [Duplicate Patient Detection](#27-duplicate-patient-detection)

---

## 1. System Overview

### Architecture
SevaSangraha HMS is a full-stack hospital management system built with:

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Backend | Express.js + TypeScript (Port 3002) |
| Database | PostgreSQL (via Supabase, migrating to local PostgreSQL) |
| Charts | Recharts |
| Icons | Lucide React |
| PDF Export | jsPDF, html2canvas |

### Access Roles
| Role | Access Level |
|------|-------------|
| Admin | Full access to all modules |
| Doctor | Doctor Console, Medical Records, Prescriptions, Certificates |
| Receptionist | Patient Registration, Queue Management, Appointments |
| Billing Staff | Billing, Refunds, Expenses |

### Navigation
All features are accessible from the left sidebar. Admin users see all tabs; other roles see only permitted tabs based on their role.

---

## 2. Patient Registration

### What It Does
Registers new patients with comprehensive demographics, contact details, insurance information, medical history, and assigns them to doctors/departments.

### How It Works
1. User clicks "New Patient" tab in the sidebar
2. Fills in a flexible multi-section form:
   - **Personal Info**: Prefix, First Name, Last Name, Gender, Date of Birth, Age (auto-calculated), Blood Group
   - **Contact**: Phone Number, Email, Address
   - **Identification**: Aadhaar Number, ABHA ID, RGHS Number
   - **Medical History**: Allergies, Current Medications, Past Medical History
   - **Emergency Contact**: Name, Phone
   - **Assignment**: Doctor, Department, Patient Tag (Regular/VIP/Emergency)
   - **Reference Tracking**: Whether patient was referred, referral details
3. On submit, the system:
   - Generates a unique Patient ID (format: P000001)
   - Generates a UHID via the backend API (format: HMS-2026-0001)
   - Saves patient record to `patients` table
   - Shows success toast with Patient ID

### Database Tables
| Table | Purpose |
|-------|---------|
| `patients` | Stores all patient demographics, contact, medical history |
| `uhid_config` | UHID format configuration and current sequence |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Admin or Receptionist | Sidebar shows "New Patient" tab |
| 2 | Click "New Patient" | Registration form loads |
| 3 | Fill in: First Name = "Test", Last Name = "Patient", Gender = "Male", Age = 30, Phone = "9876543210" | Fields accept input, age auto-calculates from DOB |
| 4 | Click "Register Patient" | Success toast appears with Patient ID (e.g., P000031) |
| 5 | Go to "Patient List" | New patient appears at top of list |
| 6 | Check the UHID column | UHID should show format like "HMS-2026-0001" (if backend is running) |

### Logic Flow
```
User fills form --> Validate required fields --> Generate Patient ID (sequential)
--> Call backend POST /api/uhid/next for UHID --> Insert into patients table
--> Return success with Patient ID and UHID
```

---

## 3. UHID Generation & Configuration

### What It Does
UHID (Unique Hospital Identification) provides a configurable, hospital-specific ID format for every patient. Admins can configure the format via the UHID Config panel.

### How It Works
1. Admin navigates to "UHID Config" tab in sidebar
2. Configures:
   - **Prefix**: Hospital code (default: "HMS")
   - **Separator**: Character between parts (default: "-")
   - **Include Year**: Toggle year in UHID
   - **Year Format**: "YYYY" (2026) or "YY" (26)
   - **Sequence Digits**: Number of digits (default: 4, e.g., 0001)
3. Live preview updates as settings change (e.g., `HMS-2026-0001`)
4. Save persists to database; next patient registration uses updated format

### Database Tables
| Table | Purpose |
|-------|---------|
| `uhid_config` | Stores prefix, separator, year settings, current sequence number |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Admin | Sidebar shows "UHID Config" tab |
| 2 | Click "UHID Config" | Config panel loads with current settings |
| 3 | Change prefix to "SVS" | Live preview updates to "SVS-2026-0001" |
| 4 | Change separator to "/" | Preview updates to "SVS/2026/0001" |
| 5 | Toggle "Include Year" off | Preview updates to "SVS/0001" |
| 6 | Click "Save Configuration" | Success toast, settings saved |
| 7 | Register a new patient | New patient gets UHID in the configured format |

### Logic Flow
```
Admin saves config --> PUT /api/uhid/config --> Updates uhid_config table
Patient registers --> POST /api/uhid/next --> Reads config, increments sequence
--> Returns formatted UHID (e.g., "SVS-2026-0002") --> Saved on patient record
```

---

## 4. Doctor Console

### What It Does
The Doctor Console is the primary workspace for doctors. It shows the patient queue on the left and a multi-tab consultation workspace on the right. Doctors can record complaints, examination findings, diagnoses, prescriptions, follow-ups, generate certificates, upload documents, and manage episodes of care.

### How It Works
1. Doctor logs in and is auto-redirected to the Doctor Console
2. Left panel shows "Today's Queue" with tabs: All, Waiting, Vitals, Active
3. Doctor clicks on a patient to start consultation (status changes to "In Consultation")
4. Right panel shows 8 consultation tabs:

| Tab | Purpose |
|-----|---------|
| **Complaints** | Record chief complaints with duration, severity, onset |
| **Examination** | Record physical examination findings, vitals |
| **Diagnosis** | Search ICD-10 codes, set primary/secondary diagnoses with severity |
| **Prescription** | Add medications with dosage, frequency, duration, instructions |
| **Follow-up** | Schedule follow-up dates with notes |
| **Certificates** | Generate medical/fitness/disability certificates |
| **Documents** | Upload and manage patient documents (lab reports, imaging, etc.) |
| **Episodes** | View/create episodes of care linking multiple visits |

5. Auto-save drafts every 3 seconds when changes are detected
6. "Save Draft" button for manual save
7. "Complete & Close" finalizes the consultation

### Database Tables
| Table | Purpose |
|-------|---------|
| `opd_consultations` | Stores consultation records (complaints, exam, diagnosis, treatment) |
| `opd_queue` | Queue entries with status tracking |
| `patients` | Patient demographics |
| `users` | Doctor information (FK for opd_consultations.doctor_id) |
| `doctors` | Doctor profiles for queue filtering |
| `medical_certificates` | Generated certificates |
| `document_uploads` | Uploaded patient documents |
| `episodes_of_care` | Episode tracking records |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as a Doctor (role = DOCTOR) | Auto-redirected to Doctor Console |
| 2 | View left panel | Today's queue visible with patient list |
| 3 | Click a "Waiting" patient | Status changes to "In Consultation", consultation workspace opens |
| 4 | Click "Complaints" tab, type "Fever for 3 days" | Text entered, green dot appears on tab (has content) |
| 5 | Click "Examination" tab, record vitals | Vitals saved |
| 6 | Click "Diagnosis" tab, search "A00" | ICD-10 codes appear, select "A00 - Cholera" |
| 7 | Click "Prescription" tab, add medication | Medication added to prescription list |
| 8 | Click "Follow-up" tab, set date | Follow-up date saved |
| 9 | Click "Save Draft" | Toast: "Consultation saved" |
| 10 | Click "Complete & Close" | Consultation marked as COMPLETED, patient removed from active queue |
| 11 | Click "Certificates" tab | Certificate generator loads with patient info pre-filled |
| 12 | Click "Documents" tab | Document uploader loads for this patient |
| 13 | Click "Episodes" tab | Episode timeline loads for this patient |

### Logic Flow
```
Doctor selects patient --> Queue status = IN_CONSULTATION
--> Doctor fills tabs (auto-save every 3s) --> Creates opd_consultation record
--> Doctor clicks Complete --> Status = COMPLETED, queue entry marked done
```

---

## 5. OPD Queue Management

### What It Does
Manages the entire OPD patient flow from waiting to consultation to completion. Supports doctor filtering, vitals recording, walk-in registration, voice announcements, and TAT (Turn Around Time) monitoring.

### How It Works
1. Patients enter queue when registered or added as walk-ins
2. Queue shows status: Waiting --> In Consultation --> Completed
3. Staff can:
   - Filter by doctor and status
   - Record vitals before consultation
   - Add walk-in patients directly
   - Call patients with voice announcement (ElevenLabs TTS)
   - Start consultation forms
   - Monitor Turn Around Time (TAT)
4. Queue auto-refreshes every 3 seconds

### Database Tables
| Table | Purpose |
|-------|---------|
| `opd_queue` | Queue entries with token number, status, timestamps |
| `patient_vitals` | Vital sign recordings (temp, BP, pulse, O2, RR) |
| `patients` | Patient demographics |
| `users` | Doctor assignments |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Admin/Receptionist | "OPD Queue" tab visible in sidebar |
| 2 | Click "OPD Queue" | Queue manager loads with today's patients |
| 3 | Click "Add Walk-in" | Walk-in form opens, fill and submit |
| 4 | New patient appears in queue | Status = "Waiting", token number assigned |
| 5 | Click "Record Vitals" on a patient | Vitals modal opens (temperature, BP, pulse) |
| 6 | Fill vitals and save | Vitals saved, patient status shows vitals recorded |
| 7 | Click "Call Patient" | Voice announcement plays (if configured) |
| 8 | Filter by specific doctor | Only that doctor's patients shown |
| 9 | Filter by "In Consultation" | Only active consultations shown |
| 10 | Check TAT display | Shows average wait time and consultation time |

### Logic Flow
```
Patient registered --> Added to opd_queue (status: WAITING)
--> Vitals recorded --> Status: VITALS_DONE
--> Doctor selects patient --> Status: IN_CONSULTATION
--> Consultation complete --> Status: COMPLETED
--> TAT calculated from timestamps
```

---

## 6. Queue Display Screen

### What It Does
A display screen for reception/waiting area showing the patient queue with voice announcement capability. Staff can call patients and update their queue status.

### How It Works
1. Shows patient list with token numbers and status
2. Doctor filter dropdown to focus on specific doctor's queue
3. "Call Next" triggers a voice announcement
4. Status updates: Waiting -> Called -> In Consultation -> Completed

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open "Queue Display" tab | Display loads with today's queue |
| 2 | Select a doctor from dropdown | Queue filters to selected doctor's patients |
| 3 | Click "Call Next" on a waiting patient | Voice announcement plays, status changes to "Called" |
| 4 | Click "Start Consultation" | Status changes to "In Consultation" |

---

## 7. Waiting Hall Display

### What It Does
A public-facing TV display for waiting halls showing currently serving patients, upcoming tokens, doctor availability, and estimated wait times. Auto-refreshes every 10 seconds.

### How It Works
1. Full-screen display designed for wall-mounted TV/monitor
2. Shows real-time clock with blinking indicator
3. Three sections:
   - **Currently Serving**: Top 3 patients currently in consultation
   - **Upcoming Tokens**: Next 5 waiting patients
   - **Doctor Availability**: All doctors with their current status (available/in consultation)
4. Auto-refreshes from opd_queue every 10 seconds

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open "Waiting Hall" tab | Full-screen display loads |
| 2 | Check "Currently Serving" section | Shows patients currently in consultation |
| 3 | Check "Upcoming" section | Shows next patients waiting |
| 4 | Check "Doctor Availability" | All active doctors shown with status |
| 5 | Wait 10 seconds | Display auto-refreshes |
| 6 | On another screen, move a patient to "In Consultation" | Waiting Hall display updates within 10 seconds |

---

## 8. Appointment Scheduling

### What It Does
Schedule future appointments for patients with specific doctors, departments, dates, and time slots. Supports both physical and teleconsult appointment types.

### How It Works
1. Search and select a patient
2. Choose doctor and department
3. Select date and time slot
4. Choose appointment type (Physical/Teleconsult)
5. Add reason for visit
6. Submit creates appointment record

### Database Tables
| Table | Purpose |
|-------|---------|
| `appointments` | All appointment records with date, time, doctor, status |
| `patients` | Patient reference |
| `users` | Doctor reference |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to appointment scheduling | Scheduling form loads |
| 2 | Search for a patient | Patient suggestions appear |
| 3 | Select doctor and department | Time slots load for selected date |
| 4 | Select date and time | Slot highlighted |
| 5 | Choose "Physical" appointment type | Type selected |
| 6 | Click "Schedule" | Success toast, appointment created |
| 7 | Check Doctor's Print Schedule | New appointment visible |

---

## 9. Teleconsult Appointments

### What It Does
Schedule and manage video consultations via Google Meet, Zoom, or WhatsApp. Generates meeting links and tracks teleconsult history.

### How It Works
1. Three tabs: Upcoming, Schedule New, History
2. **Upcoming**: Shows scheduled teleconsults with "Join" links
3. **Schedule New**:
   - Search and select patient
   - Select doctor
   - Choose consultation mode (Google Meet / Zoom / WhatsApp / Physical)
   - Set date and time
   - Join URL auto-generated or manually entered
4. **History**: Completed teleconsults with stats

### Database Tables
| Table | Purpose |
|-------|---------|
| `appointments` | Appointment records with `consultation_mode` field |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Teleconsult" tab in sidebar | Teleconsult page loads |
| 2 | Click "Schedule New" tab | Scheduling form appears |
| 3 | Search and select patient | Patient selected |
| 4 | Select doctor, date, time | Fields populated |
| 5 | Select "Google Meet" as mode | Mode selected, URL field appears |
| 6 | Enter a Google Meet URL | URL saved |
| 7 | Click "Schedule Appointment" | Success toast, appointment created |
| 8 | Go to "Upcoming" tab | New teleconsult visible with "Join" link |
| 9 | Click "Copy Link" | Meet URL copied to clipboard |

---

## 10. Patient Search & History

### What It Does
Search across all patients by name, phone, Patient ID, or UHID. View patient details, transaction history, medical records, and perform actions like print receipts, edit, or view history.

### How It Works
1. Patient List shows all patients with sorting and date filtering
2. Search bar supports: name, phone number, Patient ID, UHID
3. Each patient row shows: Name, Patient ID, Phone, Age/Gender, Date, Amount
4. Action buttons per patient:
   - View History (opens history modal with consultations, vitals, prescriptions)
   - Edit Patient (modify demographics)
   - Print Receipt
   - Generate Prescription
   - Add to Queue
5. Date range filter to find patients by registration date

### Database Tables
| Table | Purpose |
|-------|---------|
| `patients` | Patient master records |
| `patient_transactions` | Financial transactions per patient |
| `opd_consultations` | Consultation history |
| `patient_vitals` | Vitals history |
| `patient_enhanced_prescription` | Prescription records |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Patient List" tab | List of all patients loads |
| 2 | Type "Test" in search bar | Patients with "Test" in name shown |
| 3 | Search by phone "9876543210" | Matching patient(s) shown |
| 4 | Click patient row | Patient detail/actions visible |
| 5 | Click "View History" | History modal opens with consultations, vitals, prescriptions |
| 6 | Click "Edit" | Edit form opens, make changes, save |
| 7 | Click "Print Receipt" | Receipt modal opens, print option available |
| 8 | Set date range filter | Only patients registered in that range shown |

---

## 11. Digital Medical Records

### What It Does
Centralized view of all patient medical records including consultations, vitals history, and prescriptions. Allows searching patients and viewing their complete medical history.

### How It Works
1. Search bar for patient lookup (name or UHID, minimum 2 characters)
2. Three record tabs:
   - **Consultations**: Shows all OPD consultations with doctor, complaints, exam, diagnosis, treatment
   - **Vitals History**: Charts of temperature, blood pressure, pulse, O2 saturation over time
   - **Prescriptions**: All prescribed medications with dosage and instructions
3. Expandable consultation cards show full details
4. Add new consultation record with form

### Database Tables
| Table | Purpose |
|-------|---------|
| `patients` | Patient lookup |
| `opd_consultations` | Consultation records |
| `patient_vitals` | Vital measurements over time |
| `patient_enhanced_prescription` | Prescription history |
| `doctors` | Doctor information |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Medical Records" tab | Medical records page loads |
| 2 | Search for a patient (e.g., "amountcheck") | Patient found, records loaded |
| 3 | Click "Consultations" tab | All consultations listed with dates |
| 4 | Expand a consultation | Full details: complaints, exam, diagnosis, treatment |
| 5 | Click "Vitals History" tab | Vitals chart displayed with date range |
| 6 | Click "Prescriptions" tab | All prescriptions listed |
| 7 | Click "Add Record" | New consultation form opens |

---

## 12. Medical Certificate Generation

### What It Does
Generate medical certificates (sick leave, fitness, disability) for patients directly from the Doctor Console. Certificates are saved to the database and can be downloaded as PDF.

### How It Works
1. Accessed from the "Certificates" tab in Doctor Console during patient consultation
2. Patient info and current diagnosis auto-filled from consultation
3. Select certificate type:
   - **Sick Leave**: Start date, end date, duration, diagnosis, restrictions
   - **Fitness**: Cleared for activity, any limitations
   - **Disability**: Disability percentage, nature, recommendations
4. Generate saves to database via `POST /api/certificates`
5. Download triggers PDF generation via `GET /api/certificates/:id/pdf`

### Database Tables
| Table | Purpose |
|-------|---------|
| `medical_certificates` | Certificate records with type, dates, content, PDF path |
| `patients` | Patient reference |
| `users` | Doctor reference |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Doctor, open a patient consultation | Doctor Console with patient loaded |
| 2 | Click "Certificates" tab | Certificate generator loads with patient info |
| 3 | Select "Sick Leave" type | Sick leave form appears |
| 4 | Fill: Start Date, End Date, Diagnosis = "Viral Fever" | Duration auto-calculated |
| 5 | Click "Generate Certificate" | Success toast, certificate saved to DB |
| 6 | Click "Download PDF" | PDF downloads with hospital letterhead, patient details, doctor signature |

### Logic Flow
```
Doctor fills certificate form --> POST /api/certificates (saves to DB)
--> Certificate ID returned --> GET /api/certificates/:id/pdf
--> Backend generates PDF with jsPDF --> Returns PDF for download
```

---

## 13. Document Upload System

### What It Does
Upload, manage, and download patient documents (lab reports, prescriptions, imaging, insurance, etc.) with type tagging and drag-and-drop support.

### How It Works
1. Accessed from "Documents" tab in Doctor Console during consultation
2. Select document type from dropdown (Lab Report, Prescription, Imaging, Insurance, etc.)
3. Optionally add a description
4. Drag-and-drop or click to browse files
5. Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV (max 10MB)
6. Uploaded files stored in `server/uploads/documents/`
7. Document list shows: File name, Type, Size, Date, Download/Delete actions

### Database Tables
| Table | Purpose |
|-------|---------|
| `document_uploads` | File records with patient_id, type, path, size, mime_type |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Doctor Console, select a patient | Consultation workspace loads |
| 2 | Click "Documents" tab | Document uploader loads, shows existing documents |
| 3 | Select type = "Lab Report" | Type selected |
| 4 | Add description = "Blood Test Results" | Description entered |
| 5 | Drag a PDF file onto the drop zone | Upload spinner shows, then file appears in list |
| 6 | Check document list | New document shows with name, type = "Lab Report", size, date |
| 7 | Click download icon | File downloads in browser |
| 8 | Click delete icon | Confirm dialog, then document removed |

---

## 14. Episode of Care

### What It Does
Groups related patient visits, consultations, prescriptions, and records into "Episodes of Care" (e.g., an episode for "Diabetes Management" linking multiple OPD visits).

### How It Works
1. Accessed from "Episodes" tab in Doctor Console during consultation
2. Shows visual timeline of all episodes for the current patient
3. Each episode card shows:
   - Episode type (OPD Visit, IPD Admission, Emergency, Chronic Care, Surgical)
   - Start/end dates
   - Department and primary diagnosis
   - Status (Active, Resolved, Ongoing)
   - Linked records
4. Create new episode with form:
   - Type, start date, department, primary diagnosis, doctor, notes
5. Close episodes when treatment concludes

### Database Tables
| Table | Purpose |
|-------|---------|
| `episodes_of_care` | Episode master records |
| `episode_records` | Links episodes to consultations, prescriptions, etc. |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Doctor Console, select a patient | Consultation workspace loads |
| 2 | Click "Episodes" tab | Episode timeline loads for this patient |
| 3 | Click "Create New Episode" | Episode form expands |
| 4 | Fill: Type = "Chronic Care", Diagnosis = "Type 2 Diabetes", Department = "General Medicine" | Fields populated |
| 5 | Click "Create Episode" | Success toast, new episode appears in timeline |
| 6 | View episode card | Shows type, dates, diagnosis, status = "Active" |
| 7 | Click "Close Episode" | Episode status changes to "Resolved", end date set |

---

## 15. Prescription System

### What It Does
Write and manage prescriptions during consultations. Supports medication search, dosage configuration, frequency, duration, and special instructions.

### How It Works
1. Accessed from "Prescription" tab in Doctor Console
2. Search and add medications
3. For each medication:
   - Dosage (e.g., 500mg)
   - Frequency (OD, BD, TDS, QID, SOS, etc.)
   - Duration (days/weeks/months)
   - Route (Oral, IV, IM, Topical, etc.)
   - Special instructions (Before food, After food, etc.)
4. Print prescription in hospital-branded format
5. Multiple prescription templates available (Sevasangraha, VH format)

### Database Tables
| Table | Purpose |
|-------|---------|
| `patient_enhanced_prescription` | Prescription records with medication details |
| `opd_consultations` | Links prescription to consultation |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In Doctor Console, click "Prescription" tab | Prescription writer loads |
| 2 | Type medication name (e.g., "Paracetamol") | Suggestions appear |
| 3 | Select medication, set dose = "500mg", freq = "TDS", duration = "5 days" | Medication added to prescription |
| 4 | Add 2-3 more medications | All appear in prescription list |
| 5 | Click "Print Prescription" | Print preview opens with formatted prescription |
| 6 | Save consultation | Prescription saved to database |

---

## 16. Discharge Summary

### What It Does
Manage patient discharges with comprehensive discharge summaries including diagnosis, medications at discharge, follow-up instructions, and clinical documentation. Supports 12 types of clinical forms.

### How It Works
1. Shows list of discharged patients (searchable, sortable)
2. Filter by discharge date (All/Today/Week/Month)
3. Each patient has:
   - Discharge Summary (diagnosis, medications, follow-up instructions)
   - Clinical Documentation (12 form types):
     - IPD Consent Form
     - Clinical Record
     - Doctor Progress Sheet
     - Vital Charts
     - Intake/Output Form
     - Medication Chart
     - Care Plan
     - Pre/Post-Operative Orders
     - Physiotherapy Notes
     - Blood Transfusion Monitoring
4. Export to Excel available

### Database Tables
| Table | Purpose |
|-------|---------|
| `patient_admissions` | Admission/discharge records |
| `discharge_summaries` | Discharge details |
| `beds` | Bed release on discharge |
| `patient_high_risk`, `patient_chief_complaints`, `patient_examination`, `patient_investigation`, `patient_diagnosis`, `patient_enhanced_prescription` | Clinical documentation |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Discharge" tab in sidebar | Discharge section loads |
| 2 | View discharged patients list | All discharged patients shown |
| 3 | Search by patient name | Filtered results appear |
| 4 | Filter by "This Week" | Only recent discharges shown |
| 5 | Click on a patient | Discharge summary modal opens |
| 6 | View/Edit discharge summary | Diagnosis, medications, follow-up instructions shown |
| 7 | Click "Export Excel" | Excel file downloads with discharge data |

---

## 17. Notification System (SMS/WhatsApp)

### What It Does
Send SMS and WhatsApp notifications to patients for appointments, follow-ups, payments, lab results, and custom messages. Includes template management, notification history, and delivery analytics.

### How It Works
1. **Templates Tab**: Pre-configured message templates with variables (patient_name, date, doctor, amount)
2. **Send Tab**:
   - Select channel (SMS/WhatsApp/Email)
   - Select category (Appointment/Follow-up/Payment/Lab/Emergency)
   - Choose template or write custom message
   - Enter recipient phone number
   - Preview message with variable substitution
   - Send notification
3. **History Tab**: All sent notifications with status (Pending/Sent/Delivered/Failed)
4. **Analytics Tab**: Delivery rates, channel breakdown, cost tracking

### Backend Integration
- SMS: Twilio API (server-side only, keys never exposed to frontend)
- WhatsApp: WhatsApp Business API (server-side)
- Both run in **MOCK mode** when API keys are not configured (safe for testing)

### Database Tables
| Table | Purpose |
|-------|---------|
| `notification_templates` | Message templates with variables |
| `notification_logs` | All notification history with status |
| `sms_logs` | SMS-specific delivery logs |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Notifications" tab in sidebar | Notification system loads |
| 2 | Check connection status indicator | Green = backend connected, Yellow = offline mode |
| 3 | View Templates tab | Pre-loaded templates shown (appointment confirmation, follow-up, payment) |
| 4 | Click "Send Notification" | Send form opens |
| 5 | Select channel = "SMS", category = "Appointment" | Template options filtered |
| 6 | Select a template | Message preview with variables |
| 7 | Enter phone number and send | In MOCK mode: notification logged but not actually sent; toast shows success |
| 8 | Check History tab | New notification appears with status |

### Logic Flow
```
User composes notification --> POST /api/notifications/send
--> Backend checks if Twilio/WhatsApp keys configured
--> If configured: sends real message via API
--> If not configured: logs in MOCK mode (no actual delivery)
--> Saves to notification_logs with status
```

---

## 18. OTP Verification

### What It Does
Phone-based OTP (One Time Password) verification for patient identity. Sends a 6-digit code via SMS and validates it.

### How It Works
1. Enter patient's phone number
2. Click "Send OTP" -> 6-digit code sent via SMS
3. Auto-focus input for 6 digits
4. Auto-submits when all 6 digits entered
5. 60-second countdown timer for resend
6. OTP expires after 5 minutes
7. Max 3 attempts before lockout

### Database Tables
| Table | Purpose |
|-------|---------|
| `otp_verifications` | OTP codes with phone, purpose, expiry, attempts |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | OTP component triggered (e.g., during patient verification) | OTP form appears |
| 2 | Phone number displayed | Correct phone number shown |
| 3 | Click "Send OTP" | Toast: "OTP sent", countdown timer starts (60s) |
| 4 | Enter 6-digit code | Auto-submits after 6th digit |
| 5 | Enter correct code | Success: green checkmark, "Verified" message |
| 6 | Enter wrong code | Error: "Invalid OTP", attempt counter increments |
| 7 | Wait 60 seconds | "Resend OTP" button becomes active |

---

## 19. OPD Reports & MIS Dashboard

### What It Does
Comprehensive analytics dashboard for OPD operations with 4 report types: Daily, Monthly Trends, MIS Overview, and Doctor-wise Performance.

### How It Works
1. **Daily Reports Tab**:
   - Date picker for specific day
   - Cards: Total Patients, Revenue, Average Revenue per Patient, Consultations
   - Bar chart: Patients by department
   - Pie chart: Patient type distribution
2. **Monthly Trends Tab**:
   - Month/year selector
   - Line chart: Daily patient count trend
   - Bar chart: Revenue trend
   - Summary statistics
3. **MIS Overview Tab**:
   - Hospital-wide KPIs
   - Department-wise comparison
   - Revenue analysis
   - Queue efficiency metrics
4. **Doctor-wise Tab**:
   - Table: Doctor name, patients seen, revenue generated, average consultation time
   - Performance ranking
   - Department breakdown

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/reports/opd/daily?date=YYYY-MM-DD` | Daily OPD statistics |
| `GET /api/reports/opd/monthly?month=MM&year=YYYY` | Monthly trends |
| `GET /api/reports/mis/overview` | Management information summary |
| `GET /api/reports/mis/doctor-wise` | Per-doctor performance metrics |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "OPD Reports" tab in sidebar | Reports dashboard loads |
| 2 | Click "Daily" tab, select today's date | Daily stats load with patient count, revenue |
| 3 | View bar chart | Department-wise patient distribution shown |
| 4 | Click "Monthly" tab, select current month | Monthly trend charts load |
| 5 | Click "MIS Overview" tab | Hospital-wide KPIs displayed |
| 6 | Click "Doctor-wise" tab | Doctor performance table loads |
| 7 | Verify numbers match Patient List counts | Numbers should be consistent |

---

## 20. Referral Management

### What It Does
Manage patient referrals both within the hospital (internal) and to external facilities. Track referral status from creation to completion.

### How It Works
1. **Create Referral Tab**:
   - Search and select patient
   - Choose referral type (Internal/External)
   - Select target doctor and department
   - Set priority (Routine/Urgent/Emergency)
   - Add clinical summary and notes
2. **Referral List Tab**:
   - All referrals with status badges (Pending/Accepted/Rejected/Completed)
   - Search and filter by status and type
3. **Track Tab**:
   - Follow-up on referral status
   - Schedule referral appointments

### Database Tables
| Table | Purpose |
|-------|---------|
| `referrals` | Referral records with type, priority, status |
| `doctors` | Target doctor information |
| `departments` | Department options |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Referral Management" tab | Referral system loads |
| 2 | Click "Create Referral" | Referral form opens |
| 3 | Search and select patient | Patient selected |
| 4 | Set type = "Internal", Priority = "Urgent" | Type and priority set |
| 5 | Select target doctor and department | Doctor/department selected |
| 6 | Add clinical summary | Text entered |
| 7 | Click "Create Referral" | Success toast, referral created |
| 8 | Click "Referral List" tab | New referral shows with "Pending" status |
| 9 | Update status to "Accepted" | Status badge changes |

---

## 21. Billing Section

### What It Does
Comprehensive billing for OPD and IPD patients. Shows revenue dashboard, deposit tracking, and supports IPD billing, combined billing, and financial summaries.

### How It Works
1. **Dashboard Cards**: Total Revenue, Total Deposits, Total Bills, Pending Amount
2. **Patient List**: Searchable list with financial summary per patient
3. **IPD Billing**: Service-wise charges for admitted patients
4. **Combined Billing**: Merge OPD + IPD charges into single bill
5. **Deposit Management**: Track deposits, advances, and balance

### Database Tables
| Table | Purpose |
|-------|---------|
| `patients` | Patient records |
| `patient_transactions` | All financial transactions (deposits, payments, charges) |
| `patient_admissions` | IPD admission for billing reference |
| `ipd_bills` | IPD service charges |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Billing" tab | Billing dashboard loads |
| 2 | View summary cards | Revenue, deposits, bills shown |
| 3 | Search for a patient | Patient financial history shown |
| 4 | Click on a patient | Detailed transaction history |
| 5 | View deposit history | All deposits listed with dates |

---

## 22. Pharmacy Module

### What It Does
Complete pharmacy management with inventory tracking, billing, purchase orders, and reporting. Tracks stock levels, expiry dates, batch numbers, and supports GST-compliant billing.

### How It Works
1. **Dashboard**: 7 metric cards (Total Medicines, Low Stock, Expiring Soon, Pending Orders, Today's Dispenses, Revenue, Alerts)
2. **Inventory**: Medicine list with stock, batch, expiry, reorder levels
3. **Billing**: Create pharmacy bills with item-level discounts and GST
4. **Orders**: Purchase orders to vendors with urgency levels
5. **Reports**: Sales, stock, expiry, and financial reports
6. **Settings**: Pharmacy configuration

### Database Tables
| Table | Purpose |
|-------|---------|
| `medicines` | Medicine master data |
| `pharmacy_inventory` | Stock with batch numbers, expiry dates, selling prices |
| `pharmacy_bills` | Pharmacy transaction records with GST |
| `pharmacy_orders` | Purchase orders |
| `pharmacy_inventory_transactions` | Stock movement audit |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Pharmacy" tab | Pharmacy dashboard loads |
| 2 | View dashboard cards | Stock count, low stock alerts, expiry warnings visible |
| 3 | Click "Inventory" | Medicine list with stock levels |
| 4 | Click "Billing" | Create pharmacy bill with medicines, quantities, discounts |
| 5 | Click "Orders" | View/create purchase orders |
| 6 | Click "Reports" | Sales and stock reports |

---

## 23. Patient Photo Upload

### What It Does
Capture patient photos via webcam or file upload. Photos are uploaded to the server filesystem and linked to the patient record.

### How It Works
1. Available in patient registration and profile editing
2. Two capture methods:
   - **Webcam**: Open camera, capture, preview, confirm
   - **File Upload**: Browse and select image file
3. Images resized to max 800x800 pixels for storage efficiency
4. Uploaded to server: `POST /api/patients/:id/photo`
5. Stored in `server/uploads/photos/`
6. Falls back to DataURL storage if backend is unavailable

### Database Tables
| Table | Purpose |
|-------|---------|
| `patients` (photo_url column) | Stores URL/path to patient photo |

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open patient registration or edit form | Photo upload area visible |
| 2 | Click "Camera" button | Webcam opens with preview |
| 3 | Click "Capture" | Photo captured, preview shown |
| 4 | Click "Confirm" | Photo uploaded to server |
| 5 | Alternatively, click "Upload" and select a JPG | Photo uploaded |
| 6 | Reload the patient profile | Photo loads from server URL |

---

## 24. Self-Registration Kiosk

### What It Does
Patient-facing self-service registration terminal for hospitals with kiosks. Multi-step form with Aadhaar scanning, biometric capture, and payment integration.

### How It Works
1. Full-screen kiosk interface (5 steps):
   - **Step 1 - Personal Info**: Name, Gender, DOB, Phone, Email
   - **Step 2 - Address**: Address, City, State, Pincode
   - **Step 3 - Identification**: Aadhaar Number, PAN (with QR scan option)
   - **Step 4 - Emergency Contact**: Name, Phone, Relationship
   - **Step 5 - Medical Info**: Blood Group, Known Allergies, Current Conditions
2. Biometric capture: Photo and fingerprint
3. Payment method selection (Cash/Card/UPI/Net Banking)
4. Registration token generated on completion

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Self Registration" tab | Kiosk interface loads in full-screen mode |
| 2 | Fill Step 1: Name, Gender, DOB, Phone | Next button activates |
| 3 | Click "Next" through all 5 steps | Each step validates before advancing |
| 4 | Complete all steps | Registration summary shown |
| 5 | Confirm registration | Token number generated |

---

## 25. External Appointment Capture

### What It Does
Synchronize appointments from external booking platforms (Practo, Lybrate, 1mg, Hospital Website, WhatsApp) into the hospital system.

### How It Works
1. **Sync Dashboard**: Shows connection status with each external platform
2. **Pending Appointments**: Lists unsynced appointments from external sources
3. **Approve/Reject**: Staff reviews and approves external bookings
4. **Duplicate Detection**: Identifies potential duplicate entries
5. **Sync Logs**: Audit trail of all sync operations

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "External Appointments" tab | External capture interface loads |
| 2 | View integration dashboard | Connection status for each platform shown |
| 3 | Click "Sync" for a platform | Sync operation runs, appointments fetched |
| 4 | View pending appointments | External bookings listed with source |
| 5 | Approve an appointment | Appointment moves to confirmed list |
| 6 | View sync logs | Audit trail with timestamps and record counts |

---

## 26. Print Schedule

### What It Does
Print and export doctor schedules with date range, department, and doctor filtering. Supports PDF export and direct printing.

### How It Works
1. Select date range (default: today + 7 days)
2. Filter by department and/or doctor
3. Schedule grouped by doctor and date
4. Each entry shows: Time, Patient, Type, Status, Mode (Physical/Teleconsult)
5. Print in portrait or landscape format
6. Export as PDF

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Print Schedule" tab | Schedule view loads |
| 2 | Set date range | Appointments in range loaded |
| 3 | Filter by a specific doctor | Only that doctor's schedule shown |
| 4 | Click "Print" | Print dialog opens with formatted schedule |
| 5 | Click "Export PDF" | PDF downloads with schedule |
| 6 | Verify appointments match | Schedule matches appointment data |

---

## 27. Duplicate Patient Detection

### What It Does
Automatically checks for duplicate patients during registration by matching phone number and UHID to prevent duplicate records.

### How It Works
1. During patient registration, when phone number is entered:
   - System queries `patients` table for matching phone
   - If match found, warning displayed: "A patient with this phone number already exists"
   - Shows existing patient details for comparison
2. UHID uniqueness enforced at database level (unique constraint)
3. Staff can choose to:
   - Continue with new registration (different person, same phone)
   - View existing patient record
   - Cancel registration

### How to Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to "New Patient" | Registration form loads |
| 2 | Enter phone number of an existing patient | Warning: "Patient with this phone already exists" |
| 3 | View the existing patient details | Name, age, gender shown for verification |
| 4 | Enter a new phone number | No warning shown |
| 5 | Register with a duplicate phone (intentionally) | Registration succeeds (phone not unique, just a warning) |

---

## Appendix A: Backend API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patients/:id/photo` | Upload patient photo |
| GET | `/api/patients/:id/photo` | Get patient photo |

### UHID
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/uhid/config` | Get UHID configuration |
| PUT | `/api/uhid/config` | Update UHID configuration |
| POST | `/api/uhid/next` | Generate next UHID |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/certificates` | Create medical certificate |
| GET | `/api/certificates/:id` | Get certificate details |
| GET | `/api/certificates/:id/pdf` | Download certificate PDF |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send` | Send notification |
| GET | `/api/notifications/logs` | Get notification history |
| GET | `/api/notifications/stats` | Get delivery analytics |
| GET | `/api/notifications/templates` | List templates |
| POST | `/api/notifications/templates` | Create template |

### SMS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sms/send` | Send SMS |
| GET | `/api/sms/logs` | Get SMS logs |

### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/send` | Send WhatsApp message |
| POST | `/api/whatsapp/send-reminder` | Send appointment reminder |

### OTP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/send` | Send OTP code |
| POST | `/api/otp/verify` | Verify OTP code |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads` | Upload document |
| GET | `/api/uploads?patient_id=X` | List patient documents |
| GET | `/api/uploads/:id/download` | Download document |
| DELETE | `/api/uploads/:id` | Delete document |

### Episodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/episodes?patient_id=X` | List patient episodes |
| POST | `/api/episodes` | Create episode |
| PUT | `/api/episodes/:id` | Update episode |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/opd/daily` | Daily OPD statistics |
| GET | `/api/reports/opd/monthly` | Monthly trends |
| GET | `/api/reports/mis/overview` | MIS overview |
| GET | `/api/reports/mis/doctor-wise` | Doctor-wise performance |

---

## Appendix B: Database Schema Summary

### Core Tables
| Table | Description | Key Fields |
|-------|------------|------------|
| `patients` | Patient master | id, patient_id, uhid, first_name, last_name, phone, age, gender |
| `users` | System users (doctors, admin, staff) | id, email, first_name, role |
| `doctors` | Doctor profiles | id, name, department, specialization, is_active |
| `appointments` | All appointments | id, patient_id, doctor_id, date, time, status, consultation_mode |
| `opd_queue` | Queue management | id, patient_id, doctor_id, token_number, queue_status |
| `opd_consultations` | Consultation records | id, patient_id, doctor_id, chief_complaints, diagnosis, status |

### Clinical Tables
| Table | Description |
|-------|------------|
| `patient_vitals` | Vital signs (temp, BP, pulse, O2, RR, weight, height) |
| `patient_enhanced_prescription` | Prescriptions with medication details |
| `patient_high_risk` | Risk factors and allergies |
| `patient_chief_complaints` | Chief complaint records |
| `patient_examination` | Physical examination findings |
| `patient_investigation` | Lab and imaging results |
| `patient_diagnosis` | Diagnosis records |
| `discharge_summaries` | Discharge details |
| `medical_certificates` | Generated certificates |
| `document_uploads` | Uploaded patient documents |
| `episodes_of_care` | Episode grouping records |
| `episode_records` | Records linked to episodes |

### Communication Tables
| Table | Description |
|-------|------------|
| `notification_templates` | Message templates |
| `notification_logs` | All notification history |
| `sms_logs` | SMS delivery logs |
| `otp_verifications` | OTP codes with expiry |

### Financial Tables
| Table | Description |
|-------|------------|
| `patient_transactions` | All financial transactions |
| `patient_admissions` | IPD admissions |
| `ipd_bills` | IPD service charges |

### Pharmacy Tables
| Table | Description |
|-------|------------|
| `medicines` | Medicine master |
| `pharmacy_inventory` | Stock with batch/expiry |
| `pharmacy_bills` | Pharmacy transactions |
| `pharmacy_orders` | Purchase orders |

### Configuration Tables
| Table | Description |
|-------|------------|
| `uhid_config` | UHID format configuration |
| `referrals` | Patient referral records |
| `beds` | Bed allocation |

---

## Appendix C: Running the System

### Development Mode
```bash
# Terminal 1: Start backend
cd server
npm install
npm run dev
# Backend runs on http://localhost:3002

# Terminal 2: Start frontend
cd core-hms
npm install
npm run dev
# Frontend runs on http://localhost:5173
# API calls proxy to localhost:3002
```

### Production Mode (Client's Local Server)
```bash
# Build frontend
npm run build

# Start backend (serves both API + frontend)
cd server
npm run build
NODE_ENV=production node dist/index.js
# Everything runs on http://localhost:3002
```

### Health Check
```bash
curl http://localhost:3002/api/health
# Expected: {"status":"ok","database":"connected","sms":"mock","whatsapp":"mock"}
```

---

*Document generated for SevaSangraha HMS v3.1.0*
*Total OPD Features Documented: 27*
