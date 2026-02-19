import { getSupabase } from '../lib/supabaseClient';
import type { Patient } from '../types/index';
import { uhidService } from './azureApiService';

export interface CreatePatientData {
    full_name: string;
    first_name?: string;
    last_name?: string;
    prefix?: string;
    age?: number;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
    blood_group?: string;
    aadhaar_number?: string;
    abha_id?: string;
    rghs_number?: string;
    date_of_birth?: string;
    patient_tag?: string;
    medical_history?: string;
    allergies?: string;
    current_medications?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    has_reference?: boolean;
    reference_details?: string;
    photo_url?: string;
    notes?: string;
    date_of_entry?: string;
    assigned_doctor?: string;
    assigned_department?: string;
    has_pending_appointment?: boolean;
    hospital_id?: string;
    uhid?: string; // Added UHID field
}

export class SupabasePatientService {

    /**
     * Generate next patient ID (P000001, P000002, etc.)
     */
    private static async generatePatientId(): Promise<string> {
        try {
            // Get the latest patient ID
            const supabaseClient = await getSupabase();
            const { data, error } = await supabaseClient
                .from('patients')
                .select('patient_id')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (!data || data.length === 0) {
                return 'P000001'; // First patient
            }

            // Extract number from last patient_id (e.g., "P000005" -> 5)
            const lastId = data[0].patient_id;
            const lastNumber = parseInt(lastId.replace('P', ''));
            const nextNumber = lastNumber + 1;

            // Format with leading zeros (P000006)
            return `P${nextNumber.toString().padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating patient ID:', error);
            // Fallback to random ID
            const randomNum = Math.floor(Math.random() * 999999);
            return `P${randomNum.toString().padStart(6, '0')}`;
        }
    }

    /**
     * Create a new patient directly in Supabase
     */
    static async createPatient(patientData: CreatePatientData): Promise<Patient> {
        try {
            console.log('👤 Creating patient via Supabase:', patientData);

            // Generate patient ID
            let patient_id = '';
            try {
                console.log('🔄 Generating Patient ID...');
                patient_id = await this.generatePatientId();
                console.log('✅ Generated Patient ID:', patient_id);
            } catch (pidError: any) {
                console.error('❌ Error generating Patient ID:', pidError);
                throw new Error(`Patient ID Generation Failed: ${pidError.message}`);
            }

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

            // Prepare data for Supabase
            const supabaseData = {
                patient_id,
                uhid: uhid || null, // Add UHID to patient record
                first_name: patientData.first_name || (patientData.full_name ? patientData.full_name.split(' ')[0] : ''),
                last_name: patientData.last_name || (patientData.full_name ? patientData.full_name.split(' ').slice(1).join(' ') : ''),
                prefix: patientData.prefix || 'Mr',
                age: patientData.age || 0,
                gender: patientData.gender || 'MALE',
                phone: patientData.phone || null,
                email: patientData.email || null,
                address: patientData.address || null,
                blood_group: patientData.blood_group || null,
                aadhaar_number: patientData.aadhaar_number || null,
                abha_id: patientData.abha_id || null,
                rghs_number: patientData.rghs_number || null,
                date_of_birth: patientData.date_of_birth || null,
                patient_tag: patientData.patient_tag || 'Regular',
                medical_history: patientData.medical_history || null,
                allergies: patientData.allergies || null,
                current_medications: patientData.current_medications || null,
                emergency_contact_name: patientData.emergency_contact_name || null,
                emergency_contact_phone: patientData.emergency_contact_phone || null,
                has_reference: patientData.has_reference || false,
                reference_details: patientData.reference_details || null,
                photo_url: patientData.photo_url || null,
                notes: patientData.notes || null,
                date_of_entry: patientData.date_of_entry || new Date().toISOString(),
                assigned_doctor: patientData.assigned_doctor || null,
                assigned_department: patientData.assigned_department || null,
                has_pending_appointment: patientData.has_pending_appointment || false,
                hospital_id: patientData.hospital_id || null
            };

            console.log('📤 Inserting into Supabase:', supabaseData);

            // Direct REST API insert with retry on UHID conflict
            let data, error;
            const MAX_RETRIES = 3;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

                    console.log('Inserting patient attempt ' + attempt + '/' + MAX_RETRIES);

                    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/patients`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(supabaseData)
                    });

                    const responseText = await insertResponse.text();
                    console.log('Insert response status:', insertResponse.status);

                    // Handle UHID conflict - retry with new UHID
                    if (insertResponse.status === 409 && attempt < MAX_RETRIES) {
                        console.warn('409 Conflict on attempt ' + attempt + '. Regenerating UHID...');
                        try {
                            const uhidResult = await uhidService.generateUhid(patientData.hospital_id);
                            supabaseData.uhid = uhidResult.uhid;
                        } catch {
                            supabaseData.uhid = 'UHID-' + Date.now();
                        }
                        console.log('New UHID:', supabaseData.uhid);
                        continue;
                    }

                    if (!insertResponse.ok) {
                        let errorMsg = `HTTP ${insertResponse.status}`;
                        try {
                            const errorJson = JSON.parse(responseText);
                            errorMsg = errorJson.message || errorJson.details || errorJson.hint || responseText;
                        } catch { errorMsg = responseText; }
                        throw new Error(`Insert failed (${insertResponse.status}): ${errorMsg}`);
                    }

