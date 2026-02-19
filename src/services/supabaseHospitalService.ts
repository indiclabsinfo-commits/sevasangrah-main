// Supabase Hospital Service - Direct database access
// Zero Backend Architecture - No API dependencies

import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

// Note: Use getSupabase() async function instead of direct supabase instance

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  specialization?: string;
  phone?: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  phone: string;
  uhid?: string;
  aadhaar_number?: string;
  abha_id?: string;
  address?: string;
  created_at: string;
}

export class SupabaseHospitalService {
  // ==================== AUTHENTICATION ====================

  static async getCurrentUser(): Promise<User | null> {
    const supabase = await getSupabase();
    try {
      logger.log('🔍 Getting current user from Supabase auth');

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        logger.log('⚠️ No authenticated user found');
        return null;
      }

      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (profileError) {
        logger.error('❌ Error fetching user profile:', profileError);
        // Return basic user info from auth
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
          last_name: user.user_metadata?.last_name || '',
          role: user.user_metadata?.role || 'user'
        };
      }

      logger.log('✅ Current user found:', userProfile);
      return userProfile as User;
    } catch (error) {
      logger.error('🚨 getCurrentUser error:', error);
      return null;
    }
  }

  // ==================== PATIENTS ====================

  static async searchPatients(searchTerm: string): Promise<Patient[]> {
    const supabase = await getSupabase();
    try {
      logger.log('🔍 Searching patients:', searchTerm);

      if (!searchTerm.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,uhid.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        logger.error('❌ Error searching patients:', error);
        throw error;
      }

      logger.log(`✅ Found ${data?.length || 0} patients`);
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to search patients:', error);
      return [];
    }
  }

  static async getPatient(patientId: string | number): Promise<Patient | null> {
    const supabase = await getSupabase();
    try {
      logger.log('👤 Getting patient:', patientId);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        logger.error('❌ Error fetching patient:', error);
        throw error;
      }

      logger.log('✅ Patient found:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to fetch patient:', error);
      return null;
    }
  }

  static async createPatient(patientData: any): Promise<Patient> {
    const supabase = await getSupabase();
    try {
      logger.log('➕ Creating patient:', patientData);

      const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating patient:', error);
        throw error;
      }

      logger.log('✅ Patient created:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to create patient:', error);
      throw error;
    }
  }

  static async updatePatient(patientId: string, updateData: any): Promise<Patient | null> {
    const supabase = await getSupabase();
    try {
      logger.log('🔄 Updating patient:', patientId, updateData);

      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error updating patient:', error);
        throw error;
      }

      logger.log('✅ Patient updated:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to update patient:', error);
      throw error;
    }
  }

  // ==================== DOCTORS ====================

  static async getDoctors(): Promise<User[]> {
    const supabase = await getSupabase();
    try {
      logger.log('👨‍⚕️ Fetching doctors from Supabase');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
        .order('first_name');

      if (error) {
        logger.error('❌ Error fetching doctors:', error);
        throw error;
      }

      logger.log(`✅ Found ${data?.length || 0} doctors`);
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch doctors:', error);
      return [];
    }
  }

  // ==================== OPD QUEUES ====================

  static async getOPDQueues(
    status?: string,
    doctor_id?: string,
    date?: string
  ): Promise<any[]> {
    const supabase = await getSupabase();
    try {
      logger.log('🔍 Fetching OPD queues from Supabase', { status, doctor_id, date });

      let query = supabase
        .from('opd_queues')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:users(id, first_name, last_name, email, specialization)
        `)
        .order('queue_number', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('queue_status', status);
      }

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Error fetching OPD queues:', error);
        throw error;
      }

      logger.log(`✅ Found ${data?.length || 0} OPD queue items`);
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch OPD queues:', error);
      return [];
    }
  }

  static async addToOPDQueue(data: {
    patient_id: string;
    doctor_id: string;
    priority?: string;
    notes?: string;
  }): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('➕ Adding patient to OPD queue:', data);

      // Get next queue number for this doctor today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: lastQueue, error: queueError } = await supabase
        .from('opd_queues')
        .select('queue_number')
        .eq('doctor_id', data.doctor_id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('queue_number', { ascending: false })
        .limit(1);

      const nextQueueNumber = (lastQueue?.[0]?.queue_number || 0) + 1;

      // Create queue entry
      const queueData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        queue_number: nextQueueNumber,
        queue_status: 'waiting',
        priority: data.priority || 'normal',
        notes: data.notes,
        estimated_wait_time: data.priority === 'urgent' ? 15 : data.priority === 'emergency' ? 5 : 30
      };

      const { data: newQueue, error } = await supabase
        .from('opd_queues')
        .insert(queueData)
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:users(id, first_name, last_name, email, specialization)
        `)
        .single();

      if (error) {
        logger.error('❌ Error adding to queue:', error);
        throw error;
      }

      logger.log('✅ Patient added to queue:', newQueue);
      return newQueue;
    } catch (error) {
      logger.error('🚨 Failed to add to queue:', error);
      throw error;
    }
  }

  static async updateOPDQueueStatus(
    queueId: string,
    status: string
  ): Promise<any> {
    try {
      logger.log('🔄 Updating queue status:', { queueId, status });

      const updateData: any = {
        queue_status: status,
        updated_at: new Date().toISOString()
      };

      // Set consultation timestamps
      if (status === 'in_consultation') {
        updateData.consultation_start_time = new Date().toISOString();
      } else if (status === 'completed' || status === 'cancelled') {
        updateData.consultation_end_time = new Date().toISOString();
      }

      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('opd_queues')
        .update(updateData)
        .eq('id', queueId)
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:users(id, first_name, last_name, email, specialization)
        `)
        .single();

      if (error) {
        logger.error('❌ Error updating queue status:', error);
        throw error;
      }

      logger.log('✅ Queue status updated:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to update queue status:', error);
      throw error;
    }
  }

  static async reorderOPDQueue(items: { id: string; order: number }[]): Promise<void> {
    const supabase = await getSupabase();
    try {
      logger.log('📋 Reordering queues:', items);

      // Update each queue item
      for (const item of items) {
        const { error } = await supabase
          .from('opd_queues')
          .update({ queue_number: item.order, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (error) {
          logger.error(`❌ Error updating queue ${item.id}:`, error);
          throw error;
        }
      }

      logger.log('✅ Queues reordered successfully');
    } catch (error) {
      logger.error('🚨 Failed to reorder queues:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD STATS ====================

  static async getDashboardStats(): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('📊 Getting dashboard statistics');

      // Get counts in parallel
      const [
        patientsCount,
        doctorsCount,
        todayQueuesCount,
        todayAppointmentsCount
      ] = await Promise.all([
        this.getPatientsCount(),
        this.getDoctorsCount(),
        this.getTodayQueuesCount(),
        this.getTodayAppointmentsCount()
      ]);

      const stats = {
        total_patients: patientsCount,
        total_doctors: doctorsCount,
        today_queues: todayQueuesCount,
        today_appointments: todayAppointmentsCount,
        revenue_today: 0, // Would need transactions table
        occupancy_rate: 0 // Would need beds table
      };

      logger.log('✅ Dashboard stats:', stats);
      return stats;
    } catch (error) {
      logger.error('🚨 Failed to get dashboard stats:', error);
      return {
        total_patients: 0,
        total_doctors: 0,
        today_queues: 0,
        today_appointments: 0,
        revenue_today: 0,
        occupancy_rate: 0
      };
    }
  }

  private static async getPatientsCount(): Promise<number> {
    const supabase = await getSupabase();
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    return error ? 0 : count || 0;
  }

  private static async getDoctorsCount(): Promise<number> {
    const supabase = await getSupabase();
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor');

    return error ? 0 : count || 0;
  }

  private static async getTodayQueuesCount(): Promise<number> {
    const supabase = await getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from('opd_queues')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    return error ? 0 : count || 0;
  }

  private static async getTodayAppointmentsCount(): Promise<number> {
    const supabase = await getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', today.toISOString())
      .lt('appointment_date', tomorrow.toISOString());

    return error ? 0 : count || 0;
  }

  // ==================== APPOINTMENTS ====================

  static async getAppointments(date?: string): Promise<any[]> {
    const supabase = await getSupabase();
    try {
      logger.log('📅 Fetching appointments from Supabase');

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone),
          doctor:users(id, first_name, last_name, email)
        `)
        .order('appointment_time', { ascending: true });

      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        query = query.gte('appointment_date', startDate.toISOString())
          .lte('appointment_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Error fetching appointments:', error);
        throw error;
      }

      logger.log(`✅ Found ${data?.length || 0} appointments`);
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch appointments:', error);
      return [];
    }
  }

  // ==================== PATIENTS LIST ====================
  static async getPatients(limit: number = 50, includeInactive: boolean = false, includeAllFields: boolean = false): Promise<Patient[]> {
    const supabase = await getSupabase();
    try {
      logger.log(`👥 Fetching patients from Supabase (limit: ${limit}, inactive: ${includeInactive})`);

      let query = supabase.from('patients').select('*');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('❌ Error fetching patients:', error);
        throw error;
      }

      logger.log(`✅ Found ${data?.length || 0} patients`);
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch patients:', error);
      return [];
    }
  }

  // ==================== TRANSACTIONS ====================
  static async createTransaction(transactionData: any): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('💰 Creating transaction:', transactionData);

      const { data, error } = await supabase
        .from('patient_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating transaction:', error);
        throw error;
      }

      logger.log('✅ Transaction created:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to create transaction:', error);
      throw error;
    }
  }

  static async updateTransaction(transactionId: string, updateData: any): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('🔄 Updating transaction:', transactionId, updateData);

      const { data, error } = await supabase
        .from('patient_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error updating transaction:', error);
        throw error;
      }

      logger.log('✅ Transaction updated:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to update transaction:', error);
      throw error;
    }
  }

  static async getAllTransactions(): Promise<any[]> {
    const supabase = await getSupabase();
    try {
      logger.log('💰 Fetching all transactions from Supabase');
      const { data, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch transactions:', error);
      return [];
    }
  }

  // ==================== EXPENSES ====================
  static async getAllExpenses(): Promise<any[]> {
    const supabase = await getSupabase();
    try {
      logger.log('💸 Fetching all expenses from Supabase');
      const { data, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch expenses:', error);
      return [];
    }
  }

  // ==================== SIMPLE FALLBACKS ====================

  static async createUserProfile(authUser: any): Promise<User> {
    const supabase = await getSupabase();
    logger.log('👤 Creating/updating user profile for:', authUser.email);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (existingUser) {
      logger.log('✅ User profile already exists:', existingUser);
      return existingUser as User;
    }

    // Create new user profile
    const userData = {
      auth_id: authUser.id,
      email: authUser.email,
      first_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
      last_name: authUser.user_metadata?.last_name || '',
      role: authUser.user_metadata?.role || 'user',
      phone: authUser.user_metadata?.phone || '',
      created_at: new Date().toISOString()
    };

    const { data: newUser, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      logger.error('❌ Error creating user profile:', error);
      // Return fallback user
      return {
        id: authUser.id,
        email: authUser.email || '',
        first_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
        last_name: authUser.user_metadata?.last_name || '',
        role: authUser.user_metadata?.role || 'user'
      };
    }

    logger.log('✅ User profile created:', newUser);
    return newUser as User;
  }
}

export default SupabaseHospitalService;