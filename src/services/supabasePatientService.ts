import { supabase } from '../lib/supabaseClient';
import type { Patient } from '../types/index';

export interface CreatePatientData {
    full_name: string;
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
                age: patientData.age || null,
                gender: patientData.gender || null,
                phone: patientData.phone || null,
                email: patientData.email || null,
                address: patientData.address || null,
                blood_group: patientData.blood_group || null,
                aadhar_number: patientData.aadhar_number || null,
                abha_id: patientData.abha_id || null,
                rghs_number: patientData.rghs_number || null,
                date_of_birth: patientData.date_of_birth || null,
                patient_tag: patientData.patient_tag || 'Regular',
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
}

export default SupabasePatientService;
