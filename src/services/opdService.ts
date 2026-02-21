// OPD Service - Direct Supabase database access
// Zero Backend Architecture - No API dependencies

import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import { SupabaseHospitalService } from './supabaseHospitalService';

const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';

// ==================== TYPES ====================

export interface OPDConsultation {
    id: string;
    patient_id: string;
    doctor_id: string;
    queue_id?: string;
    consultation_date: string;
    chief_complaints: string;
    examination_findings?: string;
    diagnosis: string;
    diagnosis_codes?: string[]; // ICD-10 codes
    treatment_plan?: string;
    follow_up_date?: string;
    follow_up_notes?: string;
    duration_minutes?: number;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    prescription_id?: string;
    created_at: string;
    updated_at: string;
    hospital_id: string;
}

export interface CreateConsultationData {
    patient_id: string;
    doctor_id: string;
    queue_id?: string;
    chief_complaints: string;
    examination_findings?: string;
    diagnosis: string;
    diagnosis_codes?: string[];
    treatment_plan?: string;
    follow_up_date?: string;
    follow_up_notes?: string;
}

export interface ConsultationWithRelations extends OPDConsultation {
    patient?: any;
    doctor?: any;
    prescription?: any;
}

// ==================== OPD SERVICE ====================

class OPDService {
    // ==================== CONSULTATION OPERATIONS ====================

    /**
     * Create a new OPD consultation record
     */
    async createConsultation(data: CreateConsultationData): Promise<OPDConsultation> {
        try {
            const supabase = await getSupabase();
            logger.log('📝 Creating OPD consultation...');

            const consultationData = {
                patient_id: data.patient_id,
                doctor_id: data.doctor_id,
                queue_id: data.queue_id || null,
                chief_complaints: data.chief_complaints,
                examination_findings: data.examination_findings || null,
                diagnosis: data.diagnosis,
                diagnosis_codes: data.diagnosis_codes || [],
                treatment_plan: data.treatment_plan || null,
                follow_up_date: data.follow_up_date || null,
                follow_up_notes: data.follow_up_notes || null,
                hospital_id: HOSPITAL_ID,
                consultation_date: new Date().toISOString(),
                status: 'IN_PROGRESS'
            };

            const { data: newConsultation, error } = await supabase
                .from('opd_consultations')
                .insert(consultationData)
                .select()
                .single();

            if (error) {
                logger.error('❌ Error creating consultation:', error);
                throw new Error(error.message);
            }

            logger.log('✅ Consultation created successfully:', newConsultation.id);

            // If queue_id is provided, update queue status to IN_CONSULTATION
            if (data.queue_id) {
                await SupabaseHospitalService.updateOPDQueueStatus(data.queue_id, 'IN_CONSULTATION');
                logger.log('✅ Queue status updated to IN_CONSULTATION');
            }

            return newConsultation;
        } catch (error: any) {
            logger.error('❌ Error creating consultation:', error);
            throw error;
        }
    }

