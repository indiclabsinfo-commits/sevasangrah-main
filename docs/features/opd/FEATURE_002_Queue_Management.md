# Feature: Queue Management System with Token Generation

**Feature ID**: FEATURE_002
**Module**: OPD Registration
**Priority**: P0 (Critical - NABH Requirement)
**Status**: Not Started
**Assigned To**: Development Team
**Estimated Effort**: 4 days
**NABH Compliance**: Yes (Patient Flow Management Standard)

---

## 1. Overview

### 1.1 Feature Description
A comprehensive queue management system that generates sequential tokens for OPD patients, manages doctor-wise queues, displays queue status on digital boards, and provides real-time waiting time estimates. The system ensures organized patient flow, reduces crowding, and improves patient experience.

### 1.2 Business Value
- **NABH Compliance**: Required for patient flow management and wait time tracking
- **Patient Satisfaction**: Reduces perceived wait time through transparency
- **Operational Efficiency**: Organizes patient flow, prevents crowding
- **Staff Productivity**: Eliminates manual queue management
- **Data Analytics**: Track peak hours, average wait times, doctor efficiency

### 1.3 User Personas
- **Primary Users**: Frontdesk staff, Patients, Doctors
- **Secondary Users**: Hospital administrators, Queue managers

---

## 2. Business Requirements

### 2.1 Functional Requirements
- [ ] Generate sequential token numbers for patients upon registration
- [ ] Support department-wise and doctor-wise token sequences
- [ ] Display token on patient receipt/slip
- [ ] Real-time queue status display on digital board/TV screens
- [ ] Voice announcement system for token calling (optional)
- [ ] Doctor console to call next patient and update queue status
- [ ] Estimated waiting time calculation based on average consultation time
- [ ] Support for emergency patient priority (skip queue)
- [ ] SMS notification to patient when their turn is approaching
- [ ] Queue status available on mobile app/website
- [ ] Token validity expiration (e.g., token expires after 2 hours)
- [ ] Support for multiple OPD counters/doctors simultaneously
- [ ] Historical queue analytics and reporting

### 2.2 Non-Functional Requirements
- **Performance**: Token generation within 200ms, queue updates within 500ms
- **Scalability**: Support 500+ patients in queue simultaneously
- **Reliability**: 99.9% uptime during OPD hours (8 AM - 8 PM)
- **Usability**: Large font display visible from 20 feet distance
- **Real-time**: Queue status updates within 2 seconds of token call
- **Compliance**: NABH waiting time tracking standards

### 2.3 Acceptance Criteria
- [ ] Patient receives printed token slip with queue number and estimated wait time
- [ ] Digital queue display shows current token, last 5 tokens, and waiting patients
- [ ] Doctor can call next patient with single button click
- [ ] System calculates accurate wait time based on queue position and avg consultation time
- [ ] Emergency patients can be prioritized without disrupting normal queue
- [ ] Queue status accessible via public URL for patients to check from home
- [ ] System automatically resets token sequence daily at midnight

---

## 3. Technical Specification

### 3.1 Database Schema

