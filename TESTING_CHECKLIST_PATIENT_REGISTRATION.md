# Patient Registration Testing Checklist

**Date:** February 21, 2026
**Version:** 1.0
**Purpose:** Comprehensive testing after applying patient registration fixes

---

## Pre-Testing Setup

### 1. Database Backup
- [ ] Create full database backup before applying fixes
- [ ] Export current UHID configuration
  ```sql
  SELECT * FROM uhid_config WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
  ```
- [ ] Export current doctors list
  ```sql
  SELECT * FROM doctors ORDER BY name;
  ```
- [ ] Note current max UHID
  ```sql
  SELECT MAX(uhid) FROM patients WHERE uhid LIKE 'MH-2026-%';
  ```

### 2. Apply Fixes
- [ ] Run `COMPREHENSIVE_PATIENT_REGISTRATION_FIX.sql` in Supabase SQL Editor
- [ ] Verify all SQL statements executed successfully (check for errors)
- [ ] Apply code changes from `PATIENT_REGISTRATION_CODE_FIXES.md`
- [ ] Rebuild frontend: `npm run build`
- [ ] Clear browser cache and reload application

### 3. Verify Database State
- [ ] Confirm UHID sequence is synchronized
  ```sql
  SELECT
      current_sequence,
      (SELECT MAX(CAST(SUBSTRING(uhid FROM '[0-9]{6}$') AS INTEGER))
       FROM patients WHERE uhid LIKE 'MH-2026-%') as max_uhid_in_db
  FROM uhid_config
  WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
  -- current_sequence should equal max_uhid_in_db
  ```

- [ ] Confirm doctors table is populated
  ```sql
  SELECT COUNT(*) as total_doctors,
         COUNT(*) FILTER (WHERE is_active = true) as active_doctors
  FROM doctors;
  -- Should have at least 12-15 doctors
  ```

- [ ] Confirm OPD queue tables exist
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('opd_queue', 'opd_queues');
  -- At least one should exist
  ```

---

## Test Suite 1: UHID Generation

### Test 1.1: Single Patient Registration
**Objective:** Verify UHID generation works for single patient

**Steps:**
1. [ ] Open Patient Registration form
2. [ ] Note the displayed "Next UHID" (e.g., MH-2026-000020)
3. [ ] Fill in patient details:
   - Full Name: Test Patient One
   - Phone: 9999900001
   - Age: 30
   - Gender: Male
4. [ ] Select a doctor from dropdown
5. [ ] Click "Register Patient"
6. [ ] Verify success message appears
7. [ ] Note the UHID in success message

**Expected Results:**
- [ ] Registration succeeds without errors
- [ ] UHID in success message matches displayed "Next UHID"
- [ ] No duplicate key error
- [ ] Patient appears in patient list

**Verification Query:**
```sql
SELECT patient_id, uhid, first_name, last_name, created_at
FROM patients
WHERE first_name = 'Test' AND last_name = 'Patient One';
```

### Test 1.2: Rapid Sequential Registrations
**Objective:** Verify UHID uniqueness under rapid creation

**Steps:**
1. [ ] Open three browser tabs with patient registration form
2. [ ] In each tab simultaneously (within 5 seconds), register patients:
   - Tab 1: Test Patient Two, Phone: 9999900002
   - Tab 2: Test Patient Three, Phone: 9999900003
   - Tab 3: Test Patient Four, Phone: 9999900004
3. [ ] Verify all three registrations succeed
4. [ ] Check all three UHIDs are unique and sequential

**Expected Results:**
- [ ] All three patients registered successfully
- [ ] No duplicate UHID errors
- [ ] UHIDs are sequential (e.g., 000021, 000022, 000023)

**Verification Query:**
```sql
SELECT patient_id, uhid, first_name, created_at
FROM patients
WHERE first_name = 'Test'
  AND last_name IN ('Patient Two', 'Patient Three', 'Patient Four')
ORDER BY uhid;

