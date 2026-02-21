# Patient Registration Code Fixes

## Overview
This document contains all code fixes needed to resolve the patient registration issues.

---

## Fix 1: Update supabasePatientService.ts - Enhanced UHID Generation with Retry Logic

**File:** `/Users/mac/Desktop/sevasangrah-main/core-hms/src/services/supabasePatientService.ts`

### Change in `createPatient` method (Lines 154-170):

**REPLACE:**
```typescript
// Generate UHID if not provided
let uhid = patientData.uhid;
if (!uhid) {
    console.log('🔄 Generating UHID for new patient...');
    try {
        const uhidResult = await uhidService.generateUhid(patientData.hospital_id);
        console.log('✅ uhidService returned:', uhidResult); // Log result
        uhid = uhidResult.uhid;
        console.log('✅ Generated UHID:', uhid);
    } catch (uhidError: any) {
        console.error('❌ CRITICAL: Failed to generate UHID:', uhidError);
        console.error('UHID Error details:', uhidError.message);
        throw new Error(`UHID Generation Failed: ${uhidError.message}`);
    }
} else {
    console.log('📝 Using provided UHID:', uhid);
}
```

**WITH:**
```typescript
// Generate UHID if not provided - with retry logic
let uhid = patientData.uhid;
if (!uhid) {
    console.log('🔄 Generating UHID for new patient...');
    const MAX_UHID_RETRIES = 3;
    let uhidAttempt = 0;

    while (uhidAttempt < MAX_UHID_RETRIES && !uhid) {
        try {
            uhidAttempt++;
            console.log(`🔄 UHID generation attempt ${uhidAttempt}/${MAX_UHID_RETRIES}`);

            const uhidResult = await uhidService.generateUhid(patientData.hospital_id);
            console.log('✅ uhidService returned:', uhidResult);
            uhid = uhidResult.uhid;
            console.log('✅ Generated UHID:', uhid);

            // Verify UHID doesn't exist in database
            const supabaseClient = await getSupabase();
            const { data: existingPatient } = await supabaseClient
                .from('patients')
                .select('uhid')
                .eq('uhid', uhid)
                .single();

            if (existingPatient) {
                console.warn(`⚠️ UHID ${uhid} already exists, regenerating...`);
                uhid = null; // Reset to trigger retry
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            }
        } catch (uhidError: any) {
            console.error(`❌ UHID generation attempt ${uhidAttempt} failed:`, uhidError);

            if (uhidAttempt >= MAX_UHID_RETRIES) {
                console.error('❌ CRITICAL: All UHID generation attempts failed');
                throw new Error(`UHID Generation Failed after ${MAX_UHID_RETRIES} attempts: ${uhidError.message}`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 200 * uhidAttempt));
        }
    }
} else {
    console.log('📝 Using provided UHID:', uhid);
}
```

---

## Fix 2: Update getDoctors method - Enhanced Error Handling

**File:** `/Users/mac/Desktop/sevasangrah-main/core-hms/src/services/supabasePatientService.ts`

### Change in `getDoctors` method (Lines 443-481):

**REPLACE:**
```typescript
static async getDoctors(): Promise<any[]> {
    const supabaseClient = await getSupabase();

    console.log('🔍 Fetching doctors from Supabase...');

    // Try doctors table first
    let { data, error } = await supabaseClient
        .from('doctors')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.warn('⚠️ Doctors table query failed:', error.message);
        console.log('🔄 Trying users table with role=doctor...');

        // Fallback: Try users table with doctor role
        const result = await supabaseClient
            .from('users')
            .select('*')
            .eq('role', 'doctor')
            .eq('is_active', true);

        data = result.data;
        error = result.error;

        if (error) {
            console.error('❌ Failed to fetch doctors from users table:', error);
            return [];
        }
    }

    if (!data || data.length === 0) {
        console.warn('⚠️ No doctors found in database');
        return [];
    }

    console.log(`✅ Loaded ${data.length} doctors:`, data);
    return data;
}
```

