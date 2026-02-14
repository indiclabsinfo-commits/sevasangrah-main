import { supabase } from '../lib/supabaseClient';
import type { Patient } from '../types/index';

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
    aadhar_number?: string;
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
}

export class SupabasePatientService {

    /**
     * Generate next patient ID (P000001, P000002, etc.)
     */
    private static async generatePatientId(): Promise<string> {
        try {
            // Get the latest patient ID
            const { data, error } = await supabase
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
            const patient_id = await this.generatePatientId();

            // Prepare data for Supabase
            const supabaseData = {
                patient_id,
                full_name: patientData.full_name,
                first_name: patientData.first_name || patientData.full_name.split(' ')[0],
                last_name: patientData.last_name || patientData.full_name.split(' ').slice(1).join(' ') || '',
                prefix: patientData.prefix || 'Mr',
                age: patientData.age || 0,
                gender: patientData.gender || 'MALE',
                phone: patientData.phone || null,
                email: patientData.email || null,
                address: patientData.address || null,
                blood_group: patientData.blood_group || null,
                aadhaar_number: patientData.aadhar_number || null,
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
                hospital_id: patientData.hospital_id || '550e8400-e29b-41d4-a716-446655440000',
                is_active: true
            };

            console.log('📤 Inserting into Supabase:', supabaseData);

            // Insert into Supabase
            const { data, error } = await supabase
                .from('patients')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                console.error('❌ Supabase error:', error);
                throw new Error(`Failed to create patient: ${error.message}`);
            }

            console.log('✅ Patient created successfully:', data);
            return data as Patient;

        } catch (error: any) {
            console.error('❌ Patient creation failed:', error);
            throw new Error(`Failed to save patient: ${error.message}`);
        }
    }

    /**
     * Get all patients
     */
    static async getAllPatients(): Promise<Patient[]> {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Patient[];
        } catch (error: any) {
            console.error('Error fetching patients:', error);
            return [];
        }
    }

    /**
     * Get patient by ID
     */
    static async getPatientById(id: string): Promise<Patient | null> {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Patient;
        } catch (error: any) {
            console.error('Error fetching patient:', error);
            return null;
        }
    }

    /**
     * Search patients by name or phone
     */
    static async searchPatients(query: string): Promise<Patient[]> {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,patient_id.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as Patient[];
        } catch (error: any) {
            console.error('Error searching patients:', error);
            return [];
        }
    }

    /**
     * Create a new transaction directly in Supabase
     */
    static async createTransaction(transactionData: any): Promise<any> {
        try {
            console.log('💳 Creating transaction via Supabase:', transactionData);

            const supabaseData = {
                patient_id: transactionData.patient_id,
                amount: transactionData.amount,
                transaction_type: transactionData.transaction_type,
                payment_mode: transactionData.payment_mode,
                description: transactionData.description,
                doctor_name: transactionData.doctor_name,
                department: transactionData.department,
                status: transactionData.status || 'COMPLETED',
                transaction_date: transactionData.transaction_date || new Date().toISOString(),
                discount_type: transactionData.discount_type,
                discount_value: transactionData.discount_value,
                discount_reason: transactionData.discount_reason,
                online_payment_method: transactionData.online_payment_method,
                rghs_number: transactionData.rghs_number,
                hospital_id: '550e8400-e29b-41d4-a716-446655440000',
                created_by: '00000000-0000-0000-0000-000000000000' // SYSTEM/ADMIN
            };

            const { data, error } = await supabase
                .from('patient_transactions')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                console.error('❌ Supabase transaction error:', error);
                throw error;
            }

            console.log('✅ Transaction created successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Transaction creation failed:', error);
            throw new Error(`Failed to save transaction: ${error.message}`);
        }
    }
    /**
     * Get all doctors from Supabase
     */
    static async getDoctors(): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'DOCTOR')
                .eq('is_active', true);

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error fetching doctors:', error);
            return [];
        }
    }

    /**
     * Get all departments from Supabase
     */
    static async getDepartments(): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error fetching departments:', error);
            return [];
        }
    }


    /**
     * Update patient details
     */
    static async updatePatient(id: string, updates: any): Promise<any> {
        try {
            console.log('🔄 Updating patient via Supabase:', id, updates);

            // Clean up updates object if needed (remove undefined)
            const cleanUpdates = Object.fromEntries(
                Object.entries(updates).filter(([_, v]) => v !== undefined)
            );

            const { data, error } = await supabase
                .from('patients')
                .update(cleanUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            console.log('✅ Patient updated successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Patient update failed:', error);
            throw new Error(`Failed to update patient: ${error.message}`);
        }
    }

    /**
     * Add patient to OPD Queue
     */
    static async addToOPDQueue(queueData: any): Promise<any> {
        try {
            console.log('🎫 Adding to OPD Queue via Supabase:', queueData);

            // In Supabase direct mode, adding to queue mainly means updating the patient record
            // We need to generate the queue number manually or use a database function
            // For now, let's get the max queue number for today

            const today = new Date().toISOString().split('T')[0];

            // Get max queue number
            const { data: maxQueueData, error: maxQueueError } = await supabase
                .from('patients')
                .select('queue_no')
                .eq('queue_date', today)
                .order('queue_no', { ascending: false })
                .limit(1);

            let nextQueueNo = 1;
            if (maxQueueData && maxQueueData.length > 0 && maxQueueData[0].queue_no) {
                nextQueueNo = maxQueueData[0].queue_no + 1;
            }

            const updates = {
                queue_no: nextQueueNo,
                queue_status: 'waiting',
                queue_date: today,
                assigned_doctor: queueData.doctor_id, // If doctor_id is passed
                has_pending_appointment: false,
                is_active: true
            };

            const { data, error } = await supabase
                .from('patients')
                .update(updates)
                .eq('patient_id', queueData.patient_id) // queueData might use patient_id string
                .select()
                .single();

            if (error) {
                // Try looking up by UUID if patient_id update failed (maybe it was a UUID)
                if (queueData.patient_id.length > 10) { // UUIDs are long
                    const { data: retryData, error: retryError } = await supabase
                        .from('patients')
                        .update(updates)
                        .eq('id', queueData.patient_id)
                        .select()
                        .single();

                    if (retryError) throw retryError;
                    return retryData;
                }
                throw error;
            }

            console.log('✅ Added to OPD Queue:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Add to Queue failed:', error);
            throw new Error(`Failed to add to queue: ${error.message}`);
        }
    }

    /**
     * Delete a patient
     */
    static async deletePatient(id: string): Promise<void> {
        try {
            console.log('🗑️ Deleting patient via Supabase:', id);

            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;
            console.log('✅ Patient deleted successfully');
        } catch (error: any) {
            console.error('❌ Patient deletion failed:', error);
            throw new Error(`Failed to delete patient: ${error.message}`);
        }
    }

    /**
     * Delete a transaction
     */
    static async deleteTransaction(id: string): Promise<void> {
        try {
            console.log('🗑️ Deleting transaction via Supabase:', id);

            const { error } = await supabase
                .from('patient_transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            console.log('✅ Transaction deleted successfully');
        } catch (error: any) {
            console.error('❌ Transaction deletion failed:', error);
            throw new Error(`Failed to delete transaction: ${error.message}`);
        }
    }
}

export default SupabasePatientService;