-- Should return exactly 3 rows with sequential UHIDs
```

### Test 1.3: UHID Retry on Conflict
**Objective:** Verify retry logic handles pre-existing UHIDs

**Steps:**
1. [ ] Manually insert a patient with next expected UHID:
   ```sql
   -- Get next UHID first
   SELECT current_sequence FROM uhid_config;
   -- If sequence is 23, manually insert with MH-2026-000024

   INSERT INTO patients (patient_id, uhid, first_name, last_name, age, gender, phone, address, emergency_contact_name, emergency_contact_phone)
   VALUES ('P999999', 'MH-2026-000024', 'Conflict', 'Test', 30, 'MALE', '9999999999', 'Test Address', 'Emergency', '9999999999');
   ```
2. [ ] Register a new patient through UI
3. [ ] Verify registration succeeds with UHID 000025 (skipping 000024)

**Expected Results:**
- [ ] Registration succeeds
- [ ] System auto-increments past the conflicting UHID
- [ ] No error shown to user

**Verification Query:**
```sql
SELECT uhid FROM patients WHERE uhid IN ('MH-2026-000024', 'MH-2026-000025')
ORDER BY uhid;
-- Should show both UHIDs exist
```

### Test 1.4: UHID Year Rollover
**Objective:** Verify UHID resets for new year (if testing in January)

**Steps:**
1. [ ] Check current year in UHID
2. [ ] If possible, manually set system date to January 1, 2027
3. [ ] Register a new patient
4. [ ] Verify UHID starts with MH-2027-000001

**Expected Results:**
- [ ] UHID format includes new year
- [ ] Sequence resets to 000001

**Note:** Skip this test if not in January or cannot change system date.

---

## Test Suite 2: Doctors Dropdown

### Test 2.1: Doctors Load on Page Load
**Objective:** Verify doctors populate immediately

**Steps:**
1. [ ] Open browser developer console (F12)
2. [ ] Navigate to Patient Registration page
3. [ ] Observe console logs for doctor loading
4. [ ] Verify doctors dropdown is populated

**Expected Results:**
- [ ] Console shows: "✅ Loaded X doctors"
- [ ] Dropdown has at least 12 options
- [ ] No errors in console
- [ ] Dropdown is not empty

**Console Expected Logs:**
```
🔄 Fetching doctors (attempt 1/3)...
✅ Successfully loaded 15 doctors
✅ Doctors loaded into state: 15
```

### Test 2.2: Doctors Filter by Department
**Objective:** Verify department filtering works

**Steps:**
1. [ ] Open Patient Registration form
2. [ ] Select Department: "ORTHOPAEDIC"
3. [ ] Verify doctors dropdown filters to only orthopaedic doctors
4. [ ] Change Department to "GYN."
5. [ ] Verify doctors dropdown updates

**Expected Results:**
- [ ] Dropdown shows only relevant department doctors
- [ ] Changing department updates doctors list
- [ ] No "No doctors available" message

### Test 2.3: Custom Doctor Entry
**Objective:** Verify custom doctor entry works when needed

**Steps:**
1. [ ] Select Department: "CUSTOM"
2. [ ] Enter custom department name: "Emergency Medicine"
3. [ ] Select Doctor: "CUSTOM"
4. [ ] Enter custom doctor name: "DR. CUSTOM TEST"
5. [ ] Complete registration
6. [ ] Verify patient is saved with custom doctor details

**Expected Results:**
- [ ] Registration succeeds
- [ ] Custom doctor name is saved
- [ ] Custom department is saved

**Verification Query:**
```sql
SELECT assigned_doctor, assigned_department
FROM patients
WHERE assigned_doctor = 'DR. CUSTOM TEST';
```

### Test 2.4: Doctors Retry on Initial Failure
**Objective:** Verify retry logic handles transient failures

**Steps:**
1. [ ] In browser dev tools, go to Network tab
2. [ ] Set network throttling to "Slow 3G"
3. [ ] Reload Patient Registration page
4. [ ] Observe console for retry attempts
5. [ ] Verify doctors still load eventually

**Expected Results:**
- [ ] Console shows multiple retry attempts
- [ ] Doctors eventually load despite slow network
- [ ] User sees loading indicator during retries

### Test 2.5: Fallback Doctors on Complete Failure
**Objective:** Verify fallback doctors appear if database fails

**Steps:**
1. [ ] In browser dev tools, Network tab
2. [ ] Block all requests to Supabase URL
3. [ ] Reload Patient Registration page
4. [ ] Verify at least 1-2 fallback doctors appear

**Expected Results:**
- [ ] Dropdown not completely empty
- [ ] Shows "DR. NAVEEN" or similar fallback doctors
- [ ] User can still register patients

---

## Test Suite 3: OPD Queue Addition

### Test 3.1: Auto-add to Queue on Registration
**Objective:** Verify new patients are automatically added to queue

**Steps:**
1. [ ] Register a new patient:
   - Name: Queue Test Patient
   - Select doctor from dropdown (note which doctor)
2. [ ] Verify success message includes queue number
3. [ ] Navigate to OPD Queue view
4. [ ] Verify patient appears in queue

**Expected Results:**
- [ ] Success message: "Added to OPD Queue automatically (Queue #X)"
- [ ] Patient appears in OPD queue list
- [ ] Queue status is "waiting"
- [ ] Correct doctor is assigned

**Verification Query:**
```sql
SELECT
    p.first_name,
    p.last_name,
    q.queue_number,
    q.queue_status,
    d.name as doctor_name