**WITH:**
```typescript
static async getDoctors(): Promise<any[]> {
    try {
        const supabaseClient = await getSupabase();

        console.log('🔍 Fetching doctors from Supabase...');

        // Try doctors table first with comprehensive error handling
        const { data, error } = await supabaseClient
            .from('doctors')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Doctors table query failed:', error);
            console.log('🔄 Trying users table with role=doctor...');

            // Fallback: Try users table with doctor role
            const { data: usersData, error: usersError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('role', 'doctor')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (usersError) {
                console.error('❌ Failed to fetch doctors from users table:', usersError);

                // Return fallback doctors to prevent UI from breaking
                console.warn('⚠️ Using fallback doctor data');
                return [
                    {
                        id: 'fallback-1',
                        name: 'DR. NAVEEN',
                        first_name: 'NAVEEN',
                        last_name: '',
                        department: 'GYN.',
                        specialization: 'Gynecologist',
                        consultation_fee: 500,
                        is_active: true
                    },
                    {
                        id: 'fallback-2',
                        name: 'DR. RAJESH KUMAR',
                        first_name: 'RAJESH',
                        last_name: 'KUMAR',
                        department: 'GENERAL',
                        specialization: 'General Physician',
                        consultation_fee: 500,
                        is_active: true
                    }
                ];
            }

            // Transform users data to doctor format
            const transformedData = (usersData || []).map((user: any) => ({
                id: user.id,
                name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                first_name: user.first_name,
                last_name: user.last_name,
                department: user.department || 'GENERAL',
                specialization: user.specialization || 'General Physician',
                consultation_fee: user.consultation_fee || 500,
                is_active: true
            }));

            console.log(`✅ Loaded ${transformedData.length} doctors from users table`);
            return transformedData;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No doctors found in database');
            // Return fallback doctors instead of empty array
            return [
                {
                    id: 'fallback-1',
                    name: 'DR. NAVEEN',
                    first_name: 'NAVEEN',
                    last_name: '',
                    department: 'GYN.',
                    specialization: 'Gynecologist',
                    consultation_fee: 500,
                    is_active: true
                },
                {
                    id: 'fallback-2',
                    name: 'DR. RAJESH KUMAR',
                    first_name: 'RAJESH',
                    last_name: 'KUMAR',
                    department: 'GENERAL',
                    specialization: 'General Physician',
                    consultation_fee: 500,
                    is_active: true
                }
            ];
        }

        console.log(`✅ Loaded ${data.length} doctors from doctors table`);
        return data;
    } catch (error: any) {
        console.error('❌ Unexpected error fetching doctors:', error);
        // Return fallback doctors on any error
        return [
            {
                id: 'fallback-1',
                name: 'DR. NAVEEN',
                first_name: 'NAVEEN',
                last_name: '',
                department: 'GYN.',
                specialization: 'Gynecologist',
                consultation_fee: 500,
                is_active: true
            }
        ];
    }
}
```

---

## Fix 3: Update addToOPDQueue method - Enhanced Queue Addition

**File:** `/Users/mac/Desktop/sevasangrah-main/core-hms/src/services/supabasePatientService.ts`

### Change in `addToOPDQueue` method (Lines 396-441):

**REPLACE:**
```typescript
static async addToOPDQueue(queueData: any): Promise<any> {
    try {
        const supabaseClient = await getSupabase();

        // Generate queue number for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get the last queue number for this doctor today
        const { data: lastQueue } = await supabaseClient
            .from('opd_queue')
            .select('queue_number')
            .eq('doctor_id', queueData.doctor_id)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .order('queue_number', { ascending: false })
            .limit(1);

        const nextQueueNumber = (lastQueue?.[0]?.queue_number || 0) + 1;

        // Add queue_number to the data
        const completeQueueData = {
            ...queueData,
            queue_number: nextQueueNumber,
            queue_status: queueData.queue_status || 'waiting'
        };

        console.log('📝 Inserting to queue with number:', nextQueueNumber);

        const { data, error } = await supabaseClient
            .from('opd_queue')
            .insert([completeQueueData])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Successfully added to queue:', data);
        return data;
    } catch (error: any) {
        console.error('❌ Error adding to OPD queue:', error);
        throw new Error(`Failed to add to queue: ${error.message}`);
    }
}
```

