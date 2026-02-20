# OPD MODULE - TESTING CHECKLIST
## Quick Reference for Client Testing Preparation

**Use this checklist to track feature testing status before client delivery**

---

## LEGEND
- ✅ **PASS** - Working perfectly, production-ready
- ⚠️ **WARN** - Works but needs configuration or minor fixes
- ❌ **FAIL** - Not working, needs immediate attention
- ⏸️ **SKIP** - Not applicable or deferred to future release

---

## CATEGORY 1: PATIENT MANAGEMENT (Features 1-7)

### Feature #1: Patient Registration
- [ ] ✅/❌ Can create new patient with all fields
- [ ] ✅/❌ Photo upload works (camera + file)
- [ ] ✅/❌ UHID generated automatically in format MH-2026-XXXXXX
- [ ] ✅/❌ Aadhaar validation (12 digits)
- [ ] ✅/❌ Form validation works (required fields highlighted)
- [ ] ✅/❌ Patient saved to database successfully
- [ ] ✅/❌ Confirmation message shown after save

**Test Data**:
```
Name: Test Patient
Age: 35
Gender: Male
Phone: 9876543210
Aadhaar: 123456789012
```

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #2: Doctor Consultation
- [ ] ✅/❌ Can open consultation form from queue
- [ ] ✅/❌ Chief complaints section works
- [ ] ✅/❌ Examination findings can be entered
- [ ] ✅/❌ ICD-10 diagnosis search works
- [ ] ✅/❌ Treatment plan saved correctly
- [ ] ✅/❌ Follow-up date can be set
- [ ] ✅/❌ Consultation saved to database
- [ ] ✅/❌ Queue status updated to COMPLETED

**Test Scenario**: Complete a full consultation for test patient

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #3: Appointment Scheduling
- [ ] ✅/❌ Can create future appointment
- [ ] ✅/❌ Date picker works correctly
- [ ] ✅/❌ Time slots shown for selected doctor
- [ ] ✅/❌ Prevents double-booking (time conflict check)
- [ ] ✅/❌ Appointment saved to database
- [ ] ✅/❌ Appointment appears in calendar view
- [ ] ✅/❌ Can cancel appointment with reason

**Test**: Book appointment for tomorrow at 10:00 AM

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #4: Patient Search & History
- [ ] ✅/❌ Search by UHID works
- [ ] ✅/❌ Search by name works (partial match)
- [ ] ✅/❌ Search by phone number works
- [ ] ✅/❌ Patient list displays correctly
- [ ] ✅/❌ Can click patient to view full details
- [ ] ✅/❌ Patient history modal shows:
  - [ ] Previous consultations
  - [ ] Prescriptions
  - [ ] Vitals history
  - [ ] Billing records

**Test**: Search for the test patient created earlier

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #5: Digital Medical Records
- [ ] ✅/❌ High Risk section saves data
- [ ] ✅/❌ Chief Complaints section works
- [ ] ✅/❌ Examination section functional
- [ ] ✅/❌ Investigation section accepts data
- [ ] ✅/❌ Diagnosis section with ICD-10
- [ ] ✅/❌ Enhanced Prescription section works
- [ ] ✅/❌ All sections save to database
- [ ] ✅/❌ Can retrieve saved records

**Test**: Fill all 6 sections for test patient

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #6: Prescription System
- [ ] ✅/❌ Sevasangraha template loads
- [ ] ✅/❌ VH template loads
- [ ] ✅/❌ Sevasangraha2 template loads
- [ ] ✅/❌ Medicine dropdown works
- [ ] ✅/❌ Dosage fields save correctly
- [ ] ✅/❌ Can add multiple medicines
- [ ] ✅/❌ Print prescription works
- [ ] ✅/❌ PDF download works
- [ ] ✅/❌ Prescription saved to database

**Test**: Generate prescription with 3 medicines

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #7: Chief Complaints Recording
- [ ] ✅/❌ Can add complaint
- [ ] ✅/❌ Duration field works
- [ ] ✅/❌ Severity selection works
- [ ] ✅/❌ Multiple complaints can be added
- [ ] ✅/❌ Saved to patient_chief_complaints table

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## CATEGORY 2: CLINICAL FEATURES (Features 8-13)