FROM patients p
JOIN opd_queue q ON q.patient_id = p.id
LEFT JOIN doctors d ON d.id = q.doctor_id
WHERE p.first_name = 'Queue' AND p.last_name = 'Test Patient';

-- Should return 1 row with queue details
```

### Test 3.2: Queue Number Increments Correctly
**Objective:** Verify queue numbers increment per doctor per day

**Steps:**
1. [ ] Note current queue numbers for a specific doctor
2. [ ] Register 3 patients with same doctor:
   - Patient A, B, C all assigned to DR. HEMANT KHAJJA
3. [ ] Verify queue numbers increment (e.g., 5, 6, 7)
4. [ ] Register 1 patient with different doctor
5. [ ] Verify that patient gets queue number 1 (or next for that doctor)

**Expected Results:**
- [ ] Queue numbers increment sequentially per doctor
- [ ] Different doctors have independent queue sequences
- [ ] No duplicate queue numbers for same doctor on same day

**Verification Query:**
```sql
SELECT
    d.name as doctor_name,
    COUNT(*) as patients_in_queue,
    MAX(q.queue_number) as highest_queue_number
FROM opd_queue q
JOIN doctors d ON d.id = q.doctor_id
WHERE DATE(q.created_at) = CURRENT_DATE
GROUP BY d.name;
```

### Test 3.3: Queue Addition with Missing Doctor ID
**Objective:** Verify graceful handling when doctor ID is missing

**Steps:**
1. [ ] Register patient without selecting doctor (if UI allows)
2. [ ] OR manually remove doctor_id from form submission (via browser dev tools)
3. [ ] Observe error handling

**Expected Results:**
- [ ] Patient registration still succeeds
- [ ] Warning message: "Queue addition failed, but patient registered"
- [ ] Patient NOT in queue
- [ ] User can manually add to queue later

### Test 3.4: Queue Table Compatibility
**Objective:** Verify both opd_queue and opd_queues tables work

**Steps:**
1. [ ] Register a patient (should add to queue)
2. [ ] Check which table has the entry:
   ```sql
   SELECT 'opd_queue' as table_name, COUNT(*) FROM opd_queue
   WHERE DATE(created_at) = CURRENT_DATE
   UNION ALL
   SELECT 'opd_queues', COUNT(*) FROM opd_queues
   WHERE DATE(created_at) = CURRENT_DATE;
   ```
3. [ ] Verify entry exists in at least one table

**Expected Results:**
- [ ] Entry found in either opd_queue or opd_queues
- [ ] Code works regardless of table name

---

## Test Suite 4: Error Handling

### Test 4.1: Network Interruption During Registration
**Objective:** Verify graceful handling of network failures

**Steps:**
1. [ ] Fill in patient registration form completely
2. [ ] In browser dev tools, Network tab, set to "Offline"
3. [ ] Click "Register Patient"
4. [ ] Observe error message

**Expected Results:**
- [ ] Clear error message: "Network error, please check connection"
- [ ] Form data is NOT lost
- [ ] User can retry after reconnecting

### Test 4.2: Partial Data Submission
**Objective:** Verify validation catches incomplete forms

**Steps:**
1. [ ] Try to register with only name (no phone, age, gender)
2. [ ] Observe validation messages

**Expected Results:**
- [ ] Validation prevents submission
- [ ] Specific error messages for missing fields
- [ ] No database insert attempted

### Test 4.3: Database Constraint Violations
**Objective:** Verify handling of database-level errors

**Steps:**
1. [ ] Manually create a patient with phone "9999900099"
2. [ ] Try to register another patient with same phone
3. [ ] Observe error handling

**Expected Results:**
- [ ] Clear error message about duplicate phone
- [ ] Registration does not succeed
- [ ] User can correct phone number and retry

---

## Test Suite 5: End-to-End Workflow

### Test 5.1: Complete Registration Workflow
**Objective:** Verify entire patient registration flow

**Steps:**
1. [ ] Navigate to Patient Registration
2. [ ] Fill complete patient form:
   - Full Name: E2E Test Patient
   - Phone: 9999911111
   - Email: e2e@test.com
   - Age: 45
   - Gender: Female
   - Address: 123 Test Street
   - Blood Group: O+
   - Department: ORTHOPAEDIC
   - Doctor: DR. HEMANT KHAJJA
3. [ ] Click "Register Patient"
4. [ ] Verify success message with UHID and queue number
5. [ ] Navigate to Patient List
6. [ ] Verify patient appears
7. [ ] Navigate to OPD Queue
8. [ ] Verify patient in queue
9. [ ] Open patient details
10. [ ] Verify all information is correct

**Expected Results:**
- [ ] All steps complete without errors
- [ ] Patient record is complete
- [ ] UHID is assigned
- [ ] Queue entry exists
- [ ] All data matches input

### Test 5.2: Existing Patient New Visit
**Objective:** Verify existing patient can register for new visit

**Steps:**
1. [ ] Start typing existing patient name in search
2. [ ] Select patient from autocomplete dropdown
3. [ ] Verify form auto-fills with patient details
4. [ ] Select new doctor (different from previous)
5. [ ] Update consultation fee if needed
6. [ ] Click "Register Patient"
7. [ ] Verify new visit recorded

**Expected Results:**
- [ ] Patient details auto-fill correctly
- [ ] New visit creates transaction record
- [ ] Patient date_of_entry updates to today
- [ ] New queue entry created
- [ ] Previous visit data preserved

**Verification Query:**
```sql
SELECT COUNT(*) as total_visits
FROM patient_transactions
WHERE patient_id = (SELECT patient_id FROM patients WHERE phone = '9999911111');
-- Should show at least 2 visits
```

### Test 5.3: Multiple Doctor Consultation
**Objective:** Verify patient can be assigned to multiple doctors

**Steps:**
1. [ ] Register new patient
2. [ ] Select "Multiple Doctors" mode
3. [ ] Add 2-3 doctors to consultation list
4. [ ] Complete registration
5. [ ] Verify multiple transactions created
6. [ ] Verify total fee is sum of all consultation fees

**Expected Results:**
- [ ] Multiple doctor assignments saved
- [ ] Separate transaction for each doctor
- [ ] Queue entry for primary doctor
- [ ] Total amount calculated correctly

---

## Test Suite 6: Performance & Concurrency

### Test 6.1: Concurrent Registrations
**Objective:** Verify system handles simultaneous users

**Steps:**
1. [ ] Open 5 browser tabs/windows
2. [ ] In each, start registering different patients simultaneously
3. [ ] Click "Register" in all tabs within 10 seconds
4. [ ] Verify all registrations succeed
5. [ ] Verify all UHIDs are unique

**Expected Results:**
- [ ] All 5 patients registered successfully
- [ ] No duplicate UHID errors
- [ ] No lost updates
- [ ] All queue numbers are correct

### Test 6.2: Registration Performance
**Objective:** Verify registration completes in acceptable time

**Steps:**
1. [ ] Note start time
2. [ ] Register a patient with complete details
3. [ ] Note end time when success message appears

**Expected Results:**
- [ ] Registration completes within 3-5 seconds
- [ ] No UI freezing or hanging
- [ ] Smooth user experience

---

## Test Suite 7: Data Integrity

### Test 7.1: UHID Sequence Consistency
**Objective:** Verify UHID sequence never drifts

**Steps:**
1. [ ] Register 10 patients
2. [ ] Run verification query:
   ```sql
   SELECT
       (SELECT current_sequence FROM uhid_config
        WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000') as config_sequence,
       (SELECT MAX(CAST(SUBSTRING(uhid FROM '[0-9]{6}$') AS INTEGER))
        FROM patients WHERE uhid LIKE 'MH-2026-%') as max_uhid_in_db;
   ```
3. [ ] Verify they match

**Expected Results:**
- [ ] config_sequence equals max_uhid_in_db
- [ ] No gap in sequence

### Test 7.2: Foreign Key Integrity
**Objective:** Verify all references are valid

**Steps:**
1. [ ] Run integrity check query:
   ```sql
   -- Check for orphaned queue entries
   SELECT COUNT(*) as orphaned_queue_entries
   FROM opd_queue q
   WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE p.id = q.patient_id)
      OR NOT EXISTS (SELECT 1 FROM doctors d WHERE d.id = q.doctor_id);

   -- Should return 0
   ```

**Expected Results:**
- [ ] Zero orphaned records
- [ ] All foreign keys valid

### Test 7.3: Duplicate Prevention
**Objective:** Verify no duplicate patients can be created

**Steps:**
1. [ ] Register patient with phone 9999922222
2. [ ] Try to register another patient with same phone
3. [ ] Verify system prevents duplicate

**Expected Results:**
- [ ] Duplicate check warns user
- [ ] User can confirm if intentional
- [ ] No silent duplicate creation

---

## Post-Testing Verification

### Database State Check
```sql
-- 1. Verify UHID sequence is in sync
SELECT
    'UHID Sync' as check_name,
    current_sequence as config_seq,
    (SELECT MAX(CAST(SUBSTRING(uhid FROM '[0-9]{6}$') AS INTEGER))
     FROM patients WHERE uhid LIKE 'MH-2026-%') as max_uhid,
    CASE
        WHEN current_sequence = (SELECT MAX(CAST(SUBSTRING(uhid FROM '[0-9]{6}$') AS INTEGER))
                                 FROM patients WHERE uhid LIKE 'MH-2026-%')
        THEN '✅ IN SYNC'
        ELSE '❌ OUT OF SYNC'
    END as status