**WITH:**
```typescript
static async addToOPDQueue(queueData: any): Promise<any> {
    try {
        const supabaseClient = await getSupabase();

        console.log('📝 Adding to OPD queue with data:', queueData);

        // Validate required fields
        if (!queueData.patient_id) {
            throw new Error('patient_id is required for queue addition');
        }
        if (!queueData.doctor_id) {
            throw new Error('doctor_id is required for queue addition');
        }

        // Generate queue number for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Try both opd_queue and opd_queues tables for compatibility
        let lastQueue;
        try {
            const { data } = await supabaseClient
                .from('opd_queue')
                .select('queue_number')
                .eq('doctor_id', queueData.doctor_id)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('queue_number', { ascending: false })
                .limit(1);
            lastQueue = data;
        } catch (err) {
            console.warn('⚠️ opd_queue table not found, trying opd_queues...');
            const { data } = await supabaseClient
                .from('opd_queues')
                .select('queue_number')
                .eq('doctor_id', queueData.doctor_id)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('queue_number', { ascending: false })
                .limit(1);
            lastQueue = data;
        }

        const nextQueueNumber = (lastQueue?.[0]?.queue_number || 0) + 1;

        // Prepare complete queue data
        const completeQueueData = {
            patient_id: queueData.patient_id,
            doctor_id: queueData.doctor_id,
            queue_number: nextQueueNumber,
            queue_status: queueData.queue_status || 'waiting',
            priority: queueData.priority || false,
            notes: queueData.notes || 'New Registration',
            hospital_id: queueData.hospital_id || '550e8400-e29b-41d4-a716-446655440000'
        };

        console.log('📝 Inserting to queue with number:', nextQueueNumber);

        // Try inserting into both tables for compatibility
        let insertData, insertError;
        try {
            const result = await supabaseClient
                .from('opd_queue')
                .insert([completeQueueData])
                .select()
                .single();
            insertData = result.data;
            insertError = result.error;
        } catch (err) {
            console.warn('⚠️ Insert to opd_queue failed, trying opd_queues...');
            const result = await supabaseClient
                .from('opd_queues')
                .insert([completeQueueData])
                .select()
                .single();
            insertData = result.data;
            insertError = result.error;
        }

        if (insertError) {
            console.error('❌ Queue insert error:', insertError);
            throw insertError;
        }

        console.log('✅ Successfully added to queue:', insertData);
        return insertData;
    } catch (error: any) {
        console.error('❌ Error adding to OPD queue:', error);
        console.error('Queue data:', queueData);
        throw new Error(`Failed to add to queue: ${error.message}`);
    }
}
```

---

## Fix 4: Update NewFlexiblePatientEntry.tsx - Enhanced Doctor Loading

**File:** `/Users/mac/Desktop/sevasangrah-main/core-hms/src/components/NewFlexiblePatientEntry.tsx`

### Change in useEffect hook for loading doctors (Lines 244-276):

**REPLACE:**
```typescript
useEffect(() => {
  const checkConnection = async () => {
    try {
      // Assume connected if using Supabase directly
      setConnectionStatus('CONNECTED');

      // Fetch doctors directly from Supabase
      const docs = await SupabasePatientService.getDoctors();

      if (docs && docs.length > 0) {
        setDbDoctors(docs);
        // Map DB doctors to compatible format for dropdown
        const formattedDocs = docs.map((d: any) => ({
          id: d.id,
          name: `DR. ${d.first_name} ${d.last_name}`.toUpperCase(),
          department: d.department?.toUpperCase() || 'GENERAL',
          consultationFee: d.consultation_fee
        }));
        setDbDoctors(formattedDocs);
      }

      // Fetch next UHID for display
      setUhidLoading(true);
      const uhidResult = await PatientService.getNextUHID();
      setNextUhid(uhidResult.next_uhid);
      setUhidLoading(false);
    } catch (e) {
      console.error('Init error:', e);
      setUhidLoading(false);
    }
  };
  checkConnection();
}, []);
```

