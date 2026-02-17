import axios from 'axios';
import { logger } from '../utils/logger';
import { SupabaseHospitalService } from './supabaseHospitalService';

const HOSPITAL_ID = 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d';

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
    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    private getBaseUrl() {
        return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    }

    // ==================== CONSULTATION OPERATIONS ====================

    /**
     * Create a new OPD consultation record
     */
    async createConsultation(data: CreateConsultationData): Promise<OPDConsultation> {
        try {
            logger.log('📝 Creating OPD consultation...');
            logger.log('👤 Patient ID:', data.patient_id);
            logger.log('👨‍⚕️ Doctor ID:', data.doctor_id);
            logger.log('🩺 Chief complaints:', data.chief_complaints);

            const consultationData = {
                ...data,
                hospital_id: HOSPITAL_ID,
                consultation_date: new Date().toISOString(),
                status: 'IN_PROGRESS' as const
            };

            const response = await axios.post(
                `${this.getBaseUrl()}/api/opd-consultations`,
                consultationData,
                { headers: this.getHeaders() }
            );

            logger.log('✅ Consultation created successfully');
            logger.log('🆔 Consultation ID:', response.data.id);

            // If queue_id is provided, update queue status to IN_CONSULTATION
            if (data.queue_id) {
                await SupabaseHospitalService.updateOPDQueueStatus(data.queue_id, 'IN_CONSULTATION');
                logger.log('✅ Queue status updated to IN_CONSULTATION');
            }

            return response.data;
        } catch (error: any) {
            logger.error('❌ Error creating consultation:', error);
            logger.error('Error response:', error.response?.data);
            throw error;
        }
    }

    /**
     * Get consultation by ID
     */
    async getConsultationById(id: string): Promise<ConsultationWithRelations | null> {
        try {
            logger.log('📋 Fetching consultation:', id);

            const response = await axios.get(
                `${this.getBaseUrl()}/api/opd-consultations/${id}`,
                { headers: this.getHeaders() }
            );

            logger.log('✅ Consultation retrieved');
            return response.data;
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
            logger.log('📋 Fetching consultations for patient:', patientId);

            const response = await axios.get(
                `${this.getBaseUrl()}/api/opd-consultations`,
                {
                    headers: this.getHeaders(),
                    params: { patient_id: patientId }
                }
            );

            const consultations = response.data || [];
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
            logger.log('📅 Fetching consultations from', startDate, 'to', endDate);

            const response = await axios.get(
                `${this.getBaseUrl()}/api/opd-consultations`,
                {
                    headers: this.getHeaders(),
                    params: { start_date: startDate, end_date: endDate }
                }
            );

            const consultations = response.data || [];
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
            logger.log('🔄 Updating consultation:', id);
            logger.log('📦 Updates:', updates);

            const response = await axios.put(
                `${this.getBaseUrl()}/api/opd-consultations/${id}`,
                updates,
                { headers: this.getHeaders() }
            );

            logger.log('✅ Consultation updated successfully');
            return response.data;
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
            logger.log('✅ Completing consultation:', id);

            const response = await axios.put(
                `${this.getBaseUrl()}/api/opd-consultations/${id}/complete`,
                {},
                { headers: this.getHeaders() }
            );

            logger.log('✅ Consultation marked as completed');

            // Update queue status to COMPLETED if queue_id is provided
            if (queueId) {
                await SupabaseHospitalService.updateOPDQueueStatus(queueId, 'COMPLETED');
                logger.log('✅ Queue status updated to COMPLETED');
            }

            return response.data;
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
            logger.log('🗑️ Deleting consultation:', id);

            await axios.delete(
                `${this.getBaseUrl()}/api/opd-consultations/${id}`,
                { headers: this.getHeaders() }
            );

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
            logger.log('📊 Fetching consultation statistics');

            const params: any = {};
            if (doctorId) params.doctor_id = doctorId;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await axios.get(
                `${this.getBaseUrl()}/api/opd-consultations/stats`,
                {
                    headers: this.getHeaders(),
                    params
                }
            );

            logger.log('✅ Statistics retrieved');
            return response.data;
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
