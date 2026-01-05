# Feature: TAT (Turnaround Time) Tracking System

**Feature ID**: FEATURE_003
**Module**: NABH Compliance / All Departments
**Priority**: P0 (Critical - NABH Requirement)
**Status**: Not Started
**Assigned To**: Development Team
**Estimated Effort**: 5 days
**NABH Compliance**: Yes (Mandatory - TAT Monitoring Standard)

---

## 1. Overview

### 1.1 Feature Description
TAT (Turnaround Time) tracking system monitors and reports the time taken for various hospital processes from initiation to completion. This includes OPD wait times, lab test processing, pharmacy dispensing, billing, admissions, and more. The system provides real-time TAT dashboards, alerts when TAT thresholds are exceeded, and generates compliance reports for NABH audits.

### 1.2 Business Value
- **NABH Compliance**: Mandatory requirement for NABH accreditation (QMS.6)
- **Process Improvement**: Identifies bottlenecks and delays in hospital workflows
- **Patient Satisfaction**: Reduces wait times through monitoring and optimization
- **Quality Management**: Tracks service quality metrics
- **Performance Accountability**: Monitors department and staff efficiency
- **Audit Readiness**: Automated TAT reports for NABH audits

### 1.3 User Personas
- **Primary Users**: Quality managers, Department heads, Hospital administrators
- **Secondary Users**: Doctors, Lab technicians, Pharmacy staff, Frontdesk

---

## 2. Business Requirements

### 2.1 Functional Requirements

#### TAT Tracking for Key Processes:
- [ ] **OPD Registration to Doctor Consultation**: Target <30 minutes
- [ ] **Doctor Consultation Duration**: Target 10-15 minutes
- [ ] **Billing to Payment**: Target <5 minutes
- [ ] **Pharmacy Order to Dispensing**: Target <15 minutes (routine), <5 min (urgent)
- [ ] **Lab Sample Collection to Report**: Target varies by test type
  - Routine blood tests: <4 hours
  - Urgent/STAT tests: <1 hour
  - Culture tests: 24-72 hours
- [ ] **X-Ray/Imaging to Report**: Target <2 hours (routine), <30 min (urgent)
- [ ] **IPD Admission to Bed Allocation**: Target <1 hour
- [ ] **Discharge Summary Preparation**: Target <24 hours
- [ ] **Emergency Response Time**: Target <15 minutes

#### System Features:
- [ ] Define TAT thresholds for each process type
- [ ] Track start time and end time for each process automatically
- [ ] Calculate TAT in minutes/hours/days based on process
- [ ] Color-coded TAT status (Green: Within TAT, Yellow: Approaching, Red: Exceeded)
- [ ] Real-time TAT alerts when threshold exceeded
- [ ] TAT dashboard showing all processes and their current status
- [ ] Historical TAT trend analysis with charts
- [ ] Department-wise TAT performance reports
- [ ] Staff-wise TAT performance (e.g., doctor consultation times)
- [ ] Export TAT reports to PDF/Excel for NABH audits
- [ ] TAT SLA (Service Level Agreement) tracking
- [ ] Reason codes for TAT breaches (e.g., "Equipment failure", "Patient delay")

### 2.2 Non-Functional Requirements
- **Performance**: TAT calculation within 100ms
- **Accuracy**: Timestamp precision to the second
- **Real-time**: Dashboard updates within 5 seconds
- **Scalability**: Track 10,000+ TAT events per day
- **Compliance**: Meet NABH TAT monitoring standards (QMS.6)
- **Auditability**: Immutable TAT logs with timestamps and user IDs

### 2.3 Acceptance Criteria
- [ ] All key hospital processes automatically track start and end times
- [ ] TAT dashboard shows real-time status with color-coded indicators
- [ ] Alerts sent to department heads when TAT exceeded
- [ ] Monthly TAT compliance reports generated automatically
- [ ] TAT data feeds into quality improvement initiatives
- [ ] System prevents TAT timestamp manipulation
- [ ] TAT reports include percentile analysis (50th, 75th, 90th percentile)

---

## 3. Technical Specification

### 3.1 Database Schema

