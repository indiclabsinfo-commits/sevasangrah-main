# PRD: Magnus Hospital NABH-Compliant HMS

## Introduction

Complete implementation of the Magnus Hospital Management System (HMS) with NABH compliance. This PRD covers all 15 modules with 288 remaining features. The system uses React 19, TypeScript, Vite, and Supabase (PostgreSQL) backend.

**Current Status:** 27/315 features complete (8.5%)
**Target:** 100% feature completion across all modules
**Primary Tester:** Farooq (client representative)
**Approach:** Minimal viable implementation - get features working first
**Database:** Supabase only (current setup)

---

## Goals

- Complete all 15 modules to production-ready state
- Achieve NABH compliance for hospital accreditation
- Enable Farooq to test and approve each module before production deployment
- Maintain existing functionality while adding new features
- Ensure all features work with Supabase backend

---

## Module 1: OPD Management (14 remaining features)

### US-001: UHID Generation System
**Description:** As a front desk operator, I want automatic UHID generation so that each patient has a unique hospital identifier.

**Acceptance Criteria:**
- [ ] Generate unique UHID in format: MH-YYYY-XXXXXX (e.g., MH-2026-000001)
- [ ] Auto-increment sequence stored in database
- [ ] Display UHID prominently on patient registration form
- [ ] UHID visible on all patient-related screens
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Aadhaar Integration
**Description:** As a front desk operator, I want to capture Aadhaar number so that patient identity is verified.

**Acceptance Criteria:**
- [ ] Add Aadhaar number field (12 digits) to patient registration
- [ ] Validate Aadhaar format (12 digits, Verhoeff checksum)
- [ ] Store Aadhaar securely (masked display: XXXX-XXXX-1234)
- [ ] Optional field - not mandatory for registration
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: ABHA Number Creation
**Description:** As a front desk operator, I want to create ABHA numbers for patients so that they can access digital health records.

**Acceptance Criteria:**
- [ ] Add "Create ABHA" button on patient profile
- [ ] Integrate with ABHA sandbox API for development
- [ ] Store ABHA number in patient record
- [ ] Display ABHA status (Created/Pending/Not Created)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: ABHA Linking to Patient
**Description:** As a front desk operator, I want to link existing ABHA numbers to patient records.

**Acceptance Criteria:**
- [ ] Add "Link ABHA" field for patients with existing ABHA
- [ ] Validate ABHA number format (14 digits or PHR address)
- [ ] Store linked ABHA in patient record
- [ ] Show link status on patient profile
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Health Record Fetch from ABDM
**Description:** As a doctor, I want to fetch patient health records from ABDM so that I can see their medical history.

**Acceptance Criteria:**
- [ ] Add "Fetch ABDM Records" button on patient profile
- [ ] Request patient consent before fetching
- [ ] Display fetched records in read-only view
- [ ] Handle API errors gracefully
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Patient Consent Management
**Description:** As a patient, I want to manage consent for sharing my health records.

**Acceptance Criteria:**
- [ ] Create consent request form
- [ ] Store consent status in database
- [ ] Show active consents on patient profile
- [ ] Allow consent revocation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Registration to Consultation TAT Tracking
**Description:** As hospital management, I want to track time from registration to consultation so that we meet NABH standards.

**Acceptance Criteria:**
- [ ] Capture registration timestamp automatically
- [ ] Capture consultation start timestamp when doctor begins
- [ ] Calculate TAT in minutes
- [ ] Display TAT on queue management screen
- [ ] Alert if TAT exceeds 30 minutes (configurable threshold)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Consultation to Billing TAT Tracking
**Description:** As hospital management, I want to track time from consultation end to billing so that we monitor efficiency.

**Acceptance Criteria:**
- [ ] Capture consultation end timestamp
- [ ] Capture billing completion timestamp
- [ ] Calculate and display TAT
- [ ] Store TAT data for reporting
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: TAT Reports and Alerts
**Description:** As hospital management, I want TAT reports so that I can identify bottlenecks.

**Acceptance Criteria:**
- [ ] Daily TAT summary report
- [ ] Average TAT by doctor/department
- [ ] TAT breach alerts (email/dashboard notification)
- [ ] Export TAT data to Excel
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: ICD-10 Code Integration
**Description:** As a doctor, I want to add ICD-10 codes to diagnoses for standardized coding.

**Acceptance Criteria:**
- [ ] Searchable ICD-10 code lookup field
- [ ] Auto-suggest codes based on diagnosis text
- [ ] Store ICD-10 code with diagnosis
- [ ] Display code on patient record and reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Examination Templates
**Description:** As a doctor, I want examination templates so that I can quickly document common findings.

**Acceptance Criteria:**
- [ ] Create template management screen
- [ ] Pre-built templates for common examinations
- [ ] Doctor can create custom templates
- [ ] One-click template application
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Drug Interaction Warnings
**Description:** As a doctor, I want drug interaction warnings so that I prescribe safely.

**Acceptance Criteria:**
- [ ] Check prescribed drugs against interaction database
- [ ] Display warning popup for major interactions
- [ ] Allow doctor to override with reason
- [ ] Log all overrides for audit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Allergy Alerts
**Description:** As a doctor, I want allergy alerts so that I don't prescribe contraindicated drugs.

**Acceptance Criteria:**
- [ ] Check prescription against patient allergy list
- [ ] Display prominent alert for matches
- [ ] Block prescription until acknowledged
- [ ] Log all alerts for audit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Prescription Templates
**Description:** As a doctor, I want prescription templates for common conditions.

**Acceptance Criteria:**
- [ ] Template management screen
- [ ] Pre-built templates for common conditions
- [ ] Doctor can create/edit own templates
- [ ] One-click template application to prescription
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-015: Appointment Reminders
**Description:** As a patient, I want appointment reminders so that I don't miss my appointments.

**Acceptance Criteria:**
- [ ] Send reminder 24 hours before appointment
- [ ] Send reminder 2 hours before appointment
- [ ] Reminder via SMS/WhatsApp (configurable)
- [ ] Track reminder delivery status
- [ ] Typecheck passes