```sql
-- Queue configuration table
CREATE TABLE queue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(50) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  token_prefix VARCHAR(10) NOT NULL, -- e.g., 'OPD', 'ORTHO', 'CARDIO'
  sequence_start INTEGER DEFAULT 1,
  sequence_end INTEGER DEFAULT 999,
  avg_consultation_minutes INTEGER DEFAULT 15,
  daily_reset_time TIME DEFAULT '00:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Doctor queue configuration
CREATE TABLE doctor_queue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id),
  department_code VARCHAR(50) NOT NULL,
  token_prefix VARCHAR(10) NOT NULL, -- e.g., 'D1', 'D2'
  avg_consultation_minutes INTEGER DEFAULT 15,
  max_daily_tokens INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Queue tokens table
CREATE TABLE queue_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number VARCHAR(20) NOT NULL, -- e.g., 'OPD-001', 'D1-023'
  token_sequence INTEGER NOT NULL,
  patient_id UUID REFERENCES patients(id),
  uhid VARCHAR(20),
  patient_name VARCHAR(255),
  department_code VARCHAR(50),
  doctor_id UUID REFERENCES users(id),
  token_date DATE NOT NULL DEFAULT CURRENT_DATE,
  token_time TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'WAITING',
  -- WAITING, CALLED, IN_CONSULTATION, COMPLETED, EXPIRED, CANCELLED
  priority INTEGER DEFAULT 1, -- 1=Normal, 2=Priority, 3=Emergency
  called_at TIMESTAMP,
  consultation_started_at TIMESTAMP,
  consultation_ended_at TIMESTAMP,
  wait_time_minutes INTEGER, -- Calculated wait time
  consultation_time_minutes INTEGER, -- Actual consultation duration
  counter_number VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queue_tokens_date ON queue_tokens(token_date);
CREATE INDEX idx_queue_tokens_status ON queue_tokens(status);
CREATE INDEX idx_queue_tokens_doctor_id ON queue_tokens(doctor_id);
CREATE UNIQUE INDEX idx_queue_tokens_unique ON queue_tokens(department_code, token_sequence, token_date);

-- Queue display settings
CREATE TABLE queue_display_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(100) NOT NULL,
  department_codes TEXT[], -- Array of departments to show
  show_waiting_count BOOLEAN DEFAULT true,
  show_estimated_time BOOLEAN DEFAULT true,
  show_last_tokens_count INTEGER DEFAULT 5,
  refresh_interval_seconds INTEGER DEFAULT 5,
  voice_announcement_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
```

### 3.2 API Endpoints

#### Endpoint 1: Generate Token
```
Method: POST
Path: /api/queue/generate-token
Authentication: Required
Request Body:
{
  "patientId": "uuid",
  "uhid": "MH2024000001",
  "departmentCode": "OPD",
  "doctorId": "uuid",
  "priority": 1
}
Response:
{
  "status": "success",
  "data": {
    "tokenId": "uuid",
    "tokenNumber": "OPD-042",
    "tokenSequence": 42,
    "queuePosition": 12,
    "estimatedWaitMinutes": 180,
    "estimatedCallTime": "2024-12-24T14:30:00Z"
  }
}
```

#### Endpoint 2: Get Queue Status
```
Method: GET
Path: /api/queue/status?department=OPD&doctorId=uuid
Authentication: Optional (public endpoint)
Response:
{
  "status": "success",
  "data": {
    "currentToken": "OPD-030",
    "waitingTokens": 12,
    "lastCalledTokens": ["OPD-029", "OPD-028", "OPD-027"],
    "averageWaitMinutes": 15,
    "updatedAt": "2024-12-24T12:00:00Z"
  }
}
```

#### Endpoint 3: Call Next Token (Doctor Console)
```
Method: POST
Path: /api/queue/call-next
Authentication: Required (Doctor/Staff only)
Request Body:
{
  "doctorId": "uuid",
  "departmentCode": "OPD",
  "counterNumber": "1"
}
Response:
{
  "status": "success",
  "data": {
    "tokenId": "uuid",
    "tokenNumber": "OPD-031",
    "patientName": "John Doe",
    "uhid": "MH2024000001",
    "waitTimeMinutes": 25
  }
}
```

#### Endpoint 4: Update Token Status
```
Method: PUT
Path: /api/queue/tokens/:tokenId/status
Authentication: Required
Request Body:
{
  "status": "IN_CONSULTATION",
  "notes": "Patient arrived"
}
Response:
{
  "status": "success",
  "data": {
    "tokenId": "uuid",
    "tokenNumber": "OPD-031",
    "status": "IN_CONSULTATION",
    "updatedAt": "2024-12-24T12:05:00Z"
  }
}
```

#### Endpoint 5: Get Queue Analytics
```
Method: GET
Path: /api/queue/analytics?date=2024-12-24&department=OPD
Authentication: Required (Admin only)
Response:
{
  "status": "success",
  "data": {
    "totalTokens": 150,
    "completedTokens": 120,
    "averageWaitMinutes": 18,
    "averageConsultationMinutes": 12,
    "peakHour": "10:00-11:00",
    "tokensPerHour": {...}
  }
}
```

### 3.3 Frontend Components