```sql
-- TAT Process Definitions
CREATE TABLE tat_process_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_code VARCHAR(50) UNIQUE NOT NULL,
  process_name VARCHAR(255) NOT NULL,
  process_description TEXT,
  department_code VARCHAR(50),
  target_tat_minutes INTEGER NOT NULL,
  warning_threshold_minutes INTEGER, -- Yellow alert threshold
  critical_threshold_minutes INTEGER, -- Red alert threshold
  unit VARCHAR(20) DEFAULT 'MINUTES', -- MINUTES, HOURS, DAYS
  is_active BOOLEAN DEFAULT true,
  nabh_reference VARCHAR(100), -- NABH standard reference
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert standard TAT definitions
INSERT INTO tat_process_definitions (process_code, process_name, department_code, target_tat_minutes, warning_threshold_minutes, critical_threshold_minutes) VALUES
('OPD_REG_TO_CONSULT', 'OPD Registration to Doctor Consultation', 'OPD', 30, 25, 35),
('OPD_CONSULT_DURATION', 'Doctor Consultation Duration', 'OPD', 15, 20, 30),
('BILLING_TO_PAYMENT', 'Billing to Payment Completion', 'BILLING', 5, 4, 7),
('PHARMACY_DISPENSING', 'Pharmacy Order to Dispensing', 'PHARMACY', 15, 12, 20),
('LAB_ROUTINE_BLOOD', 'Lab Routine Blood Test', 'LAB', 240, 210, 300),
('LAB_STAT_TEST', 'Lab STAT/Urgent Test', 'LAB', 60, 50, 75),
('XRAY_ROUTINE', 'X-Ray Routine to Report', 'RADIOLOGY', 120, 100, 150),
('XRAY_URGENT', 'X-Ray Urgent to Report', 'RADIOLOGY', 30, 25, 40),
('IPD_ADMISSION_TO_BED', 'IPD Admission to Bed Allocation', 'IPD', 60, 50, 90),
('DISCHARGE_SUMMARY', 'Discharge Summary Preparation', 'IPD', 1440, 1200, 1800), -- 24 hours
('EMERGENCY_RESPONSE', 'Emergency Response Time', 'EMERGENCY', 15, 10, 20);

-- TAT Events Tracking
CREATE TABLE tat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_code VARCHAR(50) NOT NULL REFERENCES tat_process_definitions(process_code),
  entity_type VARCHAR(50) NOT NULL, -- PATIENT, APPOINTMENT, ORDER, ADMISSION
  entity_id UUID NOT NULL, -- ID of patient/appointment/order
  entity_reference VARCHAR(100), -- UHID, Order Number, etc.
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  tat_minutes INTEGER, -- Calculated TAT
  tat_status VARCHAR(20), -- WITHIN_TAT, APPROACHING, EXCEEDED
  target_tat_minutes INTEGER, -- Snapshot of target at event time
  department_code VARCHAR(50),
  responsible_user_id UUID REFERENCES users(id),
  breach_reason_code VARCHAR(50),
  breach_reason_notes TEXT,
  metadata JSONB, -- Additional context (patient name, test name, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tat_events_process_code ON tat_events(process_code);
CREATE INDEX idx_tat_events_start_time ON tat_events(start_time);
CREATE INDEX idx_tat_events_status ON tat_events(tat_status);
CREATE INDEX idx_tat_events_entity ON tat_events(entity_type, entity_id);

-- TAT Breach Reason Codes
CREATE TABLE tat_breach_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason_code VARCHAR(50) UNIQUE NOT NULL,
  reason_name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- SYSTEM, STAFF, PATIENT, EQUIPMENT, EXTERNAL
  is_active BOOLEAN DEFAULT true
);

INSERT INTO tat_breach_reasons (reason_code, reason_name, category) VALUES
('PATIENT_DELAYED', 'Patient arrived late or delayed response', 'PATIENT'),
('STAFF_SHORTAGE', 'Insufficient staff available', 'STAFF'),
('EQUIPMENT_FAILURE', 'Equipment malfunction or unavailability', 'EQUIPMENT'),
('SYSTEM_DOWNTIME', 'System/network downtime', 'SYSTEM'),
('HIGH_VOLUME', 'Unusually high patient volume', 'EXTERNAL'),
('SAMPLE_REJECTED', 'Lab sample rejected, recollection needed', 'PATIENT'),
('DOCTOR_EMERGENCY', 'Doctor attending to emergency case', 'STAFF'),
('POWER_OUTAGE', 'Power failure', 'EXTERNAL');

-- TAT Alerts
CREATE TABLE tat_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tat_event_id UUID NOT NULL REFERENCES tat_events(id),
  alert_type VARCHAR(50) NOT NULL, -- WARNING, CRITICAL
  alert_message TEXT,
  sent_to_user_ids UUID[], -- Array of user IDs to notify
  sent_at TIMESTAMP DEFAULT NOW(),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP
);
```