### US-016: Recurring Appointments
**Description:** As a front desk operator, I want to schedule recurring appointments for follow-up patients.

**Acceptance Criteria:**
- [ ] Add recurrence options (weekly, bi-weekly, monthly)
- [ ] Generate all appointments in series
- [ ] Allow editing/canceling individual or all occurrences
- [ ] Show recurrence indicator on calendar
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-017: No-Show Tracking
**Description:** As hospital management, I want to track no-shows for analysis.

**Acceptance Criteria:**
- [ ] Mark appointments as "No Show" status
- [ ] Track no-show count per patient
- [ ] No-show report by date range
- [ ] Flag frequent no-show patients
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-018: Appointment Calendar View
**Description:** As a front desk operator, I want a calendar view of appointments.

**Acceptance Criteria:**
- [ ] Day/Week/Month calendar views
- [ ] Color-coded by doctor/department
- [ ] Click to view/edit appointment
- [ ] Drag-and-drop rescheduling
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-019: Internal Referrals
**Description:** As a doctor, I want to refer patients to other departments within the hospital.

**Acceptance Criteria:**
- [ ] Create referral from consultation screen
- [ ] Select target department/doctor
- [ ] Add referral notes
- [ ] Referral appears in target department queue
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-020: External Referrals
**Description:** As a doctor, I want to refer patients to external specialists.

**Acceptance Criteria:**
- [ ] Create external referral with hospital/doctor details
- [ ] Generate referral letter (PDF)
- [ ] Track referral status
- [ ] Store referral in patient history
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-021: Referral Tracking
**Description:** As hospital management, I want to track all referrals.

**Acceptance Criteria:**
- [ ] Referral list with filters (date, type, status)
- [ ] Referral status updates
- [ ] Referral analytics report
- [ ] Export referral data
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-022: WhatsApp Receipt Sending
**Description:** As a patient, I want to receive billing receipts via WhatsApp.

**Acceptance Criteria:**
- [ ] "Send via WhatsApp" button on receipt
- [ ] Generate receipt as PDF/image
- [ ] Send via WhatsApp API
- [ ] Track delivery status
- [ ] Typecheck passes

### US-023: Insurance Billing
**Description:** As a billing operator, I want to process insurance claims.

**Acceptance Criteria:**
- [ ] Capture insurance details on patient registration
- [ ] Select insurance provider during billing
- [ ] Generate insurance claim form
- [ ] Track claim status
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-024: Doctor-wise Patient Count Report
**Description:** As hospital management, I want to see patient count by doctor.

**Acceptance Criteria:**
- [ ] Report showing patients per doctor
- [ ] Filter by date range
- [ ] Compare across departments
- [ ] Export to Excel
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-025: Department-wise Revenue Report
**Description:** As hospital management, I want to see revenue by department.

**Acceptance Criteria:**
- [ ] Revenue breakdown by department
- [ ] Daily/Weekly/Monthly views
- [ ] Trend charts
- [ ] Export to Excel
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-026: Payment Mode Analysis Report
**Description:** As hospital management, I want to analyze payment modes.

**Acceptance Criteria:**
- [ ] Breakdown by Cash/Card/UPI/Insurance
- [ ] Pie chart visualization
- [ ] Trend over time
- [ ] Export to Excel
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-027: OPD Register Export
**Description:** As hospital management, I want to export OPD register for records.

**Acceptance Criteria:**
- [ ] Export OPD data to Excel
- [ ] Include all patient visits with details
- [ ] Filter by date range
- [ ] NABH-compliant format
- [ ] Typecheck passes

---

## Module 2: IPD Management (60 features)

### US-028: Initial Assessment Record
**Description:** As a doctor, I want to record initial patient assessment for IPD admission.

**Acceptance Criteria:**
- [ ] Comprehensive assessment form
- [ ] Capture vital signs, chief complaints, history
- [ ] Link to OPD record if exists
- [ ] Save and print assessment
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-029: Order Sets (Frequently Prescribed Meds)
**Description:** As a doctor, I want pre-defined order sets for common conditions.

**Acceptance Criteria:**
- [ ] Create and manage order sets
- [ ] One-click application of order set
- [ ] Customizable per doctor
- [ ] Audit trail for orders
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-030: Medication/Radiology Details
**Description:** As a doctor, I want to order medications and radiology tests.

**Acceptance Criteria:**
- [ ] Medication order form with dosage, frequency
- [ ] Radiology order form with test selection
- [ ] Orders sent to respective departments
- [ ] Track order status
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-031: Digital Signatures for Doctors
**Description:** As a doctor, I want to digitally sign orders and documents.

**Acceptance Criteria:**
- [ ] Digital signature capture/upload
- [ ] Sign orders with one click
- [ ] Signature visible on printed documents
- [ ] Signature verification
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-032: e-Prescription/CPOE for Medicines
**Description:** As a doctor, I want computerized physician order entry for medicines.

**Acceptance Criteria:**
- [ ] Electronic prescription entry
- [ ] Drug database with dosage guidance
- [ ] Automatic pharmacy notification
- [ ] Order tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-033: Lab/Diagnostic Order Sets
**Description:** As a doctor, I want to order lab tests using pre-defined sets.

**Acceptance Criteria:**
- [ ] Create lab order sets (e.g., "Admission Panel")
- [ ] One-click ordering
- [ ] Auto-routing to lab
- [ ] Result integration
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-034: Import Patient Info for Review
**Description:** As a doctor, I want to import patient info from previous visits.

**Acceptance Criteria:**
- [ ] Show previous visit summary
- [ ] Import selected data to current record
- [ ] Maintain data integrity
- [ ] Audit trail
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-035: Duplicate Order Alerts
**Description:** As a doctor, I want alerts for duplicate orders to prevent waste.

**Acceptance Criteria:**
- [ ] Check for existing active orders
- [ ] Alert if duplicate detected
- [ ] Allow override with reason
- [ ] Log all duplicates
- [ ] Typecheck passes

