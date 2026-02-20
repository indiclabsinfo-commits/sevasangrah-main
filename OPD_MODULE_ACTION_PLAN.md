# OPD MODULE - CLIENT TESTING ACTION PLAN
## Making OPD Production-Ready for A-Grade SaaS Hospital CRM

**Current Status**: 68% Production Ready (28/41 features fully working)
**Target**: 95% Production Ready for Client Testing
**Timeline**: 3-5 Days for Critical Fixes

---

## PHASE 1: CRITICAL FIXES (DO FIRST - 24-48 Hours)

### 1. WhatsApp Integration ⚡ HIGH PRIORITY
**Current**: Only SMS implemented
**Required**: WhatsApp appointment reminders and notifications

**Files to Modify**:
- `src/services/smsService.ts` → `src/services/notificationService.ts`

**Implementation Steps**:
```typescript
// Add WhatsApp support to existing SMS service
private static async sendViaWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append('To', `whatsapp:${to}`); // WhatsApp prefix
  formData.append('From', `whatsapp:${this.config.fromNumber}`);
  formData.append('Body', message);

  // Rest of implementation same as SMS
}

// Add method to send to both SMS and WhatsApp
static async sendNotification(
  phoneNumber: string,
  message: string,
  channel: 'sms' | 'whatsapp' | 'both' = 'both'
) {
  if (channel === 'both' || channel === 'sms') {
    await this.sendViaTwilio(phoneNumber, message);
  }
  if (channel === 'both' || channel === 'whatsapp') {
    await this.sendViaWhatsApp(phoneNumber, message);
  }
}
```

**Configuration Required**:
```.env
# Add to .env file
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
VITE_WHATSAPP_ENABLED=true
```

**Testing Checklist**:
- [ ] Appointment confirmation sent to WhatsApp
- [ ] Registration confirmation sent to WhatsApp
- [ ] Appointment reminder sent 24 hours before
- [ ] Messages appear in WhatsApp correctly formatted

---

### 2. Fix Waiting Hall Display (Mock Data Issue) 🎯
**Current**: Shows hardcoded mock data
**Required**: Real-time queue data

**File**: `src/components/WaitingHallDisplay.tsx`

**Fix**:
```typescript
// Replace mock data with real data from queue service
const [queueData, setQueueData] = useState([]);

useEffect(() => {
  const fetchQueue = async () => {
    const queues = await SupabaseHospitalService.getOPDQueues();
    setQueueData(queues);
  };

  fetchQueue();
  const interval = setInterval(fetchQueue, 30000); // Refresh every 30 sec
  return () => clearInterval(interval);
}, []);
```

**Testing**:
- [ ] Display shows actual queue numbers
- [ ] Updates when patient status changes
- [ ] Shows correct doctor names
- [ ] Wait time estimates are accurate

---

### 3. Complete MIS Reports & Dashboard 📊
**Current**: Basic stats only
**Required**: Comprehensive OPD reports

**Files to Create**:
- `src/components/OPD/OPDReports.tsx`
- `src/components/OPD/OPDDashboard.tsx`

**Reports to Implement**:

1. **Daily OPD Register**
   - Serial number
   - UHID
   - Patient name, age, gender
   - Doctor name
   - Diagnosis
   - Treatment
   - Follow-up date

2. **Doctor-wise Patient Count**
   - Doctor name
   - Total patients seen
   - Average consultation time
   - TAT breaches

3. **Department-wise Statistics**
   - Department
   - Patient count
   - Revenue generated
   - Average wait time

4. **Monthly Trends**
   - Patient registrations (line graph)
   - Appointment completion rate
   - TAT performance
   - Peak hours analysis

**Export Functionality**:
```typescript
// Add export to Excel
import * as XLSX from 'xlsx';

const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'OPD Report');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString()}.xlsx`);
};
```

**Testing**:
- [ ] All reports generate correctly
- [ ] Date filtering works
- [ ] Export to Excel functional
- [ ] Export to PDF functional
- [ ] Graphs render properly

---

### 4. Connect Teleconsult to Video SDK 🎥
**Current**: Mock join URLs
**Required**: Real video conferencing

**Recommended SDK**: Jitsi Meet (Free, open-source)

**Installation**:
```bash
npm install @jitsi/react-sdk
```

**Implementation** (`src/components/TeleconsultAppointment.tsx`):
```typescript
import { JitsiMeeting } from '@jitsi/react-sdk';