    /**
     * Get consultation by ID
     */
    async getConsultationById(id: string): Promise<ConsultationWithRelations | null> {
        try {
            const supabase = await getSupabase();
            logger.log('📋 Fetching consultation:', id);

            const { data, error } = await supabase
                .from('opd_consultations')
                .select(`
                    *,
                    patient:patients(id, first_name, last_name, age, gender, phone, uhid),
                    doctor:users(id, first_name, last_name, email, role)
                `)
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                logger.error('❌ Error fetching consultation:', error);
                throw new Error(error.message);
            }

            logger.log('✅ Consultation retrieved');
            return data;
        } catch (error: any) {
            logger.error('❌ Error fetching consultation:', error);
            return null;
        }
    }

    /**
     * Get all consultations for a patient
     */
    async getPatientConsultations(patientId: string): Promise<ConsultationWithRelations[]> {
        try {
            const supabase = await getSupabase();
            logger.log('📋 Fetching consultations for patient:', patientId);

            const { data, error } = await supabase
                .from('opd_consultations')
                .select(`
                    *,
                    patient:patients(id, first_name, last_name, age, gender, phone, uhid),
                    doctor:users(id, first_name, last_name, email)
                `)
                .eq('patient_id', patientId)
                .order('consultation_date', { ascending: false });

            if (error) {
                logger.error('❌ Error fetching patient consultations:', error);
                throw new Error(error.message);
            }

            const consultations = data || [];
            logger.log(`✅ Retrieved ${consultations.length} consultations`);
            return consultations;
        } catch (error: any) {
            logger.error('❌ Error fetching patient consultations:', error);
            return [];
        }
    }

    /**
     * Get consultations by date range
     */
    async getConsultationsByDateRange(startDate: string, endDate: string): Promise<ConsultationWithRelations[]> {
        try {
            const supabase = await getSupabase();
            logger.log('📅 Fetching consultations from', startDate, 'to', endDate);

            const { data, error } = await supabase
                .from('opd_consultations')
                .select(`
                    *,
                    patient:patients(id, first_name, last_name, age, gender, phone, uhid),
                    doctor:users(id, first_name, last_name, email)
                `)
                .gte('consultation_date', startDate)
                .lte('consultation_date', endDate)
                .order('consultation_date', { ascending: false });

            if (error) {
                logger.error('❌ Error fetching consultations by date:', error);
                throw new Error(error.message);
            }

            const consultations = data || [];
            logger.log(`✅ Retrieved ${consultations.length} consultations`);
            return consultations;
        } catch (error: any) {
            logger.error('❌ Error fetching consultations by date:', error);
            return [];
        }
    }

    /**
     * Update consultation
     */
    async updateConsultation(id: string, updates: Partial<CreateConsultationData>): Promise<OPDConsultation> {
        try {
            const supabase = await getSupabase();
            logger.log('🔄 Updating consultation:', id);

            const { data, error } = await supabase
                .from('opd_consultations')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('❌ Error updating consultation:', error);
                throw new Error(error.message);
            }

            logger.log('✅ Consultation updated successfully');
            return data;
        } catch (error: any) {
            logger.error('❌ Error updating consultation:', error);
            throw error;
        }
    }

    /**
     * Complete consultation
     */
    async completeConsultation(id: string, queueId?: string): Promise<OPDConsultation> {
        try {
            const supabase = await getSupabase();
            logger.log('✅ Completing consultation:', id);

            const { data, error } = await supabase
                .from('opd_consultations')
                .update({
                    status: 'COMPLETED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('❌ Error completing consultation:', error);
                throw new Error(error.message);
            }

            logger.log('✅ Consultation marked as completed');

            // Update queue status to COMPLETED if queue_id is provided
            if (queueId) {
                await SupabaseHospitalService.updateOPDQueueStatus(queueId, 'COMPLETED');
                logger.log('✅ Queue status updated to COMPLETED');
            }

            return data;
        } catch (error: any) {
            logger.error('❌ Error completing consultation:', error);
            throw error;
        }
    }

    /**
     * Delete consultation
     */
    async deleteConsultation(id: string): Promise<void> {
        try {
            const supabase = await getSupabase();
            logger.log('🗑️ Deleting consultation:', id);

            const { error } = await supabase
                .from('opd_consultations')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('❌ Error deleting consultation:', error);
                throw new Error(error.message);
            }

            logger.log('✅ Consultation deleted successfully');
        } catch (error: any) {
            logger.error('❌ Error deleting consultation:', error);
            throw error;
        }
    }

    // ==================== STATISTICS ====================

    /**
     * Get consultation statistics
     */
    async getConsultationStats(doctorId?: string, startDate?: string, endDate?: string): Promise<any> {
        try {
            const supabase = await getSupabase();
            logger.log('📊 Fetching consultation statistics');

            let query = supabase
                .from('opd_consultations')
                .select('id, status, consultation_date');

            if (doctorId) {
                query = query.eq('doctor_id', doctorId);
            }

            if (startDate) {
                query = query.gte('consultation_date', startDate);
            }

            if (endDate) {
                query = query.lte('consultation_date', endDate);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('❌ Error fetching consultation stats:', error);
                throw new Error(error.message);
            }

            const consultations = data || [];
            const todayStr = new Date().toISOString().split('T')[0];

            const stats = {
                total: consultations.length,
                today: consultations.filter(c => c.consultation_date?.startsWith(todayStr)).length,
                completed: consultations.filter(c => c.status === 'COMPLETED').length,
                in_progress: consultations.filter(c => c.status === 'IN_PROGRESS').length
            };

            logger.log('✅ Statistics retrieved:', stats);
            return stats;
        } catch (error: any) {
            logger.error('❌ Error fetching consultation stats:', error);
            return {
                total: 0,
                today: 0,
                completed: 0,
                in_progress: 0
            };
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Search ICD-10 codes (wrapper around HospitalService)
     */
    async searchICD10(query: string): Promise<{ code: string; description: string }[]> {
        return SupabaseHospitalService.searchICD10(query);
    }

    /**
     * Get latest vitals for patient (wrapper around HospitalService)
     */
    async getLatestVitals(patientId: string): Promise<any> {
        return SupabaseHospitalService.getLatestVitals(patientId);
    }

    /**
     * Get patient history
     */
    async getPatientHistory(patientId: string): Promise<any> {
        try {
            const consultations = await this.getPatientConsultations(patientId);
            const prescriptions = await SupabaseHospitalService.getPrescriptions(patientId);
            const vitals = await SupabaseHospitalService.getLatestVitals(patientId);

            return {
                consultations,
                prescriptions,
                vitals
            };
        } catch (error: any) {
            logger.error('❌ Error fetching patient history:', error);
            return {
                consultations: [],
                prescriptions: [],
                vitals: null
            };
        }
    }
}

// Export singleton instance
export const opdService = new OPDService();
export default opdService;