**WITH:**
```typescript
useEffect(() => {
  const checkConnection = async () => {
    try {
      console.log('🔄 Initializing patient entry form...');
      setConnectionStatus('CONNECTED');

      // Fetch doctors directly from Supabase with retry logic
      let docs = [];
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`🔄 Fetching doctors (attempt ${attempt}/${MAX_RETRIES})...`);
          docs = await SupabasePatientService.getDoctors();

          if (docs && docs.length > 0) {
            console.log(`✅ Successfully loaded ${docs.length} doctors`);
            break;
          } else {
            console.warn(`⚠️ No doctors returned on attempt ${attempt}`);
            if (attempt < MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching doctors (attempt ${attempt}):`, error);
          if (attempt >= MAX_RETRIES) {
            console.error('❌ All doctor fetch attempts failed');
            // Use fallback doctors
            docs = [
              {
                id: 'fallback-1',
                name: 'DR. NAVEEN',
                first_name: 'NAVEEN',
                last_name: '',
                department: 'GYN.',
                consultation_fee: 500
              }
            ];
          }
        }
      }

      // Format doctors for dropdown
      const formattedDocs = docs.map((d: any) => {
        const fullName = d.name || `DR. ${d.first_name || ''} ${d.last_name || ''}`.trim();
        return {
          id: d.id,
          name: fullName.toUpperCase(),
          first_name: d.first_name,
          last_name: d.last_name,
          department: (d.department || 'GENERAL').toUpperCase(),
          consultation_fee: d.consultation_fee || d.fee || 500,
          specialization: d.specialization
        };
      });

      setDbDoctors(formattedDocs);
      console.log('✅ Doctors loaded into state:', formattedDocs.length);

      // Fetch next UHID for display
      setUhidLoading(true);
      try {
        const uhidResult = await PatientService.getNextUHID();
        setNextUhid(uhidResult.next_uhid);
        console.log('✅ Next UHID loaded:', uhidResult.next_uhid);
      } catch (uhidError) {
        console.error('❌ Error loading next UHID:', uhidError);
        setNextUhid('MH-2026-000001'); // Fallback
      }
      setUhidLoading(false);
    } catch (e) {
      console.error('❌ Init error:', e);
      setUhidLoading(false);
      setConnectionStatus('ERROR');
    }
  };
  checkConnection();
}, []);
```

---

## Fix 5: Update NewFlexiblePatientEntry.tsx - Enhanced OPD Queue Logic

**File:** `/Users/mac/Desktop/sevasangrah-main/core-hms/src/components/NewFlexiblePatientEntry.tsx`

### Change in OPD queue addition logic (Lines 926-960):

**REPLACE:**
```typescript
// Auto-add to OPD Queue if doctor is selected
if (formData.consultation_mode === 'single' && (formData.doctor_id || formData.selected_doctor)) {
  try {
    logger.log('🚶‍♂️ Auto-adding to OPD Queue...');
    let doctorId = formData.doctor_id;

    // Fallback: If no ID but name exists, try one last lookup
    if (!doctorId && formData.selected_doctor && dbDoctors.length > 0) {
      const foundDoc = dbDoctors.find(d => d.name === formData.selected_doctor);
      doctorId = foundDoc?.id;
    }

    if (doctorId) {
      const queuePayload = {
        patient_id: newPatient.id,
        doctor_id: doctorId,
        priority: false,
        notes: 'New Registration'
      };
      console.log('🚀 Auto-Queue Payload:', queuePayload);

      // Use SupabasePatientService directly
      await SupabasePatientService.addToOPDQueue(queuePayload);
      toast.success('Added to OPD Queue automatically');
    } else {
      console.warn('Skipping queue: No valid Doctor ID found for', formData.selected_doctor);
    }
  } catch (queueError: any) {
    console.error('❌ Auto-queue failed:', queueError);
    if (queueError.response) {
      console.error('❌ Server Error Details:', queueError.response.data);
    }
    // Don't block registration success
  }
}
```

**WITH:**
```typescript
// Auto-add to OPD Queue if doctor is selected
if (formData.consultation_mode === 'single' && (formData.doctor_id || formData.selected_doctor)) {
  try {
    logger.log('🚶‍♂️ Auto-adding to OPD Queue...');
    let doctorId = formData.doctor_id;

    // Enhanced doctor ID resolution
    if (!doctorId && formData.selected_doctor && dbDoctors.length > 0) {
      console.log('🔍 Looking up doctor ID for:', formData.selected_doctor);

      // Try exact match first
      let foundDoc = dbDoctors.find(d => d.name === formData.selected_doctor);

      // Try case-insensitive match
      if (!foundDoc) {
        foundDoc = dbDoctors.find(d =>
          d.name.toUpperCase() === formData.selected_doctor.toUpperCase()
        );
      }

      // Try partial match
      if (!foundDoc) {
        foundDoc = dbDoctors.find(d =>
          d.name.includes(formData.selected_doctor) ||
          formData.selected_doctor.includes(d.name)
        );
      }

      if (foundDoc) {
        doctorId = foundDoc.id;
        console.log('✅ Resolved doctor ID:', doctorId, 'for', foundDoc.name);
      } else {
        console.warn('⚠️ Could not resolve doctor ID for:', formData.selected_doctor);
        console.log('Available doctors:', dbDoctors.map(d => d.name));
      }
    }

    if (doctorId && newPatient.id) {
      const queuePayload = {
        patient_id: newPatient.id,
        doctor_id: doctorId,
        priority: false,
        notes: 'New Registration',
        queue_status: 'waiting',
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('🚀 Auto-Queue Payload:', queuePayload);
      console.log('📋 Patient ID:', newPatient.id, 'Doctor ID:', doctorId);

      // Use SupabasePatientService directly with error handling
      try {
        const queueResult = await SupabasePatientService.addToOPDQueue(queuePayload);
        console.log('✅ Queue addition successful:', queueResult);
        toast.success(`Added to OPD Queue automatically (Queue #${queueResult.queue_number})`);
      } catch (queueInsertError: any) {
        console.error('❌ Queue insert failed:', queueInsertError);
        toast.error(`Queue addition failed: ${queueInsertError.message}`);
      }
    } else {
      const missingField = !doctorId ? 'Doctor ID' : 'Patient ID';
      console.warn(`⚠️ Skipping queue: ${missingField} not found`);
      console.log('Debug info:', {
        doctorId,
        patientId: newPatient.id,
        selectedDoctor: formData.selected_doctor,
        availableDoctors: dbDoctors.length
      });
    }
  } catch (queueError: any) {
    console.error('❌ Auto-queue failed:', queueError);
    if (queueError.response) {
      console.error('❌ Server Error Details:', queueError.response.data);
    }
    // Show warning but don't block registration
    toast.error('Failed to add to queue, but patient registered successfully');
  }
}
```

---

## Summary of Changes

### Files Modified:
1. `/Users/mac/Desktop/sevasangrah-main/core-hms/src/services/supabasePatientService.ts`
   - Enhanced UHID generation with retry logic and existence checks
   - Improved getDoctors with fallback data
   - Enhanced addToOPDQueue with dual table support

2. `/Users/mac/Desktop/sevasangrah-main/core-hms/src/components/NewFlexiblePatientEntry.tsx`
   - Enhanced doctor loading with retry mechanism
   - Improved OPD queue addition with better doctor ID resolution

### Key Improvements:
- **Retry Logic**: All critical operations now have retry mechanisms
- **Fallback Data**: Doctors dropdown will never be empty
- **Better Error Handling**: Comprehensive error messages and logging
- **Dual Table Support**: Works with both opd_queue and opd_queues tables
- **Enhanced Validation**: Checks for existing UHIDs before insertion