### US-036: Patient Access to Prescriptions
**Description:** As a patient, I want to access my prescriptions online.

**Acceptance Criteria:**
- [ ] Patient portal view of prescriptions
- [ ] Download as PDF
- [ ] Share via link/WhatsApp
- [ ] Secure access with OTP
- [ ] Typecheck passes

### US-037: Access Past Medical Records
**Description:** As a doctor, I want to access patient's past medical records.

**Acceptance Criteria:**
- [ ] Timeline view of past records
- [ ] Filter by type/date
- [ ] Quick summary view
- [ ] Full detail view
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-038: Link Records to ABHA
**Description:** As a front desk operator, I want to link patient records to ABHA.

**Acceptance Criteria:**
- [ ] Push records to ABDM
- [ ] Track sync status
- [ ] Handle sync errors
- [ ] Consent-based sharing
- [ ] Typecheck passes

### US-039: Access ABHA Records
**Description:** As a doctor, I want to access patient's ABHA records from other facilities.

**Acceptance Criteria:**
- [ ] Fetch external records with consent
- [ ] Display in integrated view
- [ ] Filter by source/type
- [ ] Download for reference
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-040: Nursing Notes
**Description:** As a nurse, I want to document nursing notes for each shift.

**Acceptance Criteria:**
- [ ] Shift-wise nursing notes entry
- [ ] Template-based entry
- [ ] Vital signs integration
- [ ] Nurse signature
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-041: Digital Handover (Shift Change)
**Description:** As a nurse, I want to hand over patient care digitally.

**Acceptance Criteria:**
- [ ] Handover checklist
- [ ] Pending tasks list
- [ ] Critical alerts highlight
- [ ] Both parties sign-off
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-042: Emergency Dept Registration
**Description:** As an emergency staff, I want quick patient registration.

**Acceptance Criteria:**
- [ ] Minimal required fields for emergency
- [ ] Auto-generate temporary ID
- [ ] Triage level capture
- [ ] Complete details later workflow
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-043: MLC Labeling
**Description:** As a doctor, I want to mark cases as Medico-Legal Case (MLC).

**Acceptance Criteria:**
- [ ] MLC checkbox on registration
- [ ] MLC register entry
- [ ] Police notification template
- [ ] MLC documents generation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-044: Ambulance Info Transmission
**Description:** As emergency staff, I want to receive patient info from ambulance.

**Acceptance Criteria:**
- [ ] Receive ambulance notification
- [ ] Pre-arrival patient info
- [ ] Prepare bed/resources
- [ ] Track ambulance ETA
- [ ] Typecheck passes

### US-045: Emergency Codes (Code Blue etc.)
**Description:** As hospital staff, I want to trigger emergency codes.

**Acceptance Criteria:**
- [ ] Quick code activation buttons
- [ ] Automatic team notification
- [ ] Code documentation
- [ ] Debrief form
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-046: ICU Admission Criteria
**Description:** As a doctor, I want ICU admission criteria checklist.

**Acceptance Criteria:**
- [ ] ICU criteria checklist form
- [ ] Auto-calculate eligibility
- [ ] Document admission decision
- [ ] Audit trail
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-047: Risk Assessment (APACHE/SOFA)
**Description:** As a doctor, I want to calculate patient risk scores.

**Acceptance Criteria:**
- [ ] APACHE II score calculator
- [ ] SOFA score calculator
- [ ] Score history tracking
- [ ] Alert on critical scores
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-048: Surgical Safety Checklist
**Description:** As an OR team, I want to complete surgical safety checklist.

**Acceptance Criteria:**
- [ ] WHO surgical safety checklist
- [ ] Three phases (Sign In, Time Out, Sign Out)
- [ ] Team member sign-offs
- [ ] Checklist printing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-049: Pre-operative Assessment
**Description:** As an anesthesiologist, I want to document pre-operative assessment.

**Acceptance Criteria:**
- [ ] Pre-op assessment form
- [ ] ASA classification
- [ ] Airway assessment
- [ ] Anesthesia plan
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-050: Patient Consent Recording
**Description:** As hospital staff, I want to record patient consents digitally.

**Acceptance Criteria:**
- [ ] Multiple consent form templates
- [ ] Digital signature capture
- [ ] Witness signature
- [ ] Consent storage and retrieval
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-051: Surgery Scheduling
**Description:** As an OR coordinator, I want to schedule surgeries.

**Acceptance Criteria:**
- [ ] OT calendar view
- [ ] Resource allocation (OT, surgeon, anesthesiologist)
- [ ] Conflict detection
- [ ] Pre-surgery checklist trigger
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-052: Surgery Timestamp Recording
**Description:** As OR staff, I want to record surgery timestamps.

**Acceptance Criteria:**
- [ ] Patient in/out times
- [ ] Incision/closure times
- [ ] Anesthesia start/end times
- [ ] Total surgery time calculation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-053: Anaesthesia Records
**Description:** As an anesthesiologist, I want to document anesthesia details.

**Acceptance Criteria:**
- [ ] Anesthesia record form
- [ ] Drug dosages and times
- [ ] Vital signs during surgery
- [ ] Post-op anesthesia note
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-054: Monitoring Device Integration
**Description:** As ICU staff, I want to integrate monitoring devices.

**Acceptance Criteria:**
- [ ] Receive data from monitors
- [ ] Auto-populate vital signs
- [ ] Alert on abnormal values
- [ ] Historical trend display
- [ ] Typecheck passes

### US-055: Patient Care Services (I/O Charts)
**Description:** As a nurse, I want to maintain intake/output charts.

**Acceptance Criteria:**
- [ ] Input tracking (IV, oral, feeds)
- [ ] Output tracking (urine, drain, etc.)
- [ ] Balance calculation
- [ ] Shift-wise summary
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-056: Intra-operative Notes
**Description:** As a surgeon, I want to document intra-operative notes.

**Acceptance Criteria:**
- [ ] Operative note template
- [ ] Procedure details
- [ ] Findings and complications
- [ ] Post-op instructions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-057: Dietary Screening
**Description:** As a dietitian, I want to screen patients for nutritional risk.