### Feature #8: Examination & Diagnosis
- [ ] ✅/❌ Examination template selection works
- [ ] ✅/❌ General examination fields save
- [ ] ✅/❌ Systemic examination works
- [ ] ✅/❌ ICD-10 search functional
- [ ] ✅/❌ Primary diagnosis saved
- [ ] ✅/❌ Differential diagnosis option works

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #9: Patient Photo Upload
- [ ] ✅/❌ Camera capture works (desktop)
- [ ] ✅/❌ Camera works on mobile
- [ ] ✅/❌ File upload works
- [ ] ✅/❌ Image preview shown
- [ ] ✅/❌ Photo saved with patient record
- [ ] ✅/❌ Photo displayed in patient profile

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #10: WhatsApp Appointment Reminders
- [ ] ✅/❌ Twilio credentials configured in .env
- [ ] ✅/❌ WhatsApp number added to .env
- [ ] ✅/❌ Test message sent successfully
- [ ] ✅/❌ Appointment confirmation sent on booking
- [ ] ✅/❌ Reminder sent 24h before appointment
- [ ] ✅/❌ Message received on WhatsApp
- [ ] ✅/❌ Message format correct

**Test Phone**: +91__________
**Expected**: WhatsApp message received within 1 minute

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #11: SMS Notifications
- [ ] ✅/❌ SMS credentials configured
- [ ] ✅/❌ Registration confirmation SMS sent
- [ ] ✅/❌ Appointment SMS sent
- [ ] ✅/❌ Follow-up reminder SMS sent
- [ ] ✅/❌ SMS received within 1 minute
- [ ] ✅/❌ SMS content correct

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #12: Document Upload
- [ ] ✅/❌ Upload button visible
- [ ] ✅/❌ Can select PDF file
- [ ] ✅/❌ Can select image file
- [ ] ✅/❌ Upload progress shown
- [ ] ✅/❌ File saved to storage
- [ ] ✅/❌ Can view uploaded document
- [ ] ✅/❌ Can download document

**Test**: Upload a sample lab report PDF

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #13: Medical Certificate Generation
- [ ] ✅/❌ Certificate generator opens
- [ ] ✅/❌ Sick leave certificate generates
- [ ] ✅/❌ Fitness certificate generates
- [ ] ✅/❌ Disability certificate generates
- [ ] ✅/❌ Patient name auto-filled
- [ ] ✅/❌ Doctor details auto-filled
- [ ] ✅/❌ Print certificate works
- [ ] ✅/❌ PDF download works

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## CATEGORY 3: ADVANCED FEATURES (Features 14-29)

### Feature #15: ABHA Linking
- [ ] ✅/❌ ABHA modal opens
- [ ] ✅/❌ Aadhaar input validates
- [ ] ✅/❌ OTP screen appears
- [ ] ✅/❌ Consent form displays
- [ ] ✅/❌ ABHA number generated (mock: 14-XXXXXXXXXX-XX)
- [ ] ✅/❌ ABHA address created
- [ ] ✅/❌ ABHA saved with patient record

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL (Mock implementation OK for testing)
**Notes**: _______________________________________

---

### Feature #16: Self-Registration Kiosk
- [ ] ✅/❌ Kiosk UI loads in fullscreen
- [ ] ✅/❌ Step 1: Registration type selection works
- [ ] ✅/❌ Step 2: Personal details form works
- [ ] ✅/❌ Step 3: Identification capture (mock OK)
- [ ] ✅/❌ Step 4: Medical info saves
- [ ] ✅/❌ Step 5: Payment screen appears
- [ ] ✅/❌ Registration completes
- [ ] ✅/❌ UHID generated
- [ ] ✅/❌ Token displayed

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: Backend integration pending - frontend only

---

### Feature #17: Waiting Hall Display
- [ ] ✅/❌ Display loads correctly
- [ ] ✅/❌ Shows current time
- [ ] ✅/❌ "Now Serving" section shows tokens
- [ ] ✅/❌ Upcoming tokens list visible
- [ ] ✅/❌ Doctor availability status shown
- [ ] ✅/❌ Updates every 30 seconds
- [ ] ✅/❌ Data from real queue (not mock)