FROM uhid_config
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- 2. Count today's registrations
SELECT
    'Today Registrations' as check_name,
    COUNT(*) as total_patients,
    COUNT(DISTINCT uhid) as unique_uhids
FROM patients
WHERE DATE(created_at) = CURRENT_DATE;

-- 3. Count today's queue entries
SELECT
    'Today Queue Entries' as check_name,
    COUNT(*) as total_in_queue
FROM opd_queue
WHERE DATE(created_at) = CURRENT_DATE;

-- 4. Verify doctors are active
SELECT
    'Active Doctors' as check_name,
    COUNT(*) as total_active
FROM doctors
WHERE is_active = true;
```

### Frontend Verification
- [ ] Clear browser cache
- [ ] Reload application
- [ ] Verify no console errors
- [ ] Test one final end-to-end registration
- [ ] Confirm all features work

---

## Sign-off Checklist

- [ ] All critical tests passed (no failures in Test Suite 1, 2, 3)
- [ ] At least 90% of all tests passed
- [ ] No data integrity issues found
- [ ] Performance is acceptable
- [ ] Error handling is graceful
- [ ] Database state is consistent
- [ ] Frontend shows no errors
- [ ] Documentation is updated

---

## Rollback Procedure (If Tests Fail)

### Immediate Rollback
```sql
-- 1. Restore database from backup
-- (Use backup created in pre-testing setup)