**Acceptance Criteria:**
- [ ] Nutritional screening tool
- [ ] Risk level calculation
- [ ] Auto-trigger dietitian referral
- [ ] Screening history
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-058: Therapeutic Diet Records
**Description:** As a dietitian, I want to prescribe therapeutic diets.

**Acceptance Criteria:**
- [ ] Diet order entry
- [ ] Pre-defined diet types
- [ ] Send to kitchen/F&B
- [ ] Track diet compliance
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-059: Infection Incidents (HAI)
**Description:** As infection control nurse, I want to track hospital-acquired infections.

**Acceptance Criteria:**
- [ ] HAI incident form
- [ ] Infection type classification
- [ ] Root cause analysis
- [ ] Trend reporting
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-060: Antimicrobial Usage Policy
**Description:** As infection control, I want to enforce antimicrobial stewardship.

**Acceptance Criteria:**
- [ ] Restricted antibiotic alerts
- [ ] Auto-stop orders
- [ ] Usage reporting
- [ ] Policy compliance tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-061: Sentinel Events
**Description:** As quality manager, I want to track sentinel events.

**Acceptance Criteria:**
- [ ] Sentinel event reporting form
- [ ] Immediate notification
- [ ] Root cause analysis workflow
- [ ] Corrective action tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-062: Staff Exposure Records
**Description:** As HR/Infection Control, I want to track staff exposure incidents.

**Acceptance Criteria:**
- [ ] Exposure incident form
- [ ] Follow-up tracking
- [ ] PEP documentation
- [ ] Reporting to authorities
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-063: Vulnerable Patient Identification
**Description:** As clinical staff, I want to identify vulnerable patients.

**Acceptance Criteria:**
- [ ] Vulnerability flags (fall risk, allergy, etc.)
- [ ] Visual indicators on patient records
- [ ] Special care protocols trigger
- [ ] Handover inclusion
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-064: Remote Consultations
**Description:** As a doctor, I want to conduct remote consultations.

**Acceptance Criteria:**
- [ ] Video consultation scheduling
- [ ] Video call integration
- [ ] Consultation documentation
- [ ] Prescription generation
- [ ] Typecheck passes

### US-065: Homecare Services
**Description:** As care coordinator, I want to manage homecare services.

**Acceptance Criteria:**
- [ ] Homecare referral form
- [ ] Service scheduling
- [ ] Visit documentation
- [ ] Billing integration
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-066: Rehabilitation Assessment
**Description:** As a therapist, I want to document rehabilitation assessments.

**Acceptance Criteria:**
- [ ] Rehab assessment forms
- [ ] Functional scoring
- [ ] Goal setting
- [ ] Progress tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-067: CDSS Support
**Description:** As a doctor, I want clinical decision support suggestions.

**Acceptance Criteria:**
- [ ] Evidence-based recommendations
- [ ] Drug dosing guidance
- [ ] Clinical pathway alerts
- [ ] Acknowledgment tracking
- [ ] Typecheck passes

### US-068: Critical Intervention Alerts
**Description:** As clinical staff, I want alerts for critical interventions.

**Acceptance Criteria:**
- [ ] Define critical value thresholds
- [ ] Automatic alert generation
- [ ] Escalation workflow
- [ ] Alert acknowledgment
- [ ] Typecheck passes

### US-069: Notifiable Disease Alerts
**Description:** As infection control, I want alerts for notifiable diseases.

**Acceptance Criteria:**
- [ ] Notifiable disease list
- [ ] Auto-alert on diagnosis entry
- [ ] Reporting form generation
- [ ] Authority submission tracking
- [ ] Typecheck passes

### US-070: Customized Care Plans
**Description:** As clinical staff, I want to create customized care plans.

**Acceptance Criteria:**
- [ ] Care plan templates
- [ ] Customize per patient
- [ ] Task assignment
- [ ] Progress tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-071: Bed Management System (50 beds)
**Description:** As front desk, I want to manage 50 hospital beds.

**Acceptance Criteria:**
- [ ] Visual bed map by floor/ward
- [ ] Real-time occupancy status
- [ ] Bed assignment workflow
- [ ] Housekeeping status
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-072: Room Allocation & Tracking
**Description:** As front desk, I want to allocate rooms to patients.

**Acceptance Criteria:**
- [ ] Room type selection (General, Private, ICU)
- [ ] Room availability check
- [ ] Patient-room assignment
- [ ] Room history tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-073: Patient Admission Process
**Description:** As front desk, I want a streamlined admission process.

**Acceptance Criteria:**
- [ ] Admission form with all required fields
- [ ] Doctor assignment
- [ ] Bed allocation
- [ ] Admission number generation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-074: Bed Occupancy Dashboard
**Description:** As hospital management, I want to see bed occupancy at a glance.

**Acceptance Criteria:**
- [ ] Real-time occupancy percentage
- [ ] Ward-wise breakdown
- [ ] Trend charts
- [ ] Alert on high occupancy
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-075: IPD Billing System
**Description:** As billing staff, I want to generate IPD bills.

**Acceptance Criteria:**
- [ ] Itemized billing (room, services, pharmacy)
- [ ] Daily charge calculation
- [ ] Discount application
- [ ] Insurance claim generation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-076: Deposit Management
**Description:** As billing staff, I want to manage patient deposits.

**Acceptance Criteria:**
- [ ] Collect admission deposit
- [ ] Track deposit balance
- [ ] Low balance alerts
- [ ] Deposit adjustment on discharge
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-077: Daily Charges Tracking
**Description:** As billing staff, I want to track daily charges automatically.

**Acceptance Criteria:**
- [ ] Auto-add daily room charges
- [ ] Nursing care charges
- [ ] Consumables tracking
- [ ] Daily bill preview
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-078: Discharge Process
**Description:** As clinical staff, I want a streamlined discharge process.