const startTeleconsult = (appointmentId: string, patientName: string, doctorName: string) => {
  const roomName = `opd-${appointmentId}`;

  return (
    <JitsiMeeting
      domain="meet.jit.si"
      roomName={roomName}
      configOverwrite={{
        startWithAudioMuted: true,
        disableModeratorIndicator: true,
        startScreenSharing: true,
        enableEmailInStats: false
      }}
      interfaceConfigOverwrite={{
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
      }}
      userInfo={{
        displayName: doctorName,
        email: ''
      }}
      onApiReady={(externalApi) => {
        // API ready
      }}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = '600px';
      }}
    />
  );
};
```

**Testing**:
- [ ] Video call starts successfully
- [ ] Audio works both ways
- [ ] Screen sharing functional
- [ ] Recording option available
- [ ] Works on mobile browsers

---

### 5. Fix Kiosk Backend Integration 🖥️
**Current**: Frontend complete, backend missing
**Required**: API endpoints for self-registration

**Create Backend Endpoints**:

**File**: `backend/routes/kiosk.ts` (Create this file)

```typescript
// POST /api/kiosk/register
router.post('/register', async (req, res) => {
  try {
    const { personalDetails, identification, medicalInfo, paymentInfo } = req.body;

    // 1. Generate UHID
    const uhid = await generateUhid();

    // 2. Create patient
    const patient = await createPatient({
      ...personalDetails,
      ...identification,
      ...medicalInfo,
      uhid
    });

    // 3. Process payment (integrate Razorpay/PayU)
    const paymentResult = await processPayment(paymentInfo);

    // 4. Generate token
    const token = await addToOPDQueue(patient.id);

    res.json({
      success: true,
      patient,
      token,
      payment: paymentResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Testing**:
- [ ] Kiosk can register new patients
- [ ] Payment integration works
- [ ] Token is generated
- [ ] Receipt is printed

---

## PHASE 2: IMPORTANT ENHANCEMENTS (48-72 Hours)

### 6. Implement OTP Verification 📱
**Current**: Not built
**Required**: Mobile OTP for patient verification

**Create Service**: `src/services/otpService.ts`

```typescript
export class OTPService {
  private static otpStore = new Map<string, { otp: string; expires: number }>();

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(phoneNumber: string): Promise<{ success: boolean }> {
    const otp = this.generateOTP();
    const expires = Date.now() + (5 * 60 * 1000); // 5 minutes

    this.otpStore.set(phoneNumber, { otp, expires });

    // Send via SMS
    await SMSService.sendCustomSMS(
      phoneNumber,
      `Your OTP is: ${otp}. Valid for 5 minutes. - Sevasangraha`
    );

    return { success: true };
  }

  static verifyOTP(phoneNumber: string, enteredOTP: string): boolean {
    const stored = this.otpStore.get(phoneNumber);
    if (!stored) return false;
    if (Date.now() > stored.expires) {
      this.otpStore.delete(phoneNumber);
      return false;
    }
    if (stored.otp === enteredOTP) {
      this.otpStore.delete(phoneNumber);
      return true;
    }
    return false;
  }
}
```

**Create Component**: `src/components/OTPVerificationModal.tsx`

**Testing**:
- [ ] OTP sent successfully
- [ ] 6-digit OTP received on phone
- [ ] Verification works correctly
- [ ] Expired OTP rejected
- [ ] Wrong OTP rejected
- [ ] Resend OTP works

---

### 7. Build Document Upload System 📄
**Current**: Only photo upload exists
**Required**: Upload lab reports, X-rays, etc.

**Create Component**: `src/components/DocumentUploadModal.tsx`

**Supabase Storage Setup**:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false);

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');
```

**Upload Implementation**:
```typescript
const uploadDocument = async (file: File, patientId: string, category: string) => {
  const fileName = `${patientId}/${category}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('patient-documents')
    .upload(fileName, file);

  if (error) throw error;

  // Save metadata to database
  await supabase.from('patient_documents').insert({
    patient_id: patientId,
    file_name: file.name,
    file_path: data.path,
    file_type: file.type,
    category,
    uploaded_at: new Date().toISOString()
  });
};
```

**Document Categories**:
- Lab Reports
- X-Ray Images
- Prescriptions
- Discharge Summaries
- Insurance Documents
- Other

**Testing**:
- [ ] Can upload PDF files
- [ ] Can upload images (JPG, PNG)
- [ ] Files stored in Supabase Storage
- [ ] Metadata saved to database
- [ ] Can view uploaded documents
- [ ] Can download documents

---

### 8. Add Doctor Schedule Management 📅
**Current**: No schedule view
**Required**: Weekly roster, leave management

**Create Component**: `src/components/DoctorSchedule.tsx`

**Database Table**:
```sql
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id),
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  max_appointments INTEGER DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id),
  leave_date DATE,
  leave_type VARCHAR(50), -- Sick, Vacation, Emergency
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features to Implement**:
- Weekly schedule view (calendar format)
- Add/edit time slots
- Mark unavailable days
- Leave application
- Print schedule
- Export to PDF

**Testing**:
- [ ] Can create weekly schedule
- [ ] Can mark leaves
- [ ] Schedule prevents overbooking
- [ ] Print functionality works

---

### 9. Build Patient Portal (Self-Service) 🏥
**Current**: Not built
**Required**: Patients can book appointments online

**Create Pages**:
- `src/pages/PatientPortal/Login.tsx`
- `src/pages/PatientPortal/Dashboard.tsx`
- `src/pages/PatientPortal/BookAppointment.tsx`
- `src/pages/PatientPortal/MyRecords.tsx`
- `src/pages/PatientPortal/Prescriptions.tsx`

**Authentication**:
```typescript
// Patient login with phone + OTP
const patientLogin = async (phone: string, otp: string) => {
  const verified = await OTPService.verifyOTP(phone, otp);
  if (!verified) throw new Error('Invalid OTP');

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('phone', phone)
    .single();

  const token = generateJWT({ patient_id: patient.id });
  return { patient, token };
};
```

**Features**:
- Phone + OTP login
- View appointment history
- Book new appointments
- View medical records
- Download prescriptions
- View bills

**Testing**:
- [ ] Patient can register/login
- [ ] Can book appointment
- [ ] Can view past records
- [ ] Can download prescription PDF
- [ ] Can pay bills online

---

## PHASE 3: FUTURE ENHANCEMENTS (1-2 Weeks)

### 10. Offline Mode Support 🌐
**Technology**: Service Workers + IndexedDB

**Implementation**:
```javascript
// public/service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('opd-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/css/main.css',
        '/static/js/main.js'
      ]);
    })
  );
});

