// Data Service - Backend API Integration
import axios from 'axios';
import { HOSPITAL_ID } from '../config/supabaseNew';
import localStorageService from './localStorageService';
import type { Patient, Doctor, Department, PatientTransaction, PatientAdmission, DailyExpense } from './localStorageService';
import type { User, ApiResponse } from '../types/index';
import { logger } from '../utils/logger';

class DataService {
  private useLocalFallback: boolean = false;

  constructor() {
    this.useLocalFallback = false;
    logger.log('✅ DataService initialized in Backend API mode');
  }

  // Helper methods for API calls
  private getBaseUrl(): string {
    let baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 4);
    }
    return baseUrl;
  }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<User | null> {
    logger.log('🔐 Attempting Backend API login for:', email);
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/auth/login`, { email, password });

      if (response.data.token) {
        const { user, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));

        return {
          id: user.id,
          email: user.email,
          password: '',
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active ?? true,
          created_at: user.created_at || new Date().toISOString()
        } as User;
      }
      return null;
    } catch (error) {
      logger.error('🚨 Authentication failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    logger.log('🔍 Getting current user from localStorage...');
    try {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        logger.log('✅ Current user found:', user.email);
        return user as User;
      }
      logger.log('⚠️ No current user found');
      return null;
    } catch (error) {
      logger.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    logger.log('📡 Logging out...');
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      logger.log('✅ Logout successful');
    } catch (error) {
      logger.error('❌ Error during logout:', error);
      throw error;
    }
  }

  // ==================== PATIENT MANAGEMENT - Backend API ====================

  async createPatient(patientData: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Patient> {
    logger.log('📡 Creating patient via backend API:', patientData);
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/patients`, patientData, {
        headers: this.getHeaders()
      });
      logger.log('✅ Patient created successfully via backend:', response.data);
      return response.data;
    } catch (error) {
      logger.error('🚨 Patient creation failed:', error);
      throw error;
    }
  }

  async getPatients(): Promise<Patient[]> {
    logger.log('📡 Fetching patients from backend API');
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/patients`, {
        headers: this.getHeaders()
      });
      logger.log('✅ Patients fetched successfully from backend:', response.data?.length || 0, 'records');
      return response.data || [];
    } catch (error) {
      logger.error('🚨 Patients fetch failed:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    logger.log('📡 Fetching patient by ID from backend API:', id);
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/patients/${id}`, {
        headers: this.getHeaders()
      });
      logger.log('✅ Patient fetched successfully from backend:', response.data);
      return response.data;
    } catch (error) {
      logger.error('🚨 Patient fetch failed:', error);
      throw error;
    }
  }

  // ==================== DOCTOR MANAGEMENT ====================

  async getDoctors(): Promise<Doctor[]> {
    logger.log('📡 getDoctors() called - returning hardcoded doctors');
    const hardcodedDoctors = this.getHardcodedDoctors();
    logger.log('✅ Returning hardcoded doctors:', hardcodedDoctors);
    return hardcodedDoctors;
  }

  private getHardcodedDoctors(): Doctor[] {
    return [
      {
        id: 'doctor-naveen',
        name: 'Doctor Naveen',
        department: 'General Medicine',
        specialization: 'General Medicine',
        fee: 500,
        is_active: true
      }
    ];
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    logger.log('📡 Fetching doctors by department:', department);
    const allDoctors = this.getHardcodedDoctors();
    const filtered = allDoctors.filter(d => d.department === department);
    logger.log('✅ Doctors by department:', filtered.length, 'records');
    return filtered;
  }

  // ==================== DEPARTMENT MANAGEMENT ====================

  async getDepartments(): Promise<Department[]> {
    logger.log('📡 getDepartments() called - returning hardcoded departments');
    const hardcodedDepartments = this.getHardcodedDepartments();
    logger.log('✅ Returning hardcoded departments:', hardcodedDepartments);
    return hardcodedDepartments;
  }

  private getHardcodedDepartments(): Department[] {
    return [
      {
        id: 'general-medicine-dept',
        name: 'General Medicine',
        description: 'General Health and Wellness',
        is_active: true
      }
    ];
  }

  // ==================== TRANSACTION MANAGEMENT - Backend API ====================

  async createTransaction(transactionData: Omit<PatientTransaction, 'id'>): Promise<PatientTransaction> {
    logger.log('📡 Creating transaction via backend API:', transactionData);
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/transactions`, transactionData, {
        headers: this.getHeaders()
      });
      logger.log('✅ Transaction created successfully via backend:', response.data);
      return response.data;
    } catch (error) {
      logger.error('🚨 Transaction creation failed:', error);
      throw error;
    }
  }

  async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    logger.log('📡 Fetching transactions by patient from backend:', patientId);
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/transactions`, {
        headers: this.getHeaders(),
        params: { patient_id: patientId }
      });
      logger.log('✅ Transactions fetched successfully from backend:', response.data?.length || 0, 'records');
      return response.data || [];
    } catch (error) {
      logger.error('🚨 Transactions fetch failed:', error);
      throw error;
    }
  }

  // ==================== VISITS & ADMISSIONS ====================

  async createPatientVisit(visitData: any): Promise<any> {
    logger.log('📡 Creating patient visit via backend API:', visitData);
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/patient-visits`, visitData, {
        headers: this.getHeaders()
      });
      logger.log('✅ Patient visit created successfully via backend:', response.data);
      return response.data;
    } catch (error) {
      logger.error('🚨 Patient visit creation failed:', error);
      throw error;
    }
  }



  async getPatientVisits(patientId: string): Promise<any[]> {
    logger.log('📡 Fetching patient visits from backend:', patientId);
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/patient-visits`, {
        headers: this.getHeaders(),
        params: { patient_id: patientId }
      });
      logger.log('✅ Patient visits fetched successfully:', response.data?.length || 0, 'records');
      return response.data || [];
    } catch (error) {
      logger.error('🚨 Patient visits fetch failed:', error);
      return [];
    }
  }

  async getTransactionsByDate(date: string): Promise<PatientTransaction[]> {
    logger.log('📡 Fetching transactions by date from backend:', date);
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/transactions`, {
        headers: this.getHeaders(),
        params: {
          start_date: `${date}T00:00:00`,
          end_date: `${date}T23:59:59`
        }
      });
      logger.log('✅ Transactions by date fetched successfully:', response.data?.length || 0, 'records');
      return response.data || [];
    } catch (error) {
      logger.error('🚨 Transactions by date fetch failed:', error);
      throw error;
    }
  }

  // ==================== ADMISSION MANAGEMENT ====================

  async createAdmission(admissionData: Omit<PatientAdmission, 'id'>): Promise<PatientAdmission> {
    logger.log('📡 Creating admission via backend API:', admissionData);
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/admissions`, admissionData, {
        headers: this.getHeaders()
      });
      logger.log('✅ Admission created successfully:', response.data);
      return response.data;
    } catch (error) {
      logger.error('🚨 Admission creation failed:', error);
      throw error;
    }
  }

  async getActiveAdmissions(): Promise<PatientAdmission[]> {
    logger.log('📡 Fetching active admissions from backend');
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/admissions`, {
        headers: this.getHeaders(),
        params: { status: 'active' }
      });
      logger.log('✅ Active admissions fetched:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      logger.error('🚨 Active admissions fetch failed:', error);
      return [];
    }
  }

  // ==================== EXPENSE MANAGEMENT - Backend API ====================

  async createExpense(expenseData: Omit<DailyExpense, 'id'>): Promise<DailyExpense> {
    logger.log('📡 Creating expense via backend API:', expenseData);
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/daily_expenses`, expenseData, {
        headers: this.getHeaders()
      });
      logger.log('✅ Expense created successfully:', response.data);
      return response.data;
    } catch (error) {
      logger.error('🚨 Expense creation failed:', error);
      throw error;
    }
  }

  async getExpensesByDate(date: string): Promise<DailyExpense[]> {
    logger.log('📡 Fetching expenses by date from backend:', date);
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/daily_expenses`, {
        headers: this.getHeaders(),
        params: { date }
      });
      logger.log('✅ Expenses by date fetched:', response.data?.length || 0, 'records');
      return response.data || [];
    } catch (error) {
      logger.error('🚨 Expenses by date fetch failed:', error);
      return [];
    }
  }

  // ==================== REVENUE CALCULATION ====================

  async getDailyRevenue(date: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netRevenue: number;
    transactionBreakdown: any;
  }> {
    logger.log('📡 Calculating daily revenue for:', date);
    try {
      const transactions = await this.getTransactionsByDate(date);
      const expenses = await this.getExpensesByDate(date);

      const totalIncome = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netRevenue = totalIncome - totalExpenses;

      const transactionBreakdown = transactions.reduce((breakdown, t) => {
        breakdown[t.transaction_type] = (breakdown[t.transaction_type] || 0) + (t.amount || 0);
        return breakdown;
      }, {} as Record<string, number>);

      const result = {
        totalIncome,
        totalExpenses,
        netRevenue,
        transactionBreakdown,
      };

      logger.log('✅ Daily revenue calculated:', result);
      return result;
    } catch (error) {
      logger.error('🚨 Daily revenue calculation failed:', error);
      throw error;
    }
  }

  // ==================== SERVICE STATUS ====================

  getServiceStatus(): { isOnline: boolean; service: 'Supabase' | 'LocalStorage' } {
    return {
      isOnline: true,
      service: 'Supabase' // Backend API is effectively Supabase replacement
    };
  }

  // ==================== DATA MANAGEMENT ====================

  exportData(): string {
    throw new Error('Export not implemented for Backend API mode');
  }

  importData(jsonData: string): void {
    throw new Error('Import not implemented for Backend API mode');
  }

  clearAllData(): void {
    if (this.useLocalFallback) {
      localStorageService.clearAllData();
      localStorageService.initializeDefaultData();
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;

// Export types
export type {
  Patient,
  Doctor,
  Department,
  PatientTransaction,
  PatientAdmission,
  DailyExpense,
  User
};