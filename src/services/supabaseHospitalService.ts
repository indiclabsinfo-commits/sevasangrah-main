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

      // Try doctors table first
      let { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .order('first_name');

      // Fallback to users table if doctors table doesn't exist or is empty
      if (error || !data || data.length === 0) {
        logger.log('⚠️ Doctors table query failed or empty, trying users table...');
        const result = await supabase
          .from('users')
          .select('*')
          .eq('role', 'doctor')
          .order('first_name');

        data = result.data;
        error = result.error;
      }

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

  /**
   * Resolve a logged-in user (from users table) to their doctors table record
   */
  static async getDoctorRecordForUser(userId: string): Promise<any | null> {
    const supabase = await getSupabase();
    try {
      logger.log('🔍 Resolving doctor record for user:', userId);

      // Get user profile first
      const { data: userRow } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (!userRow) {
        // Try auth_id match
        const { data: authRow } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('auth_id', userId)
          .single();
        if (!authRow) {
          logger.warn('⚠️ No user profile found for:', userId);
          return null;
        }
        Object.assign(userRow || {}, authRow);
      }

      const user = userRow!;

      // Try to find matching doctor by name
      const { data: doctors } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true);

      if (doctors && doctors.length > 0) {
        // Match by name (first_name or full name)
        const match = doctors.find((d: any) => {
          const doctorName = (d.name || '').toLowerCase();
          const doctorFirst = (d.first_name || '').toLowerCase();
          const userFirst = (user.first_name || '').toLowerCase();
          const userLast = (user.last_name || '').toLowerCase();
          const userFull = `${userFirst} ${userLast}`.trim();
          return doctorFirst === userFirst ||
                 doctorName === userFull ||
                 doctorName.includes(userFirst);
        });

        if (match) {
          logger.log('✅ Doctor record matched:', match.id, match.name || match.first_name);
          return { ...match, user_id: user.id };
        }

        // If no name match, return the first doctor as fallback for demo
        logger.warn('⚠️ No name match found, returning first doctor as fallback');
        return { ...doctors[0], user_id: user.id };
      }

      logger.warn('⚠️ No doctors found in doctors table');
      return null;
    } catch (error) {
      logger.error('🚨 Failed to resolve doctor record:', error);
      return null;
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

      const todayStr = date || new Date().toISOString().split('T')[0];
      let query = supabase
        .from('opd_queue')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:doctors(id, name, first_name, last_name, department, specialization)
        `)
        .eq('queue_date', todayStr)
        .order('queue_no', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('queue_status', status.toUpperCase());
      }

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
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
    consultation_mode?: string;
    join_url?: string;
  }): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('➕ Adding patient to OPD queue:', data);

      // Get next queue number for this doctor today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = new Date().toISOString().split('T')[0];
      const { data: lastQueue, error: queueError } = await supabase
        .from('opd_queue')
        .select('queue_no')
        .eq('doctor_id', data.doctor_id)
        .eq('queue_date', todayStr)
        .order('queue_no', { ascending: false })
        .limit(1);

      const nextQueueNumber = (lastQueue?.[0]?.queue_no || 0) + 1;

      // Create queue entry - priority is BOOLEAN, status is UPPERCASE
      const queueData: any = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        queue_no: nextQueueNumber,
        queue_status: 'WAITING',
        priority: data.priority === 'urgent' || data.priority === 'emergency' || data.priority === true ? true : false,
        notes: data.notes,
        queue_date: todayStr,
        token_number: String(nextQueueNumber),
        consultation_mode: data.consultation_mode || 'physical',
        join_url: data.join_url || null,
      };

      const { data: newQueue, error } = await supabase
        .from('opd_queue')
        .insert(queueData)
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:doctors(id, name, first_name, last_name, department, specialization)
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

      // Normalize to UPPERCASE
      const normalizedStatus = status.toUpperCase();
      const updateData: any = {
        queue_status: normalizedStatus,
        updated_at: new Date().toISOString()
      };

      const supabase = await getSupabase();

      // Set consultation timestamps
      if (normalizedStatus === 'IN_CONSULTATION') {
        updateData.consultation_start_time = new Date().toISOString();
        // Calculate wait_time
        const { data: queue } = await supabase
          .from('opd_queue').select('created_at').eq('id', queueId).single();
        if (queue?.created_at) {
          updateData.wait_time = Math.round((Date.now() - new Date(queue.created_at).getTime()) / (1000 * 60));
        }
      } else if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED') {
        updateData.consultation_end_time = new Date().toISOString();
        const { data: queue } = await supabase
          .from('opd_queue').select('consultation_start_time, created_at').eq('id', queueId).single();
        if (queue?.consultation_start_time) {
          updateData.consultation_duration = Math.round((Date.now() - new Date(queue.consultation_start_time).getTime()) / (1000 * 60));
        }
        if (queue?.created_at) {
          updateData.total_tat = Math.round((Date.now() - new Date(queue.created_at).getTime()) / (1000 * 60));
        }
      }

      const { data, error } = await supabase
        .from('opd_queue')
        .update(updateData)
        .eq('id', queueId)
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:doctors(id, name, first_name, last_name, department, specialization)
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
          .from('opd_queue')
          .update({ queue_no: item.order, updated_at: new Date().toISOString() })
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
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return error ? 0 : count || 0;
  }

  private static async getTodayQueuesCount(): Promise<number> {
    const supabase = await getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from('opd_queue')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    return error ? 0 : count || 0;
  }

  private static async getTodayAppointmentsCount(): Promise<number> {
    const supabase = await getSupabase();
    const todayStr = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('future_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', todayStr);

    return error ? 0 : count || 0;
  }

  // ==================== APPOINTMENTS ====================

  static async getAppointments(date?: string): Promise<any[]> {
    const supabase = await getSupabase();
    try {
      logger.log('📅 Fetching appointments from Supabase');

      let query = supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone),
          doctor:users!future_appointments_doctor_id_fkey(id, first_name, last_name, email)
        `)
        .order('appointment_date', { ascending: true });

      if (date) {
        query = query.eq('appointment_date', date);
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

  static async createAppointment(data: any): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('📅 Creating appointment in Supabase');

      // Only include columns that exist in future_appointments table
      const appointmentData: any = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        appointment_type: data.appointment_type || 'CONSULTATION',
        status: data.status || 'SCHEDULED',
        hospital_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Optional fields that exist in the table
      if (data.appointment_time) appointmentData.appointment_time = data.appointment_time;
      if (data.department_id) appointmentData.department_id = data.department_id;
      if (data.reason) appointmentData.reason = data.reason;
      if (data.priority) appointmentData.priority = data.priority;
      if (data.notes) appointmentData.notes = data.notes;
      if (data.created_from) appointmentData.created_from = data.created_from;

      const { data: newAppointment, error } = await supabase
        .from('future_appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating appointment:', error);
        throw error;
      }

      logger.log('✅ Appointment created:', newAppointment.id);
      return newAppointment;
    } catch (error) {
      logger.error('🚨 Failed to create appointment:', error);
      throw error;
    }
  }

  static async updateAppointment(id: string, updates: any): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('🔄 Updating appointment:', id);

      // Remove fields that don't exist in the table
      const { duration_minutes, estimated_cost, ...validUpdates } = updates;

      const { data, error } = await supabase
        .from('future_appointments')
        .update({
          ...validUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error updating appointment:', error);
        throw error;
      }

      logger.log('✅ Appointment updated');
      return data;
    } catch (error) {
      logger.error('🚨 Failed to update appointment:', error);
      throw error;
    }
  }

  static async cancelAppointment(id: string): Promise<any> {
    return this.updateAppointment(id, { status: 'CANCELLED' });
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
    try {
      logger.log('💰 Creating transaction via REST API:', transactionData);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

      // Clean data to match DB constraints
      const cleanData = { ...transactionData };

      // Remove patient_uuid if it's not a valid UUID (the column has FK to patients.id)
      if (cleanData.patient_uuid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanData.patient_uuid)) {
        delete cleanData.patient_uuid;
      }

      // discount_type has a CHECK constraint - must be null when discount_value is 0
      if (!cleanData.discount_value || cleanData.discount_value <= 0) {
        cleanData.discount_type = null;
        cleanData.discount_value = 0;
        cleanData.discount_reason = null;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/patient_transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(cleanData)
      });

      const responseText = await response.text();
      logger.log('📥 Transaction response:', response.status, responseText.substring(0, 200));

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg = errorJson.message || errorJson.details || errorJson.hint || responseText;
        } catch { errorMsg = responseText; }
        logger.error('❌ Transaction insert failed:', errorMsg);
        throw new Error(`Transaction insert failed (${response.status}): ${errorMsg}`);
      }

      const insertedData = JSON.parse(responseText);
      const data = Array.isArray(insertedData) ? insertedData[0] : insertedData;
      logger.log('✅ Transaction created:', data?.id);
      return data || transactionData;
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
          patient:patients!patient_transactions_patient_id_fkey(id, first_name, last_name, patient_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch transactions:', error);
      return [];
    }
  }

  // ==================== VITALS ====================
  static async recordVitals(vitalsData: any): Promise<any> {
    const supabase = await getSupabase();
    try {
      logger.log('📋 Recording vitals:', vitalsData);

      const { data, error } = await supabase
        .from('patient_vitals')
        .insert(vitalsData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error recording vitals:', error);
        throw error;
      }

      // Update queue status to VITALS_DONE if queueId provided
      if (vitalsData.queue_id) {
        await supabase
          .from('opd_queue')
          .update({ queue_status: 'VITALS_DONE', updated_at: new Date().toISOString() })
          .eq('id', vitalsData.queue_id);
      }

      logger.log('✅ Vitals recorded:', data);
      return data;
    } catch (error) {
      logger.error('🚨 Failed to record vitals:', error);
      throw error;
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
        .order('date', { ascending: false });

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

  // ==================== PATIENT DATA ====================

  static async getPatientById(patientId: string): Promise<any | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

      // Try by UUID first, then by patient_id string
      const res = await fetch(
        `${supabaseUrl}/rest/v1/patients?or=(id.eq.${patientId},patient_id.eq.${patientId})&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );
      if (!res.ok) {
        logger.error('getPatientById fetch failed:', res.status);
        return null;
      }
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (e) {
      logger.error('getPatientById error:', e);
      return null;
    }
  }

  static async getTransactionsByPatient(patientId: string): Promise<any[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

      // Query by both patient_id (record link) and patient_uuid if possible. 
      // If patient_uuid doesn't exist yet, we fallback to just patient_id to avoid 400 errors.
      const res = await fetch(
        `${supabaseUrl}/rest/v1/patient_transactions?patient_id=eq.${patientId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );
      if (!res.ok) {
        logger.error('getTransactionsByPatient fetch failed:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      logger.error('getTransactionsByPatient error:', e);
      return [];
    }
  }
}

export default SupabaseHospitalService;