// Offline data storage
import Dexie from 'dexie';

const db = new Dexie('OPDOffline');
db.version(1).stores({
  patients: '++id, uhid, phone',
  pendingRegistrations: '++id, timestamp',
  pendingAppointments: '++id, timestamp'
});
```

---

### 11. Episode of Care Tracking 📋
**Database Schema**:
```sql
CREATE TABLE episodes_of_care (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  episode_number VARCHAR(20) UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE,
  chief_complaint TEXT,
  episode_type VARCHAR(50), -- Acute, Chronic, Preventive
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
  related_consultations UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 12. NABH Certification Display 🏅
**Quick Add**:
```tsx
// Add to footer and waiting hall display
<div className="nabh-badge">
  <img src="/assets/nabh-logo.png" alt="NABH Certified" />
  <p>NABH Accredited Hospital</p>
</div>
```

---

## CONFIGURATION CHECKLIST

### Environment Variables Required

Create/Update `.env` file:

```env
# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# SMS/WhatsApp (Twilio)
VITE_TWILIO_ACCOUNT_SID=ACxxxxx
VITE_TWILIO_AUTH_TOKEN=your-auth-token
VITE_TWILIO_PHONE_NUMBER=+1234567890
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
VITE_SMS_ENABLED=true
VITE_WHATSAPP_ENABLED=true

# Video Conferencing
VITE_JITSI_DOMAIN=meet.jit.si
VITE_VIDEO_ENABLED=true

# Payment Gateway (Optional)
VITE_RAZORPAY_KEY=rzp_test_xxxxx
VITE_RAZORPAY_SECRET=xxxxx

# ABDM/ABHA (When ready)
VITE_ABDM_API_URL=https://phrsbx.abdm.gov.in
VITE_ABDM_CLIENT_ID=your-client-id
VITE_ABDM_CLIENT_SECRET=your-client-secret
```

---

## DATABASE MIGRATIONS TO RUN

**Execute in Supabase SQL Editor in this order**:

1. ✅ `FIX_UHID_SEQUENCE_SYNC.sql` (Already created)
2. ✅ `CREATE_STANDALONE_PATIENT_RECORD_TABLES.sql` (Already run)
3. 🆕 Create `doctor_schedules` table
4. 🆕 Create `doctor_leaves` table
5. 🆕 Create `patient_documents` table
6. 🆕 Create `episodes_of_care` table
7. 🆕 Create `otp_verifications` table (if using DB storage)

---

## TESTING PROTOCOL

### Pre-Client Testing Checklist

**Day 1: Core Workflows**
- [ ] Register new patient (with photo)
- [ ] Generate UHID correctly
- [ ] Check for duplicates
- [ ] Add patient to OPD queue
- [ ] Record vitals
- [ ] Complete consultation
- [ ] Generate prescription (all 3 templates)
- [ ] Generate medical certificate
- [ ] Create billing
- [ ] SMS sent successfully

**Day 2: Appointments & Queue**
- [ ] Book future appointment
- [ ] View appointment calendar
- [ ] Appointment reminder sent (WhatsApp + SMS)
- [ ] Queue display updates in real-time
- [ ] TAT tracking works
- [ ] Waiting hall display shows correct data
- [ ] Voice announcement works

**Day 3: Advanced Features**
- [ ] Complete patient record (all 6 sections)
- [ ] Referral creation
- [ ] Document upload
- [ ] Patient history retrieval
- [ ] OTP verification
- [ ] Teleconsult video call

**Day 4: Reports & MIS**
- [ ] Daily OPD register
- [ ] Doctor-wise stats
- [ ] Department reports
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] TAT reports