**CRITICAL**: Must connect to real queue data before client demo!

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #18: Mobile OTP Verification
- [ ] ✅/❌ OTP service implemented
- [ ] ✅/❌ Can request OTP
- [ ] ✅/❌ OTP received on phone
- [ ] ✅/❌ Can enter 6-digit OTP
- [ ] ✅/❌ Verification succeeds for correct OTP
- [ ] ✅/❌ Verification fails for wrong OTP
- [ ] ✅/❌ Resend OTP works

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #19: UHID Generation
- [ ] ✅/❌ UHID generated in format MH-2026-XXXXXX
- [ ] ✅/❌ Sequence increments correctly
- [ ] ✅/❌ No duplicate UHIDs created
- [ ] ✅/❌ UHID visible on patient card
- [ ] ✅/❌ Can search by UHID

**Test**: Create 5 patients and verify sequential UHIDs

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #20: Configure UHID Format
- [ ] ✅/❌ uhid_config table exists
- [ ] ✅/❌ Can view current configuration
- [ ] ✅/❌ Can change prefix (e.g., MAG instead of MH)
- [ ] ✅/❌ Can change year format (YYYY vs YY)
- [ ] ✅/❌ Changes reflect in new UHIDs

**Note**: Admin UI not built - requires SQL update

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #22: Duplicate Patient Check
- [ ] ✅/❌ Checks phone number for duplicates
- [ ] ✅/❌ Checks Aadhaar for duplicates
- [ ] ✅/❌ Checks name + DOB combination
- [ ] ✅/❌ Warning shown if duplicate found
- [ ] ✅/❌ Can view matching patient
- [ ] ✅/❌ Can merge duplicate records
- [ ] ✅/❌ Can proceed anyway if false positive

**Test**: Try creating patient with existing phone number

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #27: Referral Management
- [ ] ✅/❌ Can create new referral
- [ ] ✅/❌ Referral to external doctor works
- [ ] ✅/❌ Referral to internal department works
- [ ] ✅/❌ Referral reason captured
- [ ] ✅/❌ Referral status tracked
- [ ] ✅/❌ Referral reports available

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #28: Queue Waiting Time Display
- [ ] ✅/❌ Queue displays with token numbers
- [ ] ✅/❌ Wait time calculated correctly
- [ ] ✅/❌ Estimated wait time shown
- [ ] ✅/❌ Status updates (Waiting/In Consultation/Completed)
- [ ] ✅/❌ TAT indicators (Normal/Warning/Critical)
- [ ] ✅/❌ Drag-and-drop reorder works
- [ ] ✅/❌ Updates in real-time (3 sec refresh)

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## CATEGORY 4: EXTERNAL INTEGRATIONS (Features 30-41)

### Feature #31: Teleconsult Appointments
- [ ] ✅/❌ Can select Teleconsult option
- [ ] ✅/❌ Video call link generated
- [ ] ✅/❌ Can join video call
- [ ] ✅/❌ Audio works
- [ ] ✅/❌ Video works
- [ ] ✅/❌ Screen sharing works
- [ ] ✅/❌ Works on mobile

**Note**: If using Jitsi, verify free tier limits

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #33: TAT Recording
- [ ] ✅/❌ Wait time calculated (registration to vitals)
- [ ] ✅/❌ Consultation time recorded
- [ ] ✅/❌ Total TAT calculated
- [ ] ✅/❌ TAT status shown (Normal/Warning/Critical/Breached)
- [ ] ✅/❌ TAT thresholds configurable
- [ ] ✅/❌ TAT reports available

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #38: Queue Management (Token)
- [ ] ✅/❌ Token auto-assigned on queue entry
- [ ] ✅/❌ Token displayed to patient
- [ ] ✅/❌ Token visible in waiting hall
- [ ] ✅/❌ Token resets daily
- [ ] ✅/❌ Priority patients get different tokens
- [ ] ✅/❌ Voice announcement works (if enabled)

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #40: Pharmacy Integration
- [ ] ✅/❌ Prescription links to pharmacy
- [ ] ✅/❌ Medicine list accessible in pharmacy
- [ ] ✅/❌ Pharmacy can view OPD prescriptions
- [ ] ✅/❌ Medicine dispensing tracked
- [ ] ✅/❌ Inventory updated after dispensing

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Feature #41: OPD Reports & MIS
- [ ] ✅/❌ Daily OPD register generated
- [ ] ✅/❌ Doctor-wise patient count report
- [ ] ✅/❌ Department statistics report
- [ ] ✅/❌ Monthly trends shown
- [ ] ✅/❌ TAT analytics available
- [ ] ✅/❌ Export to Excel works
- [ ] ✅/❌ Export to PDF works
- [ ] ✅/❌ Date filter works
- [ ] ✅/❌ Graphs render correctly