### 3.2 API Endpoints

#### Endpoint 1: Start TAT Tracking
```
Method: POST
Path: /api/tat/start
Authentication: Required
Request Body:
{
  "processCode": "OPD_REG_TO_CONSULT",
  "entityType": "PATIENT",
  "entityId": "patient-uuid",
  "entityReference": "MH2024000001",
  "responsibleUserId": "user-uuid",
  "metadata": {
    "patientName": "John Doe",
    "doctorName": "Dr. Smith"
  }
}
Response:
{
  "status": "success",
  "data": {
    "tatEventId": "uuid",
    "processCode": "OPD_REG_TO_CONSULT",
    "startTime": "2024-12-24T10:00:00Z",
    "targetTatMinutes": 30,
    "expectedEndTime": "2024-12-24T10:30:00Z"
  }
}
```

#### Endpoint 2: End TAT Tracking
```
Method: PUT
Path: /api/tat/events/:tatEventId/end
Authentication: Required
Request Body:
{
  "endTime": "2024-12-24T10:35:00Z", // Optional, defaults to NOW()
  "breachReasonCode": "PATIENT_DELAYED", // Optional, only if TAT exceeded
  "breachReasonNotes": "Patient was in bathroom"
}
Response:
{
  "status": "success",
  "data": {
    "tatEventId": "uuid",
    "tatMinutes": 35,
    "tatStatus": "EXCEEDED",
    "targetTatMinutes": 30,
    "breachByMinutes": 5
  }
}
```

#### Endpoint 3: Get Real-Time TAT Dashboard
```
Method: GET
Path: /api/tat/dashboard?date=2024-12-24&department=OPD
Authentication: Required
Response:
{
  "status": "success",
  "data": {
    "date": "2024-12-24",
    "department": "OPD",
    "summary": {
      "totalEvents": 50,
      "withinTat": 42,
      "approaching": 5,
      "exceeded": 3,
      "complianceRate": 84.0
    },
    "activeEvents": [
      {
        "processName": "OPD Registration to Consultation",
        "patientName": "John Doe",
        "uhid": "MH2024000001",
        "startTime": "2024-12-24T10:00:00Z",
        "elapsedMinutes": 28,
        "targetMinutes": 30,
        "status": "APPROACHING",
        "remainingMinutes": 2
      }
    ],
    "recentBreaches": [...]
  }
}
```

#### Endpoint 4: Get TAT Analytics
```
Method: GET
Path: /api/tat/analytics?startDate=2024-12-01&endDate=2024-12-31&processCode=OPD_REG_TO_CONSULT
Authentication: Required (Admin/QM)
Response:
{
  "status": "success",
  "data": {
    "processCode": "OPD_REG_TO_CONSULT",
    "period": "2024-12-01 to 2024-12-31",
    "totalEvents": 500,
    "complianceRate": 87.5,
    "avgTatMinutes": 26.3,
    "medianTatMinutes": 25,
    "percentiles": {
      "p50": 25,
      "p75": 30,
      "p90": 35,
      "p95": 40
    },
    "breachAnalysis": {
      "totalBreaches": 63,
      "breachRate": 12.5,
      "topReasons": [
        {"reasonCode": "HIGH_VOLUME", "count": 25},
        {"reasonCode": "PATIENT_DELAYED", "count": 18}
      ]
    },
    "trendData": [
      {"date": "2024-12-01", "avgTat": 28, "complianceRate": 85},
      {"date": "2024-12-02", "avgTat": 26, "complianceRate": 90}
    ]
  }
}
```

#### Endpoint 5: Export TAT Report
```
Method: POST
Path: /api/tat/reports/export
Authentication: Required (Admin/QM)
Request Body:
{
  "reportType": "NABH_COMPLIANCE",
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "departments": ["OPD", "LAB", "PHARMACY"],
  "format": "PDF"
}
Response: PDF file download
```