**Day 5: Integration Testing**
- [ ] End-to-end patient journey (registration to discharge)
- [ ] Multi-doctor workflow
- [ ] Peak load testing (20+ patients)
- [ ] Mobile responsiveness
- [ ] Print functionality (all documents)

---

## DEPLOYMENT CHECKLIST

### Before Sending to Client

**Code Quality**:
- [ ] All console.error logs reviewed
- [ ] No console.log in production code
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] Build size optimized
- [ ] Bundle analyzed

**Security**:
- [ ] All API keys in .env (not hardcoded)
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] SQL injection prevented
- [ ] Authentication tokens secured

**Performance**:
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Code splitting done
- [ ] Service worker configured
- [ ] Cache headers set

**Documentation**:
- [ ] User manual created
- [ ] Admin guide created
- [ ] API documentation (if applicable)
- [ ] Configuration guide
- [ ] Troubleshooting guide

**Backup & Recovery**:
- [ ] Database backup automated
- [ ] Restore procedure tested
- [ ] Disaster recovery plan documented

---

## SUCCESS METRICS

### Measure these before client delivery:

1. **Performance**:
   - Page load time < 2 seconds
   - Queue updates < 3 seconds
   - Form submission < 1 second
   - Report generation < 5 seconds

2. **Reliability**:
   - Uptime > 99.5%
   - Error rate < 0.1%
   - SMS delivery > 95%
   - Zero data loss

3. **Usability**:
   - Patient registration < 2 minutes
   - Queue status visible at all times
   - All features accessible within 3 clicks
   - Mobile responsive (all screens)

4. **Completeness**:
   - All 41 features operational (95%+)
   - All workflows tested end-to-end
   - All reports generating correctly
   - All integrations working

---

## RISK MITIGATION

### Potential Issues & Solutions

**Issue**: SMS/WhatsApp not sending
**Solution**:
- Verify Twilio credentials
- Check phone number format
- Enable test mode first
- Have fallback email notification

**Issue**: Database performance slow
**Solution**:
- Add indexes on frequently queried columns
- Implement pagination
- Use caching for static data
- Optimize queries

**Issue**: Real-time updates not working
**Solution**:
- Verify Supabase subscriptions enabled
- Check network connectivity
- Implement polling fallback
- Add manual refresh button

**Issue**: Print not working on certain printers
**Solution**:
- Test on multiple printer types
- Provide PDF download option
- Use print-friendly CSS
- Add print preview

---

## FINAL RECOMMENDATION

**Immediate Actions (Next 48 Hours)**:

1. ✅ Run `FIX_UHID_SEQUENCE_SYNC.sql` in Supabase
2. 🔧 Add WhatsApp support to notification service
3. 🔧 Connect waiting hall display to real queue data
4. 📊 Implement MIS reports with Excel export
5. 🎥 Integrate Jitsi for teleconsult

**After completing these 5 fixes, your OPD module will be 85%+ production-ready for client testing.**

**Week 2 Focus**:
- OTP verification
- Document upload
- Doctor schedules
- Patient portal (if required)

**Timeline**:
- **Day 1-2**: Critical fixes (5 items above)
- **Day 3-4**: Testing & validation
- **Day 5**: Client demo preparation
- **Week 2**: Enhancements based on client feedback

**Success Criteria for Client Testing**:
- ✅ Core patient journey works flawlessly
- ✅ All notifications sent successfully
- ✅ Queue management real-time
- ✅ Reports generate and export correctly
- ✅ Zero critical bugs
- ✅ Mobile responsive
- ✅ Professional UI/UX

---

**This action plan transforms your OPD module from 68% to 95%+ production-ready in 5-7 days.**