**File Structure**:
```
src/
├── components/
│   └── Queue/
│       ├── TokenGenerator.tsx         # Generate token for patient
│       ├── DoctorConsole.tsx         # Doctor's queue management
│       ├── QueueDisplay.tsx          # Digital board display
│       ├── TokenSlip.tsx             # Printable token slip
│       ├── QueueStatusCard.tsx       # Queue status widget
│       └── QueueAnalyticsDashboard.tsx # Analytics
├── pages/
│   └── Queue/
│       ├── QueueManagement.tsx       # Admin queue config
│       └── PublicQueueStatus.tsx     # Public queue display
├── services/
│   └── queueService.ts               # Queue API calls
└── types/
    └── queue.ts                       # Queue TypeScript types
```

**Key Components**:
- `TokenGenerator`: Embedded in patient registration, auto-generates token on save
- `DoctorConsole`: Dashboard for doctors to view queue, call next patient
- `QueueDisplay`: Full-screen TV display showing current token, waiting count
- `TokenSlip`: Printable component with token number, QR code, estimated time
- `QueueStatusCard`: Widget shown on homepage for patients to check status

### 3.4 State Management
- **Global State**: Active queues, real-time token updates (WebSocket)
- **Local State**: Token generation form, doctor console filters
- **API Cache**: Queue status (React Query with 5s stale time for real-time updates)

### 3.5 Validation Rules
```typescript
import { z } from 'zod';

export const tokenGenerationSchema = z.object({
  patientId: z.string().uuid(),
  uhid: z.string().regex(/^[A-Z]{2}\d{10,12}$/),
  departmentCode: z.string().min(2).max(50),
  doctorId: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(3).default(1)
});

export const queueConfigSchema = z.object({
  departmentCode: z.string().min(2).max(50),
  tokenPrefix: z.string().min(1).max(10),
  avgConsultationMinutes: z.number().int().min(5).max(120),
  sequenceStart: z.number().int().min(1).default(1),
  sequenceEnd: z.number().int().max(9999).default(999)
});
```

### 3.6 Error Handling
- **User Errors**:
  - "Queue is full for today" - Show message to visit tomorrow
  - "Token already generated for this patient today" - Show existing token
- **System Errors**:
  - "Failed to generate token" - Retry with manual token number assignment
  - "WebSocket connection lost" - Fall back to polling every 5 seconds
- **Edge Cases**:
  - Token sequence exhausted - Auto-extend sequence or alert admin
  - Multiple doctors calling same token - Lock token when called

---

## 4. User Interface

### 4.1 Token Slip Design (Printable 3" x 4")

```
┌──────────────────────────────────────┐
│      MAGNUS HOSPITAL                 │
│      OPD Queue Token                 │
│                                      │
│      Token Number                    │
│      ╔══════════════╗                │
│      ║   OPD-042    ║                │
│      ╚══════════════╝                │
│                                      │
│      [QR CODE]                       │
│                                      │
│      Patient: John Doe               │
│      UHID: MH2024000001              │
│      Doctor: Dr. Smith               │
│      Date: 24-Dec-2024               │
│      Time: 10:30 AM                  │
│                                      │
│      Queue Position: 12              │
│      Est. Wait Time: ~3 hours        │
│      Est. Call Time: ~02:00 PM       │
│                                      │
│      Please wait in OPD waiting area │
│      Monitor the display board       │
└──────────────────────────────────────┘
```

### 4.2 Digital Queue Display (TV Screen - 1920x1080)

```
┌────────────────────────────────────────────────────────┐
│  MAGNUS HOSPITAL - OPD QUEUE STATUS                    │
│                                         12:45 PM        │
├────────────────────────────────────────────────────────┤
│                                                         │
│        NOW SERVING                                      │
│        ╔═══════════════════╗                           │
│        ║     OPD-030       ║                           │
│        ╚═══════════════════╝                           │
│        Counter 1 - Dr. Smith                           │
│                                                         │
├────────────────────────────────────────────────────────┤
│  Last Called Tokens:                                   │
│  OPD-029  |  OPD-028  |  OPD-027  |  OPD-026           │
├────────────────────────────────────────────────────────┤
│  Waiting Tokens: 12                                    │
│  Average Wait Time: 15 minutes                         │
│                                                         │
│  Next in Queue: OPD-031, OPD-032, OPD-033              │
└────────────────────────────────────────────────────────┘
```