                    // Parse response
                    const insertedData = JSON.parse(responseText);
                    data = Array.isArray(insertedData) ? insertedData[0] : insertedData;

                    if (!data || !data.id) {
                        throw new Error('Patient insert returned empty. Run disable_rls.sql in Supabase SQL Editor.');
                    }

                    error = null;
                    console.log('Patient inserted! ID:', data.patient_id, 'UUID:', data.id);
                    break; // success, exit retry loop

                } catch (dbError: any) {
                    if (attempt === MAX_RETRIES) {
                        console.error('Database Insert Error (final):', dbError);
                        throw new Error(`Database Insert Failed: ${dbError.message}`);
                    }
                    console.warn('Attempt ' + attempt + ' failed:', dbError.message);
                }
            } // end retry loop


            if (error) {
                console.error('❌ Supabase insert error:', error);
                throw new Error(`Failed to save patient: ${error.message}`);
            }

            console.log('✅ Patient created successfully:', data);

            // Return the created patient
            return {
                id: data.id,
                patient_id: data.patient_id,
                uhid: data.uhid,
                first_name: data.first_name,
                last_name: data.last_name,
                prefix: data.prefix,
                age: data.age,
                gender: data.gender,
                phone: data.phone,
                email: data.email,
                address: data.address,
                blood_group: data.blood_group,
                aadhaar_number: data.aadhaar_number,
                abha_id: data.abha_id,
                rghs_number: data.rghs_number,
                date_of_birth: data.date_of_birth,
                patient_tag: data.patient_tag,
                medical_history: data.medical_history,
                allergies: data.allergies,
                current_medications: data.current_medications,
                emergency_contact_name: data.emergency_contact_name,
                emergency_contact_phone: data.emergency_contact_phone,
                has_reference: data.has_reference,
                reference_details: data.reference_details,
                photo_url: data.photo_url,
                notes: data.notes,
                date_of_entry: data.date_of_entry,
                assigned_doctor: data.assigned_doctor,
                assigned_department: data.assigned_department,
                has_pending_appointment: data.has_pending_appointment,
                hospital_id: data.hospital_id,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

        } catch (error: any) {
            console.error('❌ Patient creation failed:', error);
            throw new Error(`Failed to save patient: ${error.message}`);
        }
    }


    static async createTransaction(transactionData: any): Promise<any> {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

            console.log('💰 Creating transaction via REST API:', Object.keys(transactionData));

            const response = await fetch(`${supabaseUrl}/rest/v1/patient_transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(transactionData)
            });

            const responseText = await response.text();
            console.log('📥 Transaction response status:', response.status);
            console.log('📥 Transaction response body:', responseText.substring(0, 300));

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorJson = JSON.parse(responseText);
                    errorMsg = errorJson.message || errorJson.details || errorJson.hint || responseText;
                } catch { errorMsg = responseText; }
                throw new Error(`Transaction insert failed (${response.status}): ${errorMsg}`);
            }

            const insertedData = JSON.parse(responseText);
            const data = Array.isArray(insertedData) ? insertedData[0] : insertedData;
            console.log('✅ Transaction created:', data?.id);
            return data || transactionData;
        } catch (error: any) {
            console.error('❌ Error creating transaction:', error);
            throw new Error(`Failed to create transaction: ${error.message}`);
        }
    }

    static async addToOPDQueue(queueData: any): Promise<any> {
        try {
            const supabaseClient = await getSupabase();
            const { data, error } = await supabaseClient
                .from('opd_queue')
                .insert([queueData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error adding to OPD queue:', error);
            throw new Error(`Failed to add to queue: ${error.message}`);
        }
    }

    static async getDoctors(): Promise<any[]> {
        const supabaseClient = await getSupabase();
        const { data, error } = await supabaseClient
            .from('doctors')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching doctors:', error);
            return [];
        }
        return data || [];
    }

    static async getAllPatients(): Promise<any[]> {
        const supabaseClient = await getSupabase();
        const { data, error } = await supabaseClient
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching patients:', error);
            return [];
        }
        return data || [];
    }

    static async updatePatient(patientId: string, updateData: any): Promise<any> {
        try {
            console.log('📝 Updating patient:', patientId, updateData);
            const supabaseClient = await getSupabase();

            // Remove uuid from update data if present to avoid changing primary key
            const { id, ...dataToUpdate } = updateData;

            const { data, error } = await supabaseClient
                .from('patients')
                .update(dataToUpdate)
                .eq('id', patientId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error updating patient:', error);
            throw new Error(`Failed to update patient: ${error.message}`);
        }
    }
    static async deletePatient(id: string): Promise<void> {
        try {
            console.log('🗑️ Deleting patient:', id);
            const supabaseClient = await getSupabase();
            const { error } = await supabaseClient
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error deleting patient:', error);
            throw new Error(`Failed to delete patient: ${error.message}`);
        }
    }

    static async deleteTransaction(id: string): Promise<void> {
        try {
            console.log('🗑️ Deleting transaction:', id);
            const supabaseClient = await getSupabase();
            const { error } = await supabaseClient
                .from('patient_transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error deleting transaction:', error);
            throw new Error(`Failed to delete transaction: ${error.message}`);
        }
    }
}