### 3.3 Frontend Components

**File Structure**:
```
src/
├── components/
│   └── TAT/
│       ├── TATDashboard.tsx          # Real-time TAT dashboard
│       ├── TATProcessCard.tsx        # Individual process TAT status
│       ├── TATAlertPanel.tsx         # Active TAT alerts
│       ├── TATTrendChart.tsx         # Historical TAT trends
│       ├── TATBreachReasonModal.tsx  # Capture breach reasons
│       └── TATComplianceReport.tsx   # Compliance reports
├── pages/
│   └── TAT/
│       ├── TATManagement.tsx         # TAT configuration
│       └── TATAnalytics.tsx          # Analytics and reports
├── services/
│   └── tatService.ts                 # TAT API calls
└── types/
    └── tat.ts                         # TAT TypeScript types
```

### 3.4 Auto-TAT Tracking Integration

**Automatic TAT tracking hooks in existing processes**:

```typescript
// In patient registration service
async function createPatient(patientData) {
  const patient = await db.patients.create(patientData);

  // Auto-start TAT: Registration to Consultation
  await tatService.startTracking({
    processCode: 'OPD_REG_TO_CONSULT',
    entityType: 'PATIENT',
    entityId: patient.id,
    entityReference: patient.uhid
  });

  return patient;
}

// When doctor starts consultation
async function startConsultation(appointmentId) {
  // End TAT: Registration to Consultation
  await tatService.endTracking({
    processCode: 'OPD_REG_TO_CONSULT',
    entityId: appointmentId
  });

  // Start TAT: Consultation Duration
  await tatService.startTracking({
    processCode: 'OPD_CONSULT_DURATION',
    entityType: 'APPOINTMENT',
    entityId: appointmentId
  });
}

// When pharmacy receives order
async function createPharmacyOrder(orderData) {
  const order = await db.pharmacyOrders.create(orderData);

  await tatService.startTracking({
    processCode: 'PHARMACY_DISPENSING',
    entityType: 'ORDER',
    entityId: order.id
  });

  return order;
}
```

### 3.5 Validation Rules
```typescript
import { z } from 'zod';

export const tatEventSchema = z.object({
  processCode: z.string().min(1),
  entityType: z.enum(['PATIENT', 'APPOINTMENT', 'ORDER', 'ADMISSION']),
  entityId: z.string().uuid(),
  entityReference: z.string().optional(),
  responsibleUserId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
});

export const tatEndEventSchema = z.object({
  endTime: z.string().datetime().optional(),
  breachReasonCode: z.string().optional(),
  breachReasonNotes: z.string().max(500).optional()
});
```

---

## 4. User Interface

### 4.1 Real-Time TAT Dashboard

```
┌────────────────────────────────────────────────────────────┐
│  TAT Dashboard - Quality Management           24-Dec-2024  │
│  Department: All ▼          Refresh: 5s                    │
├────────────────────────────────────────────────────────────┤
│  Overall Compliance: 87.5% ████████████████░░              │
│                                                             │
│  Active Processes (12)                                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🟢 OPD Reg to Consult    John Doe (MH001)            │ │
│  │    28/30 min   [████████████████░░]  2 min left      │ │
│  │                                                       │ │
│  │ 🟡 Lab Blood Test        Jane Smith (MH002)          │ │
│  │    210/240 min [███████████████░░░]  30 min left     │ │
│  │                                                       │ │
│  │ 🔴 Pharmacy Dispensing   Bob Jones (MH003)           │ │
│  │    22/15 min   [████████████████████] EXCEEDED +7    │ │
│  │    [Record Reason]                                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Today's Summary                                           │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │ Within TAT   │ Approaching  │ Exceeded     │           │
│  │    42 (84%)  │    5 (10%)   │    3 (6%)    │           │
│  │    🟢        │    🟡        │    🔴        │           │
│  └──────────────┴──────────────┴──────────────┘           │
│                                                             │
│  Top TAT Breaches Today                                    │
│  • Pharmacy Dispensing (3 breaches) - High Volume         │
│  • Lab Routine Blood (2 breaches) - Equipment Failure     │
└────────────────────────────────────────────────────────────┘
```