### 4.3 Doctor Console Interface

```
┌─────────────────────────────────────────┐
│  Doctor Queue Console - Dr. Smith       │
├─────────────────────────────────────────┤
│  Current Token: OPD-030                 │
│  Patient: John Doe (MH2024000001)       │
│  Wait Time: 25 minutes                  │
│                                          │
│  [✓ Mark Complete] [⏭️ Call Next]       │
├─────────────────────────────────────────┤
│  Waiting Queue (12 patients)            │
│  ┌──────────────────────────────────┐  │
│  │ OPD-031  Jane Smith   Normal     │  │
│  │ OPD-032  Bob Jones    Normal     │  │
│  │ OPD-033  Alice Brown  Priority   │  │
│  │ OPD-034  Charlie Davis Emergency │  │
│  └──────────────────────────────────┘  │
│                                          │
│  Today's Statistics:                    │
│  • Patients Seen: 30                    │
│  • Avg Wait: 18 min                     │
│  • Avg Consult: 12 min                  │
└─────────────────────────────────────────┘
```

### 4.4 User Flow

**Patient Receives Token**:
1. Frontdesk registers patient (existing flow)
2. System auto-generates token: OPD-042
3. Token details shown on screen with estimated wait time
4. Staff prints token slip for patient
5. Patient receives SMS: "Your token OPD-042 for Dr. Smith. Est. wait: 3 hours. Track: https://queue.magnushospital.com/OPD-042"

**Doctor Calls Next Patient**:
1. Doctor clicks "Call Next" button in console
2. System fetches next waiting token based on priority
3. Queue display updates: "NOW SERVING: OPD-031"
4. Patient's phone receives notification
5. Voice announcement: "Token OPD-031, please proceed to Counter 1"
6. Doctor clicks "Mark Complete" when consultation ends
7. System logs consultation duration, updates analytics

---

## 5. User Guide

### 5.1 How to Access
- **Frontdesk**: OPD → Patient Registration (token auto-generated)
- **Doctor**: Dashboard → My Queue Console
- **Patient**: Public URL: https://queue.magnushospital.com or scan QR code on token slip
- **Admin**: Queue Management → Configure Queues

### 5.2 Step-by-Step Instructions

#### Task 1: Generate Token for New Patient
1. Register patient normally through OPD form
2. Select doctor from dropdown
3. Click "Save Patient"
4. System automatically generates token (e.g., OPD-042)
5. Token details appear on screen
6. Click "Print Token Slip" button
7. Hand slip to patient, explain waiting area and display board

#### Task 2: Call Next Patient (Doctor Console)
1. Open "My Queue Console" from dashboard
2. View current queue: 12 waiting patients
3. Complete current consultation, click "Mark Complete"
4. Click "Call Next" button
5. System displays next patient: Token OPD-031, John Doe
6. Patient receives notification
7. Wait for patient to arrive at counter
8. Start consultation

#### Task 3: Check Queue Status (Patient)
1. Scan QR code on token slip OR visit public URL
2. Enter token number: OPD-042
3. View queue status:
   - Current serving: OPD-030
   - Your position: 12
   - Estimated wait: 3 hours
   - Estimated call time: 2:00 PM
4. Refresh page for updated status

### 5.3 Common Scenarios

- **Scenario 1: Emergency Patient Needs Priority**
  - Frontdesk marks patient as "Emergency" (priority 3)
  - System assigns token with emergency prefix: EM-001
  - Doctor console shows emergency patients at top in red
  - Doctor calls emergency patient before normal queue

- **Scenario 2: Patient Missed Their Token**
  - Doctor console shows "Calling OPD-035"
  - Patient doesn't arrive within 5 minutes
  - Doctor clicks "Skip to Next" button
  - OPD-035 moves to end of queue with status "Missed"
  - Patient can reclaim token at frontdesk

### 5.4 Troubleshooting

- **Issue: "Token already generated for this patient today"**
  - Solution: Search existing token, reprint slip. If patient needs new consultation, mark old token as cancelled.