-- 2. Restore previous code
git checkout HEAD~1 src/services/supabasePatientService.ts
git checkout HEAD~1 src/components/NewFlexiblePatientEntry.tsx

-- 3. Rebuild
npm run build

-- 4. Verify system returns to previous state
```

### Report Issues
If tests fail, document:
1. Which test failed
2. Error messages observed
3. Console logs
4. Database state at time of failure
5. Steps to reproduce

---

## Success Criteria

✅ **Registration Fix Successful If:**
- UHID duplicate errors eliminated (0 occurrences in 50 registrations)
- Doctors dropdown always populated (100% success rate)
- OPD queue auto-addition works (95%+ success rate)
- No data integrity violations
- Acceptable performance (<5 seconds per registration)

---

## Testing Sign-off

| Test Suite | Pass/Fail | Notes | Tester | Date |
|------------|-----------|-------|--------|------|
| UHID Generation | [ ] | | | |
| Doctors Dropdown | [ ] | | | |
| OPD Queue Addition | [ ] | | | |
| Error Handling | [ ] | | | |
| End-to-End Workflow | [ ] | | | |
| Performance | [ ] | | | |
| Data Integrity | [ ] | | | |

**Final Approval:**
- [ ] Ready for production deployment
- [ ] Requires additional fixes

**Approved By:** ________________
**Date:** ________________
