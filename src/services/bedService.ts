import axios from 'axios';
import type { PatientWithRelations } from '../config/supabaseNew';

export interface BedData {
  id: string;
  bed_number: string;
  room_type: string;
  status: 'occupied' | 'vacant' | 'AVAILABLE' | 'OCCUPIED';
  patient_id?: string;
  ipd_number?: string;
  admission_date?: string;
  admission_id?: string;
  tat_start_time?: number;
  tat_status?: 'idle' | 'running' | 'completed' | 'expired';
  tat_remaining_seconds?: number;
  consent_form_data?: any;
  consent_form_submitted?: boolean;
  clinical_record_data?: any;
  clinical_record_submitted?: boolean;
  progress_sheet_data?: any;
  progress_sheet_submitted?: boolean;
  nurses_orders_data?: any;
  nurses_orders_submitted?: boolean;
  ipd_consents_data?: any;
  created_at?: string;
  updated_at?: string;
  // Include patient data when loaded
  patients?: PatientWithRelations;
}

export interface IPDCounter {
  id: string;
  date_key: string;
  counter: number;
  created_at: string;
  updated_at: string;
}

class BedService {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private getBaseUrl() {
    return import.meta.env.VITE_API_URL || '';
  }

  // Get all beds with patient information
  async getAllBeds(): Promise<BedData[]> {
    try {
      console.log('🔍 BedService: Starting getAllBeds query...');
      
      const response = await axios.get(`${this.getBaseUrl()}/api/beds`, {
        headers: this.getHeaders()
      });

      console.log('🔍 BedService: Query completed');
      console.log('🔍 BedService: Data?', response.data?.length, 'rows');

      return response.data || [];
    } catch (error) {
      console.error('❌ BedService.getAllBeds failed:', error);
      throw error;
    }
  }

  // Get a specific bed by ID
  async getBedById(bedId: string): Promise<BedData | null> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/beds/${bedId}`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('BedService.getBedById failed:', error);
      return null;
    }
  }

  // Generate next IPD number using backend API
  async getNextIPDNumber(): Promise<string> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/ipd/next-number`, {
        headers: this.getHeaders()
      });

      console.log('🏥 Generated IPD Number:', response.data);
      return response.data.ipd_number || response.data;
    } catch (error) {
      console.error('BedService.getNextIPDNumber failed:', error);
      throw error;
    }
  }

  // Admit patient to bed
  async admitPatientToBed(
    bedId: string, 
    patient: PatientWithRelations, 
    admissionDate?: string
  ): Promise<BedData> {
    try {
      // Generate IPD number
      const ipdNumber = await this.getNextIPDNumber();
      
      const admissionDateToUse = admissionDate || new Date().toISOString();

      // Get bed details first
      const bedData = await this.getBedById(bedId);

      // Create admission record
      const admissionResponse = await axios.post(
        `${this.getBaseUrl()}/api/admissions`,
        {
          patient_id: patient.id,
          bed_id: bedId,
          bed_number: bedData?.bed_number ? parseInt(bedData.bed_number) : 1,
          room_type: bedData?.room_type || 'GENERAL',
          department: patient.assigned_department || 'GENERAL',
          admission_date: admissionDateToUse,
          status: 'ADMITTED'
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Admission record created:', admissionResponse.data);

      // Update bed with patient information
      const response = await axios.put(
        `${this.getBaseUrl()}/api/beds/${bedId}`,
        {
          status: 'occupied',
          patient_id: patient.id,
          ipd_number: ipdNumber,
          admission_date: admissionDateToUse,
          admission_id: admissionResponse.data.id,
          tat_status: 'idle',
          tat_remaining_seconds: 1800,
          consent_form_submitted: false,
          clinical_record_submitted: false,
          progress_sheet_submitted: false,
          nurses_orders_submitted: false
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Patient admitted successfully. IPD Number:', ipdNumber);
      return response.data;
    } catch (error) {
      console.error('❌ BedService.admitPatientToBed failed:', error);
      throw error;
    }
  }

  // Discharge patient from bed
  async dischargePatientFromBed(bedId: string): Promise<BedData> {
    try {
      const response = await axios.put(
        `${this.getBaseUrl()}/api/beds/${bedId}`,
        {
          status: 'vacant',
          patient_id: null,
          ipd_number: null,
          admission_date: null,
          admission_id: null,
          tat_start_time: null,
          tat_status: 'idle',
          tat_remaining_seconds: 1800,
          consent_form_data: null,
          consent_form_submitted: false,
          clinical_record_data: null,
          clinical_record_submitted: false,
          progress_sheet_data: null,
          progress_sheet_submitted: false,
          nurses_orders_data: null,
          nurses_orders_submitted: false,
          ipd_consents_data: null,
          updated_at: new Date().toISOString()
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Patient discharged successfully');
      return response.data;
    } catch (error) {
      console.error('BedService.dischargePatientFromBed failed:', error);
      throw error;
    }
  }

  // Update bed data (for forms, TAT, etc.)
  async updateBed(bedId: string, updates: Partial<BedData>): Promise<BedData> {
    try {
      const response = await axios.put(
        `${this.getBaseUrl()}/api/beds/${bedId}`,
        {
          ...updates,
          updated_at: new Date().toISOString()
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('BedService.updateBed failed:', error);
      throw error;
    }
  }

  // Subscribe to real-time bed changes (DISABLED for REST API)
  subscribeToBedsChanges(callback: (payload: any) => void) {
    console.warn('⚠️ Real-time subscriptions not supported with REST API');
    console.log('💡 Consider implementing polling or WebSocket connections');
    
    // Return a dummy subscription object
    return {
      unsubscribe: () => console.log('Dummy subscription unsubscribed')
    };
  }

  // Unsubscribe from real-time changes (DISABLED for REST API)
  unsubscribeFromBedsChanges(subscription: any) {
    console.log('❌ Real-time subscriptions not active');
  }

  // Get today's IPD stats
  async getIPDStats(): Promise<{ date: string; count: number; lastIPD: string }> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/ipd/stats`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('BedService.getIPDStats failed:', error);
      return {
        date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        count: 0,
        lastIPD: 'None'
      };
    }
  }

  // Initialize beds if they don't exist - DISABLED
  async initializeBeds(): Promise<void> {
    console.log('🚫 Bed initialization DISABLED - use main database only');
    return;
  }
}

export default new BedService();