**Acceptance Criteria:**
- [ ] Discharge checklist
- [ ] Discharge summary generation
- [ ] Final bill trigger
- [ ] Bed release
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-079: Final Bill Generation
**Description:** As billing staff, I want to generate final discharge bill.

**Acceptance Criteria:**
- [ ] Consolidate all charges
- [ ] Apply deposits
- [ ] Generate final invoice
- [ ] Payment collection
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-080: Bed Transfer Management
**Description:** As nursing staff, I want to transfer patients between beds.

**Acceptance Criteria:**
- [ ] Transfer request workflow
- [ ] Reason documentation
- [ ] Automatic charge adjustment
- [ ] Transfer history
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-081: Nurses Daily Notes
**Description:** As a nurse, I want to document daily nursing notes.

**Acceptance Criteria:**
- [ ] Structured note template
- [ ] Vital signs integration
- [ ] Observation documentation
- [ ] Nurse signature
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-082: Vital Signs Tracking (IPD)
**Description:** As nursing staff, I want to track patient vital signs.

**Acceptance Criteria:**
- [ ] Multiple readings per day
- [ ] Trend charts
- [ ] Abnormal value alerts
- [ ] Integration with nursing notes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-083: Medication Chart
**Description:** As nursing staff, I want to maintain medication administration chart.

**Acceptance Criteria:**
- [ ] Scheduled medication display
- [ ] Administration recording
- [ ] Missed dose alerts
- [ ] PRN medication tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-084: IPD WhatsApp Notifications
**Description:** As a patient family, I want IPD updates via WhatsApp.

**Acceptance Criteria:**
- [ ] Admission confirmation
- [ ] Daily status updates
- [ ] Doctor visit notifications
- [ ] Discharge notification
- [ ] Typecheck passes

### US-085: Discharge SMS Alerts
**Description:** As a patient, I want discharge notification via SMS.

**Acceptance Criteria:**
- [ ] Discharge ready notification
- [ ] Bill summary
- [ ] Follow-up reminder
- [ ] Feedback request
- [ ] Typecheck passes

### US-086: TPA/Corporate Management
**Description:** As billing staff, I want to manage TPA and corporate patients.

**Acceptance Criteria:**
- [ ] TPA master with rates
- [ ] Corporate tie-up management
- [ ] Pre-authorization workflow
- [ ] Claim submission
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-087: IPD Reports & MIS
**Description:** As hospital management, I want IPD reports.

**Acceptance Criteria:**
- [ ] Admission/discharge reports
- [ ] Length of stay analysis
- [ ] Bed turnover report
- [ ] Revenue reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Module 3: Billing & Accounts (11 features)

### US-088: Enhanced OPD Billing
**Description:** As billing staff, I want advanced OPD billing features.

**Acceptance Criteria:**
- [ ] Service package billing
- [ ] Advance payment handling
- [ ] Credit limit management
- [ ] Bill modification with audit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-089: Enhanced IPD Billing
**Description:** As billing staff, I want advanced IPD billing features.

**Acceptance Criteria:**
- [ ] Interim billing
- [ ] Department-wise charges
- [ ] Package billing
- [ ] Bill preview before finalization
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-090: Combined Patient Billing
**Description:** As billing staff, I want to combine OPD and IPD bills.

**Acceptance Criteria:**
- [ ] Single bill for OPD + IPD
- [ ] Itemized breakdown
- [ ] Payment allocation
- [ ] Receipt generation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-091: Enhanced Receipt Generation
**Description:** As billing staff, I want professional receipts.

**Acceptance Criteria:**
- [ ] Customizable receipt template
- [ ] QR code for verification
- [ ] Digital signature
- [ ] Email/WhatsApp delivery
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-092: Payment Modes (Cash, Card, UPI)
**Description:** As billing staff, I want multiple payment options.

**Acceptance Criteria:**
- [ ] Cash payment with change calculation
- [ ] Card payment integration
- [ ] UPI payment with QR
- [ ] Split payment support
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-093: Deposit Management (Enhanced)
**Description:** As billing staff, I want advanced deposit features.

**Acceptance Criteria:**
- [ ] Multiple deposits per patient
- [ ] Deposit utilization tracking
- [ ] Refund processing
- [ ] Deposit receipts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-094: Refund Processing
**Description:** As billing staff, I want to process refunds.

**Acceptance Criteria:**
- [ ] Refund request workflow
- [ ] Approval process
- [ ] Refund payment modes
- [ ] Refund receipts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-095: Expense Tracking
**Description:** As accounts staff, I want to track hospital expenses.

**Acceptance Criteria:**
- [ ] Expense entry with categories
- [ ] Vendor payment tracking
- [ ] Approval workflow
- [ ] Expense reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-096: Operations Ledger
**Description:** As accounts staff, I want to view operations ledger.

**Acceptance Criteria:**
- [ ] Daily transaction summary
- [ ] Cash flow view
- [ ] Day-end reconciliation
- [ ] Export to Excel
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-097: Financial Dashboard
**Description:** As management, I want a financial overview dashboard.

**Acceptance Criteria:**
- [ ] Revenue vs expense charts
- [ ] Collection summary
- [ ] Outstanding receivables
- [ ] Key financial KPIs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-098: GST Invoice Generation
**Description:** As accounts staff, I want GST-compliant invoices.

**Acceptance Criteria:**
- [ ] GSTIN on invoices
- [ ] HSN/SAC codes
- [ ] GST breakup (CGST/SGST/IGST)
- [ ] GST reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Module 4: Tally Integration (8 features)

### US-099: Tally Integration Setup
**Description:** As accounts staff, I want to connect to Tally.

**Acceptance Criteria:**
- [ ] Tally connection configuration
- [ ] Company selection
- [ ] Connection testing
- [ ] Sync status display
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-100: Automatic Voucher Generation
**Description:** As accounts staff, I want auto-generated Tally vouchers.

**Acceptance Criteria:**
- [ ] Receipt voucher generation
- [ ] Payment voucher generation
- [ ] Journal voucher generation
- [ ] Voucher queue management
- [ ] Typecheck passes

### US-101: Real-time Sync to Tally
**Description:** As accounts staff, I want real-time Tally sync.

**Acceptance Criteria:**
- [ ] Push transactions to Tally
- [ ] Sync status tracking
- [ ] Error handling and retry
- [ ] Sync logs
- [ ] Typecheck passes

### US-102: Payment/Receipt Vouchers
**Description:** As accounts staff, I want payment and receipt vouchers in Tally.

**Acceptance Criteria:**
- [ ] Map payment modes to Tally ledgers
- [ ] Auto-post on payment collection
- [ ] Voucher numbering sync
- [ ] Verification report
- [ ] Typecheck passes

### US-103: Sales Vouchers for Billing
**Description:** As accounts staff, I want sales vouchers for all billing.

**Acceptance Criteria:**
- [ ] Service-wise sales vouchers
- [ ] Party-wise tracking
- [ ] Tax calculations
- [ ] Sales register sync
- [ ] Typecheck passes

### US-104: Ledger Mapping
**Description:** As accounts staff, I want to map HMS accounts to Tally ledgers.

**Acceptance Criteria:**
- [ ] Ledger mapping interface
- [ ] Department to cost center mapping
- [ ] Doctor to ledger mapping
- [ ] Mapping validation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-105: GST Reports for Tally
**Description:** As accounts staff, I want GST reports compatible with Tally.

**Acceptance Criteria:**
- [ ] GSTR-1 data export
- [ ] GSTR-3B summary
- [ ] HSN summary
- [ ] Import format for Tally
- [ ] Typecheck passes

### US-106: Reconciliation Reports
**Description:** As accounts staff, I want reconciliation reports.

**Acceptance Criteria:**
- [ ] HMS vs Tally comparison
- [ ] Mismatch identification
- [ ] Correction workflow
- [ ] Reconciliation sign-off
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Module 5: Reports & Analytics (10 features)

### US-107: Real-time Dashboard
**Description:** As management, I want a real-time operational dashboard.

**Acceptance Criteria:**
- [ ] Auto-refresh metrics
- [ ] Key operational KPIs
- [ ] Alerts and notifications
- [ ] Customizable widgets
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-108: Patient Statistics
**Description:** As management, I want patient statistics reports.

**Acceptance Criteria:**
- [ ] Daily/monthly patient count
- [ ] OPD vs IPD breakdown
- [ ] New vs follow-up
- [ ] Department-wise distribution
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-109: Revenue Analysis
**Description:** As management, I want revenue analysis reports.

**Acceptance Criteria:**
- [ ] Revenue trends
- [ ] Service-wise revenue
- [ ] Doctor-wise revenue
- [ ] Comparison with targets
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-110: Bed Occupancy Reports
**Description:** As management, I want bed occupancy reports.

**Acceptance Criteria:**
- [ ] Average occupancy rate
- [ ] Ward-wise occupancy
- [ ] Peak occupancy times
- [ ] Length of stay analysis
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-111: Doctor-wise Revenue
**Description:** As management, I want doctor-wise revenue reports.

**Acceptance Criteria:**
- [ ] Revenue per doctor
- [ ] Patient count per doctor
- [ ] Average revenue per patient
- [ ] Comparison charts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-112: Expense Reports
**Description:** As management, I want expense analysis reports.

**Acceptance Criteria:**
- [ ] Category-wise expenses
- [ ] Trend analysis
- [ ] Budget vs actual
- [ ] Vendor payment summary
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-113: Financial Summary
**Description:** As management, I want financial summary reports.

**Acceptance Criteria:**
- [ ] Profit & loss summary
- [ ] Cash flow statement
- [ ] Outstanding summary
- [ ] Monthly comparison
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-114: PDF Export
**Description:** As staff, I want to export reports to PDF.

**Acceptance Criteria:**
- [ ] PDF generation for all reports
- [ ] Professional formatting
- [ ] Hospital branding
- [ ] Download and email options
- [ ] Typecheck passes

### US-115: Excel Export
**Description:** As staff, I want to export reports to Excel.

**Acceptance Criteria:**
- [ ] Excel export for all reports
- [ ] Proper formatting
- [ ] Multiple sheets for complex reports
- [ ] Filter preservation
- [ ] Typecheck passes

### US-116: Custom Report Builder
**Description:** As management, I want to build custom reports.

**Acceptance Criteria:**
- [ ] Select data fields
- [ ] Apply filters
- [ ] Choose visualization
- [ ] Save report templates
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Module 6: Pharmacy Management (33 features)

### US-117: Medicine Master
**Description:** As pharmacy staff, I want to manage medicine master data.

**Acceptance Criteria:**
- [ ] Medicine name, generic name, company
- [ ] Category and class
- [ ] Pricing (MRP, purchase, sale)
- [ ] Search and filter
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-118: Medicine Stock Management
**Description:** As pharmacy staff, I want to manage medicine stock.

**Acceptance Criteria:**
- [ ] Current stock view
- [ ] Stock in/out transactions
- [ ] Stock adjustment
- [ ] Stock valuation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-119: Batch Number Tracking
**Description:** As pharmacy staff, I want batch-wise tracking.

**Acceptance Criteria:**
- [ ] Batch number entry on purchase
- [ ] Batch-wise stock view
- [ ] FIFO dispensing
- [ ] Batch trace reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-120: Expiry Date Tracking
**Description:** As pharmacy staff, I want expiry tracking.

**Acceptance Criteria:**
- [ ] Expiry date on each batch
- [ ] Near-expiry alerts (30/60/90 days)
- [ ] Expiry reports
- [ ] Block expired stock dispensing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-121: Purchase Management
**Description:** As pharmacy staff, I want to manage purchases.

**Acceptance Criteria:**
- [ ] Supplier master
- [ ] Purchase order creation
- [ ] GRN entry
- [ ] Invoice matching
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-122: Medicine Billing Integration
**Description:** As pharmacy staff, I want integrated medicine billing.

**Acceptance Criteria:**
- [ ] Pharmacy sales billing
- [ ] Prescription-based dispensing
- [ ] IPD patient charging
- [ ] Receipt generation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-123: Low Stock Alerts
**Description:** As pharmacy staff, I want low stock alerts.

**Acceptance Criteria:**
- [ ] Reorder level configuration
- [ ] Alert when below reorder
- [ ] Dashboard notification
- [ ] Auto purchase order suggestion
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-124: Expiry Alerts (30/60/90 days)
**Description:** As pharmacy staff, I want expiry alerts.

**Acceptance Criteria:**
- [ ] Configurable alert periods
- [ ] Dashboard notifications
- [ ] Email alerts
- [ ] Expiry action workflow
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-125: Stock Valuation (FIFO)
**Description:** As pharmacy staff, I want FIFO stock valuation.

**Acceptance Criteria:**
- [ ] FIFO calculation
- [ ] Stock value reports
- [ ] Cost of goods sold
- [ ] Margin analysis
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-126: Daily Stock Reports
**Description:** As pharmacy manager, I want daily stock reports.

**Acceptance Criteria:**
- [ ] Opening/closing stock
- [ ] Day's transactions
- [ ] Stock movement summary
- [ ] Discrepancy highlighting
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-127: Pharmacy Sales Reports
**Description:** As pharmacy manager, I want sales reports.

**Acceptance Criteria:**
- [ ] Daily/monthly sales
- [ ] Medicine-wise sales
- [ ] Customer-wise sales
- [ ] Payment mode analysis
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-128: Profit & Loss Analysis
**Description:** As pharmacy manager, I want P&L analysis.

**Acceptance Criteria:**
- [ ] Gross margin calculation
- [ ] Medicine-wise profitability
- [ ] Trend analysis
- [ ] Comparison reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-129: Emergency/High Risk Medications
**Description:** As pharmacy staff, I want to flag high-risk medications.

**Acceptance Criteria:**
- [ ] High-risk medication flagging
- [ ] Special dispensing workflow
- [ ] Double verification
- [ ] Audit trail
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-130: Look-alike/Sound-alike Identification
**Description:** As pharmacy staff, I want LASA alerts.

**Acceptance Criteria:**
- [ ] LASA drug pairs configuration
- [ ] Alert on selection
- [ ] Visual differentiation
- [ ] Dispensing confirmation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-131: Pharmacy Inventory Management
**Description:** As pharmacy manager, I want advanced inventory management.

**Acceptance Criteria:**
- [ ] ABC analysis
- [ ] VED analysis
- [ ] Dead stock identification
- [ ] Inventory optimization
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-132: Re-order Level Alerts
**Description:** As pharmacy staff, I want re-order alerts.

**Acceptance Criteria:**
- [ ] Min/max stock levels
- [ ] Economic order quantity
- [ ] Lead time consideration
- [ ] Auto PO suggestion
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-133: Real-time Stock Updates
**Description:** As pharmacy staff, I want real-time stock.

**Acceptance Criteria:**
- [ ] Instant stock update on transaction
- [ ] Multi-location sync
- [ ] Stock lock for billing
- [ ] Conflict resolution
- [ ] Typecheck passes

### US-134: Dispensing Timestamp Capture
**Description:** As pharmacy staff, I want dispensing timestamps.

**Acceptance Criteria:**
- [ ] Timestamp on each dispensing
- [ ] TAT calculation
- [ ] Staff identification
- [ ] Audit report
- [ ] Typecheck passes

### US-135: High-risk Medication Alerts
**Description:** As pharmacy staff, I want high-risk alerts.

**Acceptance Criteria:**
- [ ] Alert on high-risk selection
- [ ] Mandatory verification
- [ ] Patient allergy check
- [ ] Dose verification
- [ ] Typecheck passes

### US-136: Stock Inventory Reports
**Description:** As pharmacy manager, I want inventory reports.

**Acceptance Criteria:**
- [ ] Current stock report
- [ ] Stock movement report
- [ ] Aging analysis
- [ ] Category-wise summary
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-137: Formulary Management
**Description:** As pharmacy manager, I want formulary management.

**Acceptance Criteria:**
- [ ] Hospital formulary list
- [ ] Formulary updates
- [ ] Non-formulary alerts
- [ ] Approval workflow for non-formulary
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-138: Non-Formulary Drug Highlighting
**Description:** As doctor, I want non-formulary drug alerts.

**Acceptance Criteria:**
- [ ] Visual highlighting of non-formulary
- [ ] Alternative suggestions
- [ ] Override with reason
- [ ] Reporting
- [ ] Typecheck passes

### US-139: Drug Allergy/Adverse Reaction History
**Description:** As pharmacy staff, I want allergy history.

**Acceptance Criteria:**
- [ ] Patient allergy database
- [ ] Cross-check on dispensing
- [ ] Alert display
- [ ] Override logging
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-140: Medication Reconciliation
**Description:** As clinical staff, I want medication reconciliation.

**Acceptance Criteria:**
- [ ] Home medication list
- [ ] Comparison with hospital meds
- [ ] Discrepancy identification
- [ ] Reconciliation documentation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-141: Near Expiry Notifications
**Description:** As pharmacy manager, I want expiry notifications.

**Acceptance Criteria:**
- [ ] Email notifications
- [ ] Dashboard alerts
- [ ] Return to vendor workflow
- [ ] Destruction documentation
- [ ] Typecheck passes

### US-142: Return/Recall Management
**Description:** As pharmacy manager, I want return management.

**Acceptance Criteria:**
- [ ] Return to vendor processing
- [ ] Recall management
- [ ] Patient notification for recalls
- [ ] Documentation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-143: Patient Identification at Administration
**Description:** As nursing staff, I want patient ID verification.

**Acceptance Criteria:**
- [ ] Patient ID scan/verification
- [ ] Medication verification
- [ ] Administration recording
- [ ] Error prevention
- [ ] Typecheck passes

### US-144: eMAR (Electronic Medication Administration Record)
**Description:** As nursing staff, I want electronic MAR.

**Acceptance Criteria:**
- [ ] Scheduled medication display
- [ ] Administration recording
- [ ] Missed dose tracking
- [ ] PRN documentation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-145: Medical Implant Records
**Description:** As OR staff, I want implant tracking.

**Acceptance Criteria:**
- [ ] Implant details capture
- [ ] UDI recording
- [ ] Patient linking
- [ ] Recall tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-146: Emergency Medication Records
**Description:** As emergency staff, I want emergency med tracking.

**Acceptance Criteria:**
- [ ] Emergency drug usage
- [ ] Crash cart documentation
- [ ] Restocking alerts
- [ ] Usage reports
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-147: Medication Error Records
**Description:** As pharmacy manager, I want error tracking.

**Acceptance Criteria:**
- [ ] Error incident form
- [ ] Classification
- [ ] Root cause analysis
- [ ] Corrective actions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-148: Medication Error Analytics Dashboard
**Description:** As pharmacy manager, I want error analytics.

**Acceptance Criteria:**
- [ ] Error trends
- [ ] Category analysis
- [ ] High-risk identification
- [ ] Improvement tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-149: Emergency Medication Protocol Checklists
**Description:** As clinical staff, I want emergency protocols.

**Acceptance Criteria:**
- [ ] Protocol checklists
- [ ] Step-by-step guidance
- [ ] Documentation
- [ ] Compliance tracking
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Module 7-15: Remaining Modules

*(Detailed user stories for Modules 7-15 follow the same pattern. For brevity, key features are listed below. Full user stories available on request.)*

### Module 7: Inventory Management (37 features)
- Item Master, Purchase Orders, Stock Management
- Procurement workflows, GRN, Vendor management
- Patient billing templates, Insurance claims
- Asset management, Maintenance tracking

### Module 8: HRM (36 features)
- Employee master, Attendance, Leave management
- Payroll processing, Salary calculations
- Shift management, Duty roster
- Training calendar, Appraisals

### Module 9: Security & Access Control (34 features)
- User authentication, Role-based access
- Audit logs, Data encryption
- Password policies, Auto-logout
- MFA, Migration support

### Module 10: Floor Management (8 features)
- Floor master, Nurse alignment
- Patient care tracking, Housekeeping
- Room pre-requisites, Reports

### Module 11: Laboratory Management (21 features)
- Test master (200+ tests), Sample tracking
- Result entry, Normal ranges
- Report generation, TAT tracking
- ABHA linking, Critical alerts

### Module 12: NABH/ABHA Compliance (30 features)
- Patient safety checklists, Infection control
- Quality indicators, Incident reporting
- ABDM FHIR integration, ICD/SNOMED coding
- KPI computation, ISO compliance

### Module 13: Blood Bank (5 features)
- Donor records, TAT calculation
- Stock management, Transfusion safety
- UHI stock check

### Module 14: Communication Services (6 features)
- WhatsApp Business API, SMS Gateway
- Email service (50k/month)
- Automated notifications, Templates

### Module 15: Additional Modules Phase 2 (3 features)
- Gate entry tracking
- Ambulance management
- Canteen management

---

## Functional Requirements

### Core Requirements
- FR-1: All patient data must be stored in Supabase PostgreSQL
- FR-2: All forms must validate input before submission
- FR-3: All user actions must be logged for audit trail
- FR-4: Role-based access must restrict features per user role
- FR-5: All reports must be exportable to Excel and PDF

### NABH Compliance Requirements
- FR-6: UHID must be unique and auto-generated
- FR-7: TAT must be tracked for all patient touchpoints
- FR-8: All clinical documents must have digital signatures
- FR-9: Medication administration must use 5 Rights verification
- FR-10: Incident reporting must be available for all staff

### Integration Requirements
- FR-11: ABHA integration via sandbox APIs for development
- FR-12: All timestamps must use server time (IST)
- FR-13: File uploads must be stored in Supabase Storage

---

## Non-Goals (Out of Scope)

- Mobile app development (web-only for Phase 1)
- Tally integration (not in current scope - Supabase only)
- WhatsApp/SMS integration (Phase 2)
- Third-party lab integration
- Insurance company direct integration
- PACS/radiology image storage
- Biometric attendance integration
- Payment gateway integration

---

## Technical Considerations

### Existing Stack
- React 19 + TypeScript + Vite
- Supabase (PostgreSQL) backend
- TanStack Query for data fetching
- Zustand for state management
- Tailwind CSS + custom components

### Database
- All new tables must include: id, created_at, updated_at
- Enable Row Level Security (RLS) on all tables
- Create appropriate indexes for search fields
- Use foreign keys for referential integrity

### Performance
- Page load time < 2 seconds
- API response time < 500ms
- Support 20 concurrent users
- 40+ bed management capacity

---

## Success Metrics

- 100% feature completion across all 15 modules
- All features pass Farooq's testing approval
- NABH compliance checklist 100% complete
- < 5 critical bugs in production
- < 2 second page load times
- Successful data migration from current system

---

## Implementation Priority

### Phase 1 (Weeks 1-4): OPD Completion
Complete remaining 14 OPD features

### Phase 2 (Weeks 5-12): Core Modules
- IPD Management (60 features)
- Billing & Accounts (11 features)
- Reports & Analytics (10 features)

### Phase 3 (Weeks 13-24): Clinical Modules
- Pharmacy Management (33 features)
- Laboratory Management (21 features)
- Inventory Management (37 features)

### Phase 4 (Weeks 25-34): Support Modules
- HRM (36 features)
- Security & Access (34 features)
- NABH Compliance (30 features)
- Remaining modules

---

## Open Questions

1. ABHA integration - sandbox or production credentials?
2. Digital signature - upload image or draw signature?
3. SMS/WhatsApp - which provider to integrate?
4. Tally version - Prime or ERP?
5. Lab equipment - any specific integrations needed?
6. Biometric devices - models in use?

---

## Approval

**Prepared By:** Development Team
**Date:** January 13, 2026
**Version:** 1.0

**Approved By:** _______________
**Date:** _______________