- **Issue: Queue display not updating**
  - Solution: Check internet connection. Display refreshes every 5 seconds. Press F5 to force refresh.

---

## 6. Testing

### 6.1 Unit Tests
- [ ] Test token number generation follows sequence
- [ ] Test priority sorting (Emergency > Priority > Normal)
- [ ] Test wait time calculation accuracy
- [ ] Test token expiration after configured hours
- [ ] Test daily token sequence reset at midnight

### 6.2 Integration Tests
- [ ] Test token generation during patient registration
- [ ] Test real-time queue updates across multiple clients
- [ ] Test SMS notification delivery on token call
- [ ] Test doctor console calling next patient
- [ ] Test queue analytics calculation

### 6.3 E2E Tests
- [ ] Register patient and verify token generation
- [ ] View queue status on public display
- [ ] Doctor calls next patient, verify display updates
- [ ] Patient checks status via mobile, verify accuracy
- [ ] Complete consultation, verify analytics updated

### 6.4 Load Testing
- [ ] Generate 500 tokens simultaneously
- [ ] 50 concurrent users checking queue status
- [ ] Multiple doctors calling patients concurrently

---

## 7. Deployment

### 7.1 Environment Variables
```env
QUEUE_RESET_TIME=00:00:00
QUEUE_TOKEN_EXPIRY_HOURS=3
QUEUE_DISPLAY_REFRESH_SECONDS=5
QUEUE_SMS_ENABLED=true
QUEUE_VOICE_ANNOUNCEMENT_ENABLED=false
```

### 7.2 Database Migrations
```bash
psql -h sevasangraha.postgres.database.azure.com -U divyansh04 -d postgres -f docs/database/migration_scripts/003_queue_management.sql
```

### 7.3 WebSocket Setup
- Install Socket.IO for real-time queue updates
- Configure CORS for public queue display
- Set up Redis for WebSocket scaling across multiple servers

---

## 8. Dependencies

### 8.1 Technical Dependencies
- **NPM Packages**:
  - `socket.io-client` - Real-time queue updates
  - `qrcode.react` - QR code on token slip
  - `react-to-print` - Print token slip
  - `date-fns` - Time calculations
- **APIs**: SMS gateway for patient notifications
- **Services**: WebSocket server for real-time updates

### 8.2 Feature Dependencies
- **Prerequisite Features**:
  - FEATURE_001: UHID Generation (token linked to UHID)
  - Patient registration system
- **Related Features**:
  - FEATURE_003: TAT Tracking (wait time metrics)
  - Doctor schedule management

---

## 9. Security & Permissions

### 9.1 Role-Based Access
- **Admin**: Full queue management, configuration, analytics
- **Doctor**: View own queue, call next patient, mark complete
- **Frontdesk**: Generate tokens, view all queues, reprint slips
- **Patient**: View queue status (no authentication required)

### 9.2 Data Protection
- **Public Display**: Only show token number, no patient names on TV
- **Doctor Console**: Full patient details visible to assigned doctor only
- **API Security**: Public endpoints rate-limited (100 req/min per IP)

---

## 10. Related Features

- **FEATURE_001**: UHID Generation - Token linked to UHID
- **FEATURE_003**: TAT Tracking - Queue wait time feeds into TAT metrics
- **FEATURE_010**: SMS Notifications - Token call alerts

---

## 11. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-24 | 1.0 | Development Team | Initial documentation |

---

## 12. Known Issues

- [ ] None yet - feature not implemented

---

## 13. Future Enhancements

- [ ] Mobile app for patients to join queue remotely
- [ ] WhatsApp integration for queue status updates
- [ ] Video consultation integration for remote queuing
- [ ] AI-based wait time prediction using historical patterns
- [ ] Multi-language support for queue display

---

## 14. References

- **NABH Standards**: NABH 5th Edition - Patient Flow Management (ACC.4)
- **Industry Best Practices**: WHO guidelines on outpatient queue management
- **Technical References**: WebSocket real-time communication patterns

---

**Last Updated**: 2024-12-24
**Reviewed By**: Pending
**Approved By**: Pending