### 4.2 TAT Analytics Chart

```
TAT Trend - OPD Registration to Consultation (Last 30 Days)

Avg TAT (minutes)
    40 │
       │                      ●
    35 │         ●       ●        ●
       │    ●        ●               ●
    30 │●                                 ●   ● (Target)
       │                                     ●
    25 │
       │
    20 │
       └──────────────────────────────────────────
         1   5   10  15  20  25  30 (Days)

Compliance Rate: 87.5% (438/500 within TAT)
Avg TAT: 26.3 minutes (Target: 30 minutes)
Median TAT: 25 minutes
90th Percentile: 35 minutes
```

---

## 5. User Guide

### 5.1 How to Access
- **Quality Manager**: Dashboard → TAT Management → TAT Dashboard
- **Department Head**: Dashboard → My Department TAT
- **Admin**: Settings → TAT Configuration

### 5.2 Step-by-Step Instructions

#### Task 1: View Real-Time TAT Dashboard
1. Navigate to "TAT Dashboard"
2. Select department filter (or "All")
3. View active processes with color-coded status
4. Monitor processes approaching TAT (yellow)
5. Address processes exceeding TAT (red)

#### Task 2: Record Breach Reason
1. When TAT exceeded, "Record Reason" button appears
2. Click button to open breach reason modal
3. Select reason code from dropdown (e.g., "High Volume")
4. Add detailed notes (optional)
5. Click "Save"
6. Reason logged for quality improvement analysis

#### Task 3: Generate TAT Compliance Report
1. Navigate to "TAT Analytics"
2. Select date range (e.g., Last Month)
3. Select departments to include
4. Click "Generate NABH Report"
5. System generates PDF with:
   - Overall compliance rates
   - Department-wise breakdown
   - Breach analysis
   - Trend charts
6. Download PDF for NABH audit

---

## 6. Testing

### 6.1 Unit Tests
- [ ] Test TAT calculation accuracy (start time to end time)
- [ ] Test TAT status determination (WITHIN_TAT, APPROACHING, EXCEEDED)
- [ ] Test percentile calculations (50th, 75th, 90th)
- [ ] Test alert triggering at warning/critical thresholds
- [ ] Test TAT auto-tracking integration with patient registration

### 6.2 Integration Tests
- [ ] Test end-to-end TAT tracking for OPD patient journey
- [ ] Test TAT dashboard real-time updates
- [ ] Test TAT alert notifications to department heads
- [ ] Test TAT report generation for NABH compliance
- [ ] Test TAT breach reason capture and analysis

---

## 7. Deployment

### 7.1 Environment Variables
```env
TAT_ALERT_WARNING_ENABLED=true
TAT_ALERT_CRITICAL_ENABLED=true
TAT_DASHBOARD_REFRESH_SECONDS=5
TAT_AUTO_TRACKING_ENABLED=true
```

### 7.2 Database Migrations
```bash
psql -h sevasangraha.postgres.database.azure.com -U divyansh04 -d postgres -f docs/database/migration_scripts/004_tat_tracking.sql
```

---

## 8. Dependencies

### 8.1 Technical Dependencies
- **NPM Packages**:
  - `recharts` - TAT trend charts
  - `date-fns` - Time calculations
  - `react-query` - Real-time dashboard updates

### 8.2 Feature Dependencies
- **Prerequisite Features**: All core modules (OPD, IPD, Lab, Pharmacy, etc.)
- **Related Features**:
  - FEATURE_002: Queue Management (wait time is a TAT metric)
  - Dashboard analytics

---

## 9. Security & Permissions

### 9.1 Role-Based Access
- **Admin/QM**: Full TAT management, configuration, reports
- **Department Head**: View own department TAT, record breach reasons
- **Staff**: View relevant TAT metrics for their work
- **Auditor**: Read-only access to TAT reports

---

## 10. Related Features

- **FEATURE_002**: Queue Management - OPD wait time TAT
- **All Lab Features**: Lab test TAT tracking
- **All Pharmacy Features**: Pharmacy dispensing TAT

---

## 11. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-24 | 1.0 | Development Team | Initial documentation |

---

**Last Updated**: 2024-12-24
**Reviewed By**: Pending
**Approved By**: Pending