**Test**: Generate all reports for last 7 days

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## INTEGRATION TESTING

### End-to-End Patient Journey
**Test Scenario**: Complete patient flow from registration to discharge

1. [ ] Register new patient (Feature #1)
2. [ ] Take patient photo (Feature #9)
3. [ ] Add to OPD queue (Feature #38)
4. [ ] Record vitals
5. [ ] Start consultation (Feature #2)
6. [ ] Fill medical records (Feature #5)
7. [ ] Add diagnosis with ICD-10 (Feature #8)
8. [ ] Generate prescription (Feature #6)
9. [ ] Generate medical certificate (Feature #13)
10. [ ] Create billing entry
11. [ ] Mark consultation complete
12. [ ] Book follow-up appointment (Feature #3)
13. [ ] Send SMS confirmation (Feature #11)
14. [ ] Verify in reports (Feature #41)

**Time taken**: _____ minutes (Target: < 10 minutes)

**Status**: ⬜ PASS | ⬜ FAIL
**Issues found**: _______________________________________

---

### Concurrent Users Test
**Test**: 5 users registering patients simultaneously

- [ ] No UHID collision
- [ ] No queue number collision
- [ ] All patients saved correctly
- [ ] Queue updates for all users
- [ ] No database deadlocks

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Mobile Responsiveness Test
**Test on**:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Android Tablet (Chrome)

**Check**:
- [ ] Forms usable on mobile
- [ ] Buttons not overlapping
- [ ] Text readable without zoom
- [ ] Navigation works
- [ ] Camera works on mobile

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## PERFORMANCE TESTING

### Load Time
- [ ] ✅/❌ Homepage loads < 2 seconds
- [ ] ✅/❌ Patient list loads < 3 seconds
- [ ] ✅/❌ Queue display loads < 2 seconds
- [ ] ✅/❌ Prescription generates < 3 seconds
- [ ] ✅/❌ Reports generate < 5 seconds

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Database Performance
**Test**: Create 100 test patients

- [ ] Database insert time reasonable
- [ ] Search still fast with 100+ patients
- [ ] Reports generate within time limit
- [ ] No memory leaks

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## SECURITY TESTING

### Authentication
- [ ] ✅/❌ Cannot access without login
- [ ] ✅/❌ Session expires after timeout
- [ ] ✅/❌ Logout works correctly
- [ ] ✅/❌ Password not visible in console/network

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

### Data Security
- [ ] ✅/❌ Aadhaar number masked after entry
- [ ] ✅/❌ Patient data not accessible without permission
- [ ] ✅/❌ No SQL injection possible
- [ ] ✅/❌ XSS protection enabled

**Status**: ⬜ Not Tested | ⬜ PASS | ⬜ FAIL
**Notes**: _______________________________________

---

## FINAL READINESS SCORE

**Total Features**: 41
**Tested**: ___
**Passed**: ___
**Failed**: ___
**Skipped**: ___

**Pass Rate**: ___% (Target: 95%+)

**Ready for Client Testing**: ⬜ YES | ⬜ NO

**Critical Issues Remaining**: __________________

**Must Fix Before Client Demo**:
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## SIGN-OFF

**Tested By**: _______________________
**Date**: _______________________
**Approved By**: _______________________
**Date**: _______________________

**Client Demo Date**: _______________________
**Client Name**: _______________________

---

**Notes for Client Demo**:
_________________________________________________
_________________________________________________
_________________________________________________
