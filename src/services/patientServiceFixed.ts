import axios from 'axios';
import type { Patient } from '../types/index';

export interface CreatePatientData {
  first_name: string;
  last_name?: string;
  phone?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  email?: string;
}

export class FixedPatientService {
  
  // =====================================================
  // HELPERS
  // =====================================================
  
  private static getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private static getBaseUrl() {
    return import.meta.env.VITE_API_URL || '';
  }
  
  /**
   * Create patient with only columns that actually exist in your table
   * Backend handles validation and minimal field logic
   */
  static async createPatient(patientData: CreatePatientData): Promise<Patient> {
    try {
      console.log('👤 Creating patient via backend API:', patientData);
      
      // Build minimal data
      const minimalData = {
        first_name: patientData.first_name?.trim() || 'Unknown',
      };

      // Add optional fields only if provided
      const optionalData: any = {};
      if (patientData.last_name?.trim()) optionalData.last_name = patientData.last_name.trim();
      if (patientData.phone?.trim()) optionalData.phone = patientData.phone.trim();
      if (patientData.address?.trim()) optionalData.address = patientData.address.trim();
      if (patientData.gender) optionalData.gender = patientData.gender;
      if (patientData.date_of_birth) optionalData.date_of_birth = patientData.date_of_birth;
      if (patientData.emergency_contact_name?.trim()) optionalData.emergency_contact_name = patientData.emergency_contact_name.trim();
      if (patientData.emergency_contact_phone?.trim()) optionalData.emergency_contact_phone = patientData.emergency_contact_phone.trim();
      if (patientData.email?.trim()) optionalData.email = patientData.email.trim();

      const finalData = { ...minimalData, ...optionalData };

      console.log('📤 Sending data to backend:', finalData);

      // Try insertion via backend
      const response = await axios.post(`${this.getBaseUrl()}/api/patients`, finalData, {
        headers: this.getHeaders()
      });

      console.log('✅ Patient created successfully:', response.data);
      return response.data as Patient;

    } catch (error: any) {
      console.error('❌ Patient creation failed:', error);
      console.error('Error response:', error.response?.data);
      
      // If backend returns column error, try ultra minimal
      if (error.response?.data?.message?.includes('column')) {
        console.log('🔄 Trying ultra minimal patient data...');
        
        try {
          const ultraMinimal = {
            first_name: patientData.first_name?.trim() || 'Unknown',
          };
          
          const ultraResponse = await axios.post(`${this.getBaseUrl()}/api/patients`, ultraMinimal, {
            headers: this.getHeaders()
          });
          
          console.log('✅ Ultra minimal patient created:', ultraResponse.data);
          return ultraResponse.data as Patient;
        } catch (ultraError: any) {
          console.error('❌ Even minimal insertion failed:', ultraError);
          throw new Error(`Even minimal insertion failed: ${ultraError.response?.data?.message || ultraError.message}`);
        }
      }
      
      throw new Error(`Patient creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get the actual table structure (for debugging)
   */
  static async getTableStructure(): Promise<any> {
    try {
      console.log('🔍 Getting table structure from backend...');
      
      const response = await axios.get(`${this.getBaseUrl()}/api/debug/patients/structure`, {
        headers: this.getHeaders()
      });

      console.log('✅ Table structure:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('❌ Error getting table structure:', error);
      return { 
        error: error.response?.data?.message || error.message, 
        columns: [] 
      };
    }
  }

  /**
   * Test what columns actually exist
   */
  static async testColumnExists(columnName: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing if column '${columnName}' exists...`);
      
      const response = await axios.get(`${this.getBaseUrl()}/api/debug/patients/column-exists`, {
        headers: this.getHeaders(),
        params: { column: columnName }
      });

      const exists = response.data.exists || false;
      console.log(`${exists ? '✅' : '❌'} Column '${columnName}' ${exists ? 'exists' : 'does not exist'}`);
      return exists;
    } catch (error) {
      console.error(`❌ Error testing column '${columnName}':`, error);
      return false;
    }
  }
}

export default FixedPatientService;