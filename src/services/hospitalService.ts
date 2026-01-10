import axios from 'axios';
import { logger } from '../utils/logger';
import type {
  Patient,
  PatientTransaction,
  FutureAppointment,
  PatientAdmission,
  DailyExpense,
  User,
  Department,
  Bed,
  CreatePatientData,
  CreateTransactionData,
  CreateAppointmentData,
  PatientWithRelations,
  DashboardStats,
  AppointmentWithRelations
} from '../config/supabaseNew';

const HOSPITAL_ID = 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d'; // Default hospital ID

export class HospitalService {

  // ==================== HELPERS ====================

  private static getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private static getBaseUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:3002';
  }

  // ==================== AUTHENTICATION ====================

  static async getCurrentUser(): Promise<User | null> {
    try {
      logger.log('🔍 Getting current user from localStorage...');

      const userStr = localStorage.getItem('auth_user');
      if (!userStr) {
        logger.log('⚠️ No authenticated user found in localStorage');
        return null;
      }

      const user = JSON.parse(userStr);
      logger.log('✅ Current user found:', user.email);
      logger.log('👤 User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      });

      return user as User;

    } catch (error: any) {
      logger.error('🚨 getCurrentUser error:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  static async createUserProfile(authUser: any): Promise<User> {
    logger.log('👤 Attempting user profile creation/retrieval for:', authUser.email);
    logger.log('📧 Email:', authUser.email);
    logger.log('🆔 Auth ID:', authUser.id);

    // Create fallback user object in case of database issues
    const fallbackUser = {
      id: authUser.id,
      auth_id: authUser.id,
      email: authUser.email || '',
      first_name: authUser.email?.split('@')[0] || 'User',
      last_name: '',
      role: 'STAFF' as const,
      phone: '',
      specialization: '',
      consultation_fee: 0,
      department: 'General',
      hospital_id: HOSPITAL_ID,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as User;

    logger.log('🔄 Created fallback user profile:', fallbackUser);

    try {
      // Check localStorage first
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const existingUser = JSON.parse(userStr);
        logger.log('✅ Found existing user profile in localStorage:', existingUser.email);
        return existingUser as User;
      }

      logger.log('⚠️ No user in localStorage, using fallback profile');
      return fallbackUser;

    } catch (error: any) {
      logger.log('⚠️ User profile error, using fallback:', error.message);
      return fallbackUser;
    }
  }

  static async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      logger.log('🔐 Signing in via backend API:', email);
      logger.log('📡 API URL:', this.getBaseUrl());
      logger.log('🔑 Credentials:', { email, passwordLength: password.length });

      const response = await axios.post(`${this.getBaseUrl()}/api/auth/login`, {
        email,
        password
      });

      logger.log('📥 Login response received:', response.status);
      logger.log('📦 Response data:', response.data);

      if (response.data.token) {
        const { user, token } = response.data;
        logger.log('✅ Token received, length:', token.length);
        logger.log('👤 User data:', user);

        // Store in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        logger.log('💾 Stored token and user in localStorage');

        logger.log('✅ Sign in successful for:', user.email);
        return { user, error: null };
      }

      logger.log('⚠️ No token in response, login failed');
      return { user: null, error: 'Login failed - no token received' };

    } catch (error: any) {
      logger.error('🚨 SignIn exception:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      logger.error('Error message:', error.message);
      return { user: null, error: error.response?.data || error.message };
    }
  }

  static async signOut(): Promise<{ error: any }> {
    try {
      logger.log('🚪 Signing out...');
      logger.log('🗑️ Removing auth_token from localStorage');
      localStorage.removeItem('auth_token');
      logger.log('🗑️ Removing auth_user from localStorage');
      localStorage.removeItem('auth_user');
      logger.log('✅ Sign out successful');
      return { error: null };
    } catch (error) {
      logger.error('❌ Sign out error:', error);
      return { error };
    }
  }

  // ==================== CONNECTION STATUS ====================

  static async getConnectionStatus(): Promise<boolean> {
    try {
      logger.log('🔍 Checking backend connection...');
      logger.log('📡 Backend URL:', this.getBaseUrl());

      const response = await axios.get(`${this.getBaseUrl()}/api/health`, {
        headers: this.getHeaders(),
        timeout: 5000
      });

      logger.log('✅ Connection check response:', response.status);
      logger.log('✅ Connection to backend is active');
      return response.status === 200;
    } catch (error: any) {
      logger.error('🚨 Connection check error:', error);
      logger.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.status
      });
      return false;
    }
  }

  // ==================== PATIENT OPERATIONS ====================

  static async findExistingPatient(phone?: string, firstName?: string, lastName?: string): Promise<Patient | null> {
    try {
      logger.log('🔍 Searching for existing patient with:', { phone, firstName, lastName });

      if (!phone && !firstName) {
        logger.log('⚠️ No search criteria provided');
        return null;
      }

      logger.log('📞 Phone:', phone || 'N/A');
      logger.log('👤 Name:', `${firstName || ''} ${lastName || ''}`.trim() || 'N/A');

      const response = await axios.get(`${this.getBaseUrl()}/api/patients/search`, {
        headers: this.getHeaders(),
        params: {
          phone: phone?.trim(),
          first_name: firstName?.trim(),
          last_name: lastName?.trim()
        }
      });

      if (response.data) {
        logger.log('✅ Found existing patient:', response.data.first_name, response.data.last_name);
        logger.log('📋 Patient details:', {
          id: response.data.id,
          patient_id: response.data.patient_id,
          phone: response.data.phone,
          email: response.data.email
        });
        return response.data;
      }

      logger.log('ℹ️ No existing patient found');
      return null;

    } catch (error: any) {
      logger.error('🚨 findExistingPatient error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data
      });
      return null;
    }
  }

  static async createPatientVisit(visitData: any): Promise<any> {
    try {
      logger.log('🏥 Creating patient visit:', visitData);
      logger.log('👤 Patient ID:', visitData.patient_id);
      logger.log('🩺 Visit type:', visitData.visit_type);
      logger.log('📋 Chief complaint:', visitData.chief_complaint);

      const response = await axios.post(`${this.getBaseUrl()}/api/patient-visits`, {
        ...visitData,
        visit_date: visitData.visit_date ? new Date(visitData.visit_date).toISOString() : new Date().toISOString()
      }, {
        headers: this.getHeaders()
      });

      logger.log('✅ Visit created successfully:', response.data);
      logger.log('🆔 Visit ID:', response.data.id);
      return response.data;

    } catch (error: any) {
      logger.error('🚨 createPatientVisit error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async getPatientVisits(patientId: string): Promise<any[]> {
    try {
      logger.log('📋 Getting patient visits for:', patientId);

      const response = await axios.get(`${this.getBaseUrl()}/api/patient-visits`, {
        headers: this.getHeaders(),
        params: { patient_id: patientId }
      });

      logger.log('✅ Retrieved visits:', response.data?.length || 0);
      return response.data || [];

    } catch (error: any) {
      logger.error('🚨 getPatientVisits error:', error);
      throw error;
    }
  }

  static async createPatient(data: CreatePatientData): Promise<Patient> {
    logger.log('👤 Creating patient with data:', data);
    logger.log('📝 First name:', data.first_name);
    logger.log('📝 Last name:', data.last_name);
    logger.log('📞 Phone:', data.phone);
    logger.log('📧 Email:', data.email);
    logger.log('🎂 Age:', data.age, 'Type:', typeof data.age);
    logger.log('👨‍⚕️ Assigned doctor:', data.assigned_doctor);
    logger.log('🏥 Assigned department:', data.assigned_department);
    logger.log('📅 Date of entry:', data.date_of_entry);

    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/patients`, data, {
        headers: this.getHeaders()
      });

      logger.log('✅ Patient created successfully:', response.data);
      logger.log('🆔 Patient ID:', response.data.patient_id);
      logger.log('🎂 Age in response:', response.data?.age, 'Type:', typeof response.data?.age);

      return response.data as Patient;

    } catch (error: any) {
      logger.error('🚨 createPatient error:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      throw error;
    }
  }

  static async getPatientsForDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      logger.log(`📅 Fetching patients for EXACT date: ${dateStr} (NO CUMULATIVE RESULTS)`);
      logger.log('📊 Limit:', limit);
      logger.log('🗓️ Target date:', dateStr);
      logger.log('📡 API endpoint:', `${this.getBaseUrl()}/api/patients/by-date/${dateStr}`);

      const response = await axios.get(`${this.getBaseUrl()}/api/patients/by-date/${dateStr}`, {
        headers: this.getHeaders(),
        params: { limit }
      });

      const patients = response.data || [];
      logger.log(`✅ Retrieved ${patients.length} patients for exact date ${dateStr}`);

      // Log first few patients for debugging
      if (patients.length > 0) {
        logger.log('🔍 Sample patients found:');
        patients.slice(0, 3).forEach((p: any, i: number) => {
          logger.log(`${i + 1}. ${p.first_name} ${p.last_name}:`, {
            created_at: p.created_at,
            date_of_entry: p.date_of_entry
          });
        });
      }

      // Client-side enhancement
      const enhancedPatients = patients.map((patient: any) => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];

        logger.log(`💰 Processing patient ${patient.first_name}: ${transactions.length} transactions`);

        // Calculate totalSpent
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        // Count visits
        const registrationVisits = transactions.filter((t: any) =>
          (t.transaction_type === 'ENTRY_FEE' ||
            t.transaction_type === 'entry_fee' ||
            t.transaction_type === 'CONSULTATION' ||
            t.transaction_type === 'consultation' ||
            t.transaction_type === 'LAB_TEST' ||
            t.transaction_type === 'XRAY' ||
            t.transaction_type === 'PROCEDURE') &&
          t.status !== 'CANCELLED'
        ).length;

        const visitCount = Math.max(registrationVisits, 1);

        // Get last visit
        const lastTransactionDate = transactions.length > 0
          ? new Date(Math.max(...transactions.map((t: any) => new Date(t.created_at).getTime())))
          : new Date(patient.created_at);

        const departmentStatus = patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' as const : 'OPD' as const;

        logger.log(`📊 Patient stats: spend=₹${totalSpent}, visits=${visitCount}, dept=${departmentStatus}`);

        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit: lastTransactionDate.toISOString().split('T')[0],
          departmentStatus
        };
      });

      logger.log(`✅ Final result: ${enhancedPatients.length} enhanced patients for ${dateStr}`);
      return enhancedPatients as PatientWithRelations[];

    } catch (error: any) {
      logger.error('🚨 getPatientsForDate error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Fallback: return empty array
      logger.log('🔄 Falling back to empty result due to error');
      return [];
    }
  }

  static async getPatients(limit = 5000, skipOrthoFilter = true, includeInactive = false): Promise<PatientWithRelations[]> {
    try {
      const timestamp = new Date().toISOString();
      logger.log(`📋 Fetching patients with limit=${limit}, skipOrthoFilter=${skipOrthoFilter}, includeInactive=${includeInactive} at ${timestamp}...`);
      logger.log('📡 Backend API URL:', this.getBaseUrl());
      logger.log('🔑 Has auth token:', !!localStorage.getItem('auth_token'));

      const response = await axios.get(`${this.getBaseUrl()}/api/patients`, {
        headers: this.getHeaders(),
        params: {
          limit,
          skip_ortho_filter: skipOrthoFilter,
          include_inactive: includeInactive
        }
      });

      const patients = response.data || [];
      logger.log(`✅ Received ${patients.length} patients from backend`);

      // Debug: Check if we're hitting limits
      if (patients.length === 1000 || patients.length === 100) {
        logger.warn(`⚠️ WARNING: Received exactly ${patients.length} patients - might be hitting a limit!`);
      }

      // Log sample patient data
      if (patients.length > 0) {
        logger.log('🔍 Sample patient data (first patient):');
        const sample = patients[0];
        logger.log('First patient:', {
          id: sample.id,
          patient_id: sample.patient_id,
          name: `${sample.first_name} ${sample.last_name}`,
          created_at: sample.created_at,
          date_of_entry: sample.date_of_entry,
          department: sample.assigned_department,
          doctor: sample.assigned_doctor,
          has_transactions: !!sample.transactions,
          transaction_count: sample.transactions?.length || 0
        });
      }

      // Client-side enhancement
      logger.log('🔄 Enhancing patients with calculated fields...');
      const enhancedPatients = patients.map((patient: any, index: number) => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];

        if (index < 5) {
          logger.log(`Patient ${index + 1}: ${patient.first_name} ${patient.last_name} - ${transactions.length} transactions`);
        }

        // Calculate totalSpent
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        // Count visits
        const allActiveTransactions = transactions.filter((t: any) => t.status !== 'CANCELLED');
        const visitCount = allActiveTransactions.filter((t: any) =>
        (t.transaction_type === 'ENTRY_FEE' ||
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation' ||
          t.transaction_type === 'LAB_TEST' ||
          t.transaction_type === 'XRAY' ||
          t.transaction_type === 'PROCEDURE')
        ).length;

        // Get last visit
        const lastVisit = allActiveTransactions.length > 0
          ? new Date(Math.max(...allActiveTransactions.map((t: any) => new Date(t.created_at || t.transaction_date || '').getTime())))
            .toISOString().split('T')[0]
          : undefined;

        // Determine department status
        const departmentStatus = patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' : 'OPD';

        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit,
          departmentStatus
        };
      });

      logger.log(`✅ Enhanced ${enhancedPatients.length} patients with calculated fields`);
      logger.log(`📊 Total patients returned: ${enhancedPatients.length}`);

      return enhancedPatients as PatientWithRelations[];

    } catch (error: any) {
      logger.error('🚨 getPatients error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      throw error;
    }
  }

  static async getPatientById(id: string): Promise<PatientWithRelations | null> {
    try {
      logger.log('🔍 Getting patient by ID:', id);
      logger.log('📡 API URL:', `${this.getBaseUrl()}/api/patients/${id}`);

      const response = await axios.get(`${this.getBaseUrl()}/api/patients/${id}`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Patient retrieved successfully');
      logger.log('🔍 Raw patient data from backend:', response.data);
      logger.log('🎂 Age field in response:', response.data?.age, 'Type:', typeof response.data?.age);
      logger.log('📞 Phone:', response.data?.phone);
      logger.log('📧 Email:', response.data?.email);

      return response.data;

    } catch (error: any) {
      logger.error('🚨 getPatientById error:', error);
      logger.error('Error response:', error.response?.data);
      return null;
    }
  }

  static async deletePatient(patientId: string): Promise<void> {
    try {
      logger.log(`🗑️ Deleting patient with ID: ${patientId}`);
      logger.log('📡 DELETE request to:', `${this.getBaseUrl()}/api/patients/${patientId}`);

      await axios.delete(`${this.getBaseUrl()}/api/patients/${patientId}`, {
        headers: this.getHeaders()
      });

      logger.log(`✅ Patient with ID ${patientId} deleted successfully`);
    } catch (error: any) {
      logger.error('🚨 deletePatient error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async updatePatient(patientId: string, updateData: Partial<Patient>): Promise<Patient | null> {
    try {
      logger.log(`📝 Updating patient with ID: ${patientId}`);
      logger.log('📦 Update data:', updateData);
      logger.log('📡 PUT request to:', `${this.getBaseUrl()}/api/patients/${patientId}`);

      const response = await axios.put(`${this.getBaseUrl()}/api/patients/${patientId}`, updateData, {
        headers: this.getHeaders()
      });

      logger.log(`✅ Patient updated successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      logger.error('🚨 updatePatient error:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);

      // Handle specific errors
      if (error.response?.status === 404) {
        logger.error('❌ Patient not found');
      } else if (error.response?.status === 400) {
        logger.error('❌ Invalid update data');
      }

      throw error;
    }
  }

  private static async getMaxPatientIdNumber(): Promise<number> {
    try {
      logger.log('🔢 Getting next patient ID number from backend...');

      const response = await axios.get(`${this.getBaseUrl()}/api/patients/next-id`, {
        headers: this.getHeaders()
      });

      const nextNumber = response.data.next_number || 0;
      logger.log('✅ Next patient ID number:', nextNumber);
      return nextNumber;
    } catch (error) {
      logger.error('Exception in getMaxPatientIdNumber:', error);
      return 0;
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  static async createTransaction(data: CreateTransactionData): Promise<PatientTransaction> {
    logger.log('💰 Creating transaction with data:', data);
    logger.log('👤 Patient ID:', data.patient_id);
    logger.log('💵 Amount:', data.amount);
    logger.log('📋 Type:', data.transaction_type);
    logger.log('💳 Payment mode:', data.payment_mode);
    logger.log('📅 Transaction date:', data.transaction_date);
    logger.log('👨‍⚕️ Doctor:', data.doctor_name);
    logger.log('🏥 Department:', data.department);

    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/transactions`, data, {
        headers: this.getHeaders()
      });

      logger.log('✅ Transaction created successfully:', response.data);
      logger.log('🆔 Transaction ID:', response.data.id);
      logger.log('📅 Transaction date saved:', response.data.transaction_date);

      // Verify the transaction was saved correctly
      logger.log('🔍 TRANSACTION VERIFICATION:', {
        insertedId: response.data.id,
        amount: response.data.amount,
        transaction_type: response.data.transaction_type,
        transaction_date: response.data.transaction_date,
        created_at: response.data.created_at
      });

      return response.data as PatientTransaction;

    } catch (error: any) {
      logger.error('🚨 createTransaction error:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      throw error;
    }
  }

  static async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    try {
      logger.log('📋 Getting transactions for patient:', patientId);
      logger.log('📡 API URL:', `${this.getBaseUrl()}/api/transactions`);

      const response = await axios.get(`${this.getBaseUrl()}/api/transactions`, {
        headers: this.getHeaders(),
        params: { patient_id: patientId }
      });

      logger.log('✅ Retrieved transactions:', response.data?.length || 0);

      // Log transaction details
      if (response.data && response.data.length > 0) {
        logger.log('📊 Transaction summary:');
        response.data.forEach((t: any, i: number) => {
          if (i < 5) {
            logger.log(`${i + 1}. ₹${t.amount} - ${t.transaction_type} - ${t.transaction_date || t.created_at}`);
          }
        });
      }

      return response.data || [];

    } catch (error: any) {
      logger.error('🚨 getTransactionsByPatient error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async updateTransaction(transactionId: string, updateData: Partial<PatientTransaction>): Promise<PatientTransaction> {
    try {
      logger.log(`🔄 Updating transaction ${transactionId}`);
      logger.log('📦 Update data:', updateData);

      const response = await axios.put(`${this.getBaseUrl()}/api/transactions/${transactionId}`, updateData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Transaction updated successfully');
      logger.log('📊 Updated transaction:', response.data);
      return response.data;

    } catch (error: any) {
      logger.error('🚨 updateTransaction error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async updateTransactionStatus(transactionId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED'): Promise<PatientTransaction> {
    try {
      logger.log(`🔄 Updating transaction ${transactionId} status to ${status}`);
      return await this.updateTransaction(transactionId, { status });
    } catch (error: any) {
      logger.error('🚨 updateTransactionStatus error:', error);
      throw error;
    }
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      logger.log(`🗑️ Permanently deleting transaction ${transactionId}`);
      logger.log('⚠️ This action cannot be undone');

      await axios.delete(`${this.getBaseUrl()}/api/transactions/${transactionId}`, {
        headers: this.getHeaders()
      });

      logger.log(`✅ Transaction permanently deleted successfully`);
      logger.log('🔍 Transaction removed from database');

    } catch (error: any) {
      logger.error('🚨 deleteTransaction error:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      throw error;
    }
  }

  static async getAllTransactions(): Promise<PatientTransaction[]> {
    try {
      logger.log('📋 Getting all transactions for backup/export');

      const response = await axios.get(`${this.getBaseUrl()}/api/transactions`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Retrieved all transactions:', response.data?.length || 0);
      return response.data || [];

    } catch (error: any) {
      logger.error('🚨 getAllTransactions error:', error);
      throw error;
    }
  }

  static async getAllExpenses(): Promise<DailyExpense[]> {
    try {
      logger.log('📋 Getting all expenses for backup/export');

      const response = await axios.get(`${this.getBaseUrl()}/api/daily_expenses`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Retrieved all expenses:', response.data?.length || 0);
      return response.data || [];

    } catch (error: any) {
      logger.error('🚨 getAllExpenses error:', error);
      throw error;
    }
  }


  // ==================== APPOINTMENT OPERATIONS ====================

  static async createAppointment(data: CreateAppointmentData): Promise<FutureAppointment> {
    logger.log('📅 Creating appointment with data:', data);
    logger.log('👤 Patient ID:', data.patient_id);
    logger.log('👨‍⚕️ Doctor ID:', data.doctor_id);
    logger.log('📆 Date:', data.appointment_date);
    logger.log('🕐 Time:', data.appointment_time);
    logger.log('⏱️ Duration:', data.duration_minutes, 'minutes');
    logger.log('📋 Type:', data.appointment_type);
    logger.log('💵 Estimated cost:', data.estimated_cost);

    try {
      const appointmentData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        duration_minutes: data.duration_minutes || 30,
        appointment_type: data.appointment_type || 'CONSULTATION',
        reason: data.reason || '',
        status: data.status || 'SCHEDULED',
        estimated_cost: data.estimated_cost || 0,
        notes: data.notes || null
      };

      logger.log('📤 Sending appointment data to backend:', appointmentData);

      const response = await axios.post(`${this.getBaseUrl()}/api/appointments`, appointmentData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Appointment created successfully:', response.data);
      logger.log('🆔 Appointment ID:', response.data.id);
      logger.log('📅 Scheduled for:', response.data.appointment_date, 'at', response.data.appointment_time);

      return response.data;

    } catch (error: any) {
      logger.error('🚨 createAppointment error:', error);
      logger.error('Error response:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      throw error;
    }
  }

  static async getAppointments(limit = 100): Promise<AppointmentWithRelations[]> {
    try {
      logger.log('📅 [HOSPITAL SERVICE] Fetching appointments from backend...');
      logger.log('📊 Limit:', limit);
      logger.log('🔗 Backend URL:', this.getBaseUrl());
      logger.log('🔑 Has auth token:', !!localStorage.getItem('auth_token'));

      const response = await axios.get(`${this.getBaseUrl()}/api/appointments`, {
        headers: this.getHeaders(),
        params: { limit }
      });

      const appointments = response.data || [];
      logger.log('✅ [HOSPITAL SERVICE] Successfully loaded appointments:', appointments.length);
      logger.log('📊 [HOSPITAL SERVICE] Appointments count:', appointments.length);

      // Log sample appointment
      if (appointments.length > 0) {
        logger.log('🔍 Sample appointment:', {
          id: appointments[0].id,
          date: appointments[0].appointment_date,
          time: appointments[0].appointment_time,
          patient: appointments[0].patient,
          doctor: appointments[0].doctor
        });
      }

      return appointments as AppointmentWithRelations[];

    } catch (error: any) {
      logger.error('🚨 getAppointments error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ==================== DASHBOARD OPERATIONS ====================

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.log('📊 Getting dashboard stats from backend...');
      logger.log('📡 API URL:', `${this.getBaseUrl()}/api/dashboard/stats`);

      const today = new Date().toISOString().split('T')[0];
      logger.log('🗓️ Today\'s date:', today);

      const response = await axios.get(`${this.getBaseUrl()}/api/dashboard/stats`, {
        headers: this.getHeaders()
      });

      const stats = response.data;

      logger.log('✅ Dashboard stats received from backend');
      logger.log('📊 Stats summary:', {
        totalPatients: stats.totalPatients,
        totalDoctors: stats.totalDoctors,
        todayRevenue: stats.todayRevenue,
        monthlyRevenue: stats.monthlyRevenue,
        todayExpenses: stats.todayExpenses,
        todayAppointments: stats.todayAppointments,
        totalBeds: stats.totalBeds
      });

      logger.log('💰 Revenue breakdown:', {
        today: stats.todayRevenue,
        monthly: stats.monthlyRevenue,
        expenses: stats.todayExpenses,
        net: stats.todayRevenue - stats.todayExpenses
      });

      logger.log('🔍 Dashboard Stats Debug:', {
        totalPatients: stats.totalPatients,
        todayRevenue: stats.todayRevenue,
        timestamp: new Date().toLocaleTimeString(),
        todayDate: today
      });

      return stats;

    } catch (error: any) {
      logger.error('🚨 getDashboardStats error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  static async getDashboardStatsWithDateRange(startDate: string, endDate: string): Promise<any> {
    try {
      logger.log('📊 Getting dashboard stats with date range from backend...');
      logger.log('📅 Date range:', { startDate, endDate });
      logger.log('📡 API URL:', `${this.getBaseUrl()}/api/dashboard/stats`);

      const response = await axios.get(`${this.getBaseUrl()}/api/dashboard/stats`, {
        headers: this.getHeaders(),
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      const stats = response.data;

      logger.log('✅ Date range stats received');
      logger.log('📊 Stats for period:', {
        startDate,
        endDate,
        totalPatients: stats.totalPatients,
        totalRevenue: stats.todayRevenue,
        totalExpenses: stats.todayExpenses,
        appointments: stats.todayAppointments
      });

      logger.log('💰 Date range revenue calculation:', {
        startDate,
        endDate,
        totalRevenue: stats.todayRevenue,
        totalExpenses: stats.todayExpenses,
        netRevenue: stats.todayRevenue - stats.todayExpenses
      });

      return stats;

    } catch (error: any) {
      logger.error('🚨 getDashboardStatsWithDateRange error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  static async testConnection(): Promise<{ success: boolean; message: string; user?: User | null }> {
    try {
      logger.log('🧪 Testing backend connection...');
      logger.log('📡 Backend URL:', this.getBaseUrl());
      logger.log('🔑 Has auth token:', !!localStorage.getItem('auth_token'));

      const isOnline = await this.getConnectionStatus();
      logger.log('✅ Connection status:', isOnline ? 'ONLINE' : 'OFFLINE');

      const user = await this.getCurrentUser();
      logger.log('👤 Current user:', user ? user.email : 'None');

      const message = user
        ? `Connected successfully as ${user.email}`
        : 'Connected successfully (not authenticated)';

      logger.log('📋 Connection test result:', {
        success: isOnline,
        message,
        userEmail: user?.email,
        userRole: user?.role
      });

      return {
        success: isOnline,
        message,
        user
      };

    } catch (error: any) {
      logger.error('🚨 Connection test failed:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  static getServiceStatus(): { isOnline: boolean; service: string } {
    logger.log('📊 Getting service status...');
    const status = {
      isOnline: true,
      service: 'Azure Backend'
    };
    logger.log('✅ Service status:', status);
    return status;
  }

  // ==================== DISCHARGE MANAGEMENT OPERATIONS ====================

  static async getPatientTransactionsByAdmission(patientId: string) {
    try {
      logger.log('📊 Loading patient transactions for discharge billing...');
      logger.log('👤 Patient ID:', patientId);

      const response = await axios.get(`${this.getBaseUrl()}/api/transactions`, {
        headers: this.getHeaders(),
        params: {
          patient_id: patientId,
          status: 'COMPLETED'
        }
      });

      const transactions = response.data || [];
      logger.log(`✅ Loaded ${transactions.length} completed transactions`);

      // Calculate total
      const total = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      logger.log(`💰 Total transaction amount: ₹${total}`);

      return transactions;

    } catch (error: any) {
      logger.error('❌ Error loading patient transactions:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async createDischargeSummary(summaryData: any) {
    try {
      logger.log('📝 Creating discharge summary...');
      logger.log('📋 Summary data:', summaryData);
      logger.log('👤 Patient ID:', summaryData.patient_id);
      logger.log('🏥 Admission ID:', summaryData.admission_id);

      const response = await axios.post(`${this.getBaseUrl()}/api/discharge-summaries`, summaryData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Discharge summary created successfully');
      logger.log('🆔 Summary ID:', response.data.id);
      return response.data;

    } catch (error: any) {
      logger.error('❌ Error creating discharge summary:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async createDischargeBill(billData: any) {
    try {
      logger.log('💰 Creating discharge bill...');
      logger.log('📋 Bill data:', billData);
      logger.log('💵 Total amount:', billData.total_amount);
      logger.log('💳 Payment mode:', billData.payment_mode);

      const response = await axios.post(`${this.getBaseUrl()}/api/discharge-bills`, billData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Discharge bill created successfully');
      logger.log('🆔 Bill ID:', response.data.id);
      logger.log('🧾 Bill number:', response.data.bill_number);
      return response.data;

    } catch (error: any) {
      logger.error('❌ Error creating discharge bill:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async getDischargeHistory(patientId: string) {
    try {
      logger.log('📋 Loading discharge history...');
      logger.log('👤 Patient ID:', patientId);

      const response = await axios.get(`${this.getBaseUrl()}/api/discharge-summaries`, {
        headers: this.getHeaders(),
        params: { patient_id: patientId }
      });

      const history = response.data || [];
      logger.log(`✅ Loaded ${history.length} discharge records`);

      return history;

    } catch (error: any) {
      logger.error('❌ Error loading discharge history:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async getDischargeSummaryWithBill(admissionId: string) {
    try {
      logger.log('📄 Loading complete discharge record for admission:', admissionId);
      logger.log('📡 API URL:', `${this.getBaseUrl()}/api/discharge-summaries/${admissionId}`);

      const response = await axios.get(`${this.getBaseUrl()}/api/discharge-summaries/${admissionId}`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Complete discharge record loaded');
      logger.log('📊 Record details:', {
        id: response.data.id,
        patient_id: response.data.patient_id,
        admission_id: response.data.admission_id,
        has_bill: !!response.data.bill
      });

      return response.data;

    } catch (error: any) {
      logger.error('❌ Error loading discharge record:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  static async getDischargedAdmissions() {
    try {
      logger.log('📋 Loading discharged admissions...');

      const response = await axios.get(`${this.getBaseUrl()}/api/admissions`, {
        headers: this.getHeaders(),
        params: { status: 'DISCHARGED' }
      });

      const admissions = response.data || [];
      logger.log(`✅ Loaded ${admissions.length} discharged admissions`);

      // Log sample admission
      if (admissions.length > 0) {
        logger.log('🔍 Sample admission:', {
          id: admissions[0].id,
          patient_id: admissions[0].patient_id,
          admission_date: admissions[0].admission_date,
          discharge_date: admissions[0].discharge_date
        });
      }

      return admissions;

    } catch (error: any) {
      logger.error('❌ Error loading discharged admissions:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async getDischargeSummary(admissionId: string) {
    try {
      logger.log('📄 Loading discharge summary for admission:', admissionId);

      const response = await axios.get(`${this.getBaseUrl()}/api/discharge-summaries/${admissionId}`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Discharge summary loaded');
      return response.data;

    } catch (error: any) {
      logger.warn('⚠️ No discharge summary found:', error.message);
      return null;
    }
  }

  static async createAdmission(admissionData: any) {
    try {
      logger.log('🏥 Creating admission record...');
      logger.log('📋 Admission data:', admissionData);
      logger.log('👤 Patient ID:', admissionData.patient_id);
      logger.log('🛏️ Bed number:', admissionData.bed_number);
      logger.log('🏨 Room type:', admissionData.room_type);
      logger.log('🏥 Department:', admissionData.department);

      const response = await axios.post(`${this.getBaseUrl()}/api/admissions`, admissionData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Admission record created successfully');
      logger.log('🆔 Admission ID:', response.data.id);
      logger.log('📅 Admission date:', response.data.admission_date);

      return response.data;

    } catch (error: any) {
      logger.error('❌ Error creating admission:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  static async verifyAdmissionExists(admissionId: string) {
    try {
      logger.log('🔍 Verifying admission exists:', admissionId);

      const response = await axios.get(`${this.getBaseUrl()}/api/admissions/${admissionId}`, {
        headers: this.getHeaders()
      });

      const exists = !!response.data;
      logger.log('✅ Admission verification result:', exists);

      if (exists) {
        logger.log('✅ Admission found:', response.data);
      } else {
        logger.log('⚠️ Admission not found');
      }

      return exists;

    } catch (error: any) {
      logger.error('❌ Admission verification failed:', error);
      return false;
    }
  }

  static async createMissingAdmissionRecord(patientId: string, bedId: string, admissionDate?: string, bedNumber?: number) {
    try {
      logger.log('🆘 Creating missing admission record for patient:', patientId);
      logger.log('🛏️ Bed ID:', bedId);
      logger.log('🔢 Bed number:', bedNumber);
      logger.log('📅 Admission date:', admissionDate || 'today');

      const admissionData = {
        patient_id: patientId,
        bed_number: bedNumber || 1,
        room_type: 'GENERAL',
        department: 'GENERAL',
        admission_date: admissionDate || new Date().toISOString(),
        status: 'ADMITTED' as const,
        hospital_id: HOSPITAL_ID
      };

      logger.log('📤 Sending admission data:', admissionData);

      const response = await axios.post(`${this.getBaseUrl()}/api/admissions`, admissionData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Missing admission record created successfully');
      logger.log('🆔 New admission ID:', response.data.id);

      return response.data;

    } catch (error: any) {
      logger.error('❌ Error creating missing admission:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // ==================== CUSTOM INVESTIGATIONS ====================

  static async getCustomInvestigations(): Promise<any[]> {
    try {
      logger.log('📋 Getting custom investigations from backend...');

      const response = await axios.get(`${this.getBaseUrl()}/api/custom-investigations`, {
        headers: this.getHeaders()
      });

      const investigations = response.data || [];
      logger.log('✅ Custom investigations retrieved:', investigations.length);

      return investigations;

    } catch (error: any) {
      logger.error('🚨 getCustomInvestigations error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async addCustomInvestigation(name: string, description?: string, category?: string): Promise<any> {
    try {
      logger.log('📋 Adding custom investigation:', name);
      logger.log('📝 Description:', description);
      logger.log('📂 Category:', category);

      const response = await axios.post(`${this.getBaseUrl()}/api/custom-investigations`, {
        name: name.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'General'
      }, {
        headers: this.getHeaders()
      });

      logger.log('✅ Custom investigation added successfully');
      logger.log('🆔 Investigation ID:', response.data.id);

      return response.data;

    } catch (error: any) {
      logger.error('🚨 addCustomInvestigation error:', error);
      logger.error('Error response:', error.response?.data);

      // Handle duplicate
      if (error.response?.status === 409) {
        logger.log('⚠️ Investigation already exists:', name);
      }

      throw error;
    }
  }

  static async deleteCustomInvestigation(id: string): Promise<void> {
    try {
      logger.log('🗑️ Deleting custom investigation:', id);

      await axios.delete(`${this.getBaseUrl()}/api/custom-investigations/${id}`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Custom investigation deleted successfully');

    } catch (error: any) {
      logger.error('🚨 deleteCustomInvestigation error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // ==================== CUSTOM PAIN COMPLAINTS ====================

  static async getPainComplaints(): Promise<any[]> {
    try {
      logger.log('🩹 Getting pain complaints from backend...');

      const response = await axios.get(`${this.getBaseUrl()}/api/pain-complaints`, {
        headers: this.getHeaders()
      });

      const complaints = response.data || [];
      logger.log('✅ Pain complaints retrieved:', complaints.length);

      return complaints;

    } catch (error: any) {
      logger.error('🚨 getPainComplaints error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async addPainComplaint(name: string): Promise<any> {
    try {
      logger.log('🩹 Adding pain complaint:', name);

      const response = await axios.post(`${this.getBaseUrl()}/api/pain-complaints`, {
        name: name.trim()
      }, {
        headers: this.getHeaders()
      });

      logger.log('✅ Pain complaint added successfully');
      logger.log('🆔 Complaint ID:', response.data.id);

      return response.data;

    } catch (error: any) {
      logger.error('🚨 addPainComplaint error:', error);
      logger.error('Error response:', error.response?.data);

      // Handle duplicate
      if (error.response?.status === 409) {
        logger.log('⚠️ Pain complaint already exists:', name);
      }

      throw error;
    }
  }

  // ==================== CUSTOM LOCATIONS ====================

  static async getLocations(): Promise<any[]> {
    try {
      logger.log('📍 Getting locations from backend...');

      const response = await axios.get(`${this.getBaseUrl()}/api/locations`, {
        headers: this.getHeaders()
      });

      const locations = response.data || [];
      logger.log('✅ Locations retrieved:', locations.length);

      return locations;

    } catch (error: any) {
      logger.error('🚨 getLocations error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async addLocation(name: string): Promise<any> {
    try {
      logger.log('📍 Adding location:', name);

      const response = await axios.post(`${this.getBaseUrl()}/api/locations`, {
        name: name.trim()
      }, {
        headers: this.getHeaders()
      });

      logger.log('✅ Location added successfully');
      logger.log('🆔 Location ID:', response.data.id);

      return response.data;

    } catch (error: any) {
      logger.error('🚨 addLocation error:', error);
      logger.error('Error response:', error.response?.data);

      // Handle duplicate
      if (error.response?.status === 409) {
        logger.log('⚠️ Location already exists:', name);
      }

      throw error;
    }
  }

  // ==================== PRESCRIPTION MANAGEMENT ====================

  static async savePrescription(prescriptionData: any): Promise<any> {
    try {
      logger.log('💊 Saving prescription...');
      logger.log('👤 Patient ID:', prescriptionData.patient_id);
      logger.log('👤 Patient name:', prescriptionData.patient_name);
      logger.log('👨‍⚕️ Doctor:', prescriptionData.doctor_name);
      logger.log('🏥 Department:', prescriptionData.department);
      logger.log('📋 Chief complaints:', prescriptionData.chief_complaints);

      const prescriptionRecord = {
        patient_id: prescriptionData.patient_id,
        patient_name: prescriptionData.patient_name,
        doctor_name: prescriptionData.doctor_name,
        department: prescriptionData.department,
        hospital_id: HOSPITAL_ID,
        chief_complaints: prescriptionData.chief_complaints,
        present_history: prescriptionData.present_history,
        past_history: prescriptionData.past_history,
        drug_history: prescriptionData.drug_history,
        local_examination: prescriptionData.local_examination,
        investigations: prescriptionData.investigations,
        investigation_reference: prescriptionData.investigation_reference,
        general_advise: prescriptionData.general_advise,
        medical_advise: prescriptionData.medical_advise,
        created_by: 'user',
        is_active: true
      };

      logger.log('📤 Sending prescription to backend...');

      const response = await axios.post(`${this.getBaseUrl()}/api/prescriptions`, prescriptionRecord, {
        headers: this.getHeaders()
      });

      logger.log('✅ Prescription saved successfully');
      logger.log('🆔 Prescription ID:', response.data.id);

      return response.data;

    } catch (error: any) {
      logger.error('🚨 savePrescription error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async getPrescriptions(patientId: string): Promise<any[]> {
    try {
      logger.log('📋 Getting prescriptions for patient:', patientId);

      const response = await axios.get(`${this.getBaseUrl()}/api/prescriptions`, {
        headers: this.getHeaders(),
        params: { patient_id: patientId }
      });

      const prescriptions = response.data || [];
      logger.log('✅ Prescriptions retrieved:', prescriptions.length);

      // Log details
      if (prescriptions.length > 0) {
        logger.log('🔍 Latest prescription:', {
          id: prescriptions[0].id,
          doctor: prescriptions[0].doctor_name,
          date: prescriptions[0].created_at
        });
      }

      return prescriptions;

    } catch (error: any) {
      logger.error('🚨 getPrescriptions error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async updatePrescription(id: string, prescriptionData: any): Promise<any> {
    try {
      logger.log('🔄 Updating prescription:', id);
      logger.log('📦 Update data:', prescriptionData);

      const updateData = {
        chief_complaints: prescriptionData.chief_complaints,
        present_history: prescriptionData.present_history,
        past_history: prescriptionData.past_history,
        drug_history: prescriptionData.drug_history,
        local_examination: prescriptionData.local_examination,
        investigations: prescriptionData.investigations,
        investigation_reference: prescriptionData.investigation_reference,
        general_advise: prescriptionData.general_advise,
        medical_advise: prescriptionData.medical_advise,
        updated_at: new Date().toISOString()
      };

      const response = await axios.put(`${this.getBaseUrl()}/api/prescriptions/${id}`, updateData, {
        headers: this.getHeaders()
      });

      logger.log('✅ Prescription updated successfully');

      return response.data;

    } catch (error: any) {
      logger.error('🚨 updatePrescription error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }

  static async deletePrescription(id: string): Promise<void> {
    try {
      logger.log('🗑️ Deleting prescription:', id);

      await axios.delete(`${this.getBaseUrl()}/api/prescriptions/${id}`, {
        headers: this.getHeaders()
      });

      logger.log('✅ Prescription deleted successfully');

    } catch (error: any) {
      logger.error('🚨 deletePrescription error:', error);
      logger.error('Error response:', error.response?.data);
      throw error;
    }
  }
}

export default HospitalService;
