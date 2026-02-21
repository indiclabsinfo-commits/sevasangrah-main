// Appointment Service - Direct Supabase database access
// Zero Backend Architecture - No API dependencies

import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

export interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  appointmentType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: AppointmentFilters;
}

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  department_id?: string;
  appointment_date: string;
  appointment_time?: string;
  appointment_type?: string;
  reason?: string;
  priority?: string;
  status?: string;
  notes?: string;
  hospital_id?: string;
  [key: string]: any;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  actual_start_time?: string;
  actual_end_time?: string;
  diagnosis?: string;
  prescription?: string;
  follow_up_date?: string;
  notes?: string;
}

export interface AppointmentWithRelations {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id?: string;
  appointment_date: string;
  appointment_time?: string;
  appointment_type?: string;
  reason?: string;
  priority?: string;
  status: string;
  notes?: string;
  reminder_sent?: boolean;
  created_from?: string;
  hospital_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  patient?: any;
  doctor?: any;
  [key: string]: any;
}

const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';

class AppointmentService {
  /**
   * Get all appointments with pagination and filters
   */
  async getAppointments(params: AppointmentListParams = {}): Promise<{
    data: AppointmentWithRelations[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const supabase = await getSupabase();
      const {
        page = 1,
        limit = 20,
        sortOrder = 'asc',
        filters = {},
      } = params;

      const offset = (page - 1) * limit;

      // Build query with doctor join to users table (FK confirmed)
      let query = supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(
            id,
            first_name,
            last_name,
            phone,
            email,
            gender,
            age
          ),
          doctor:users!future_appointments_doctor_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.appointmentType) {
        query = query.eq('appointment_type', filters.appointmentType);
      }

      if (filters.dateRange) {
        query = query
          .gte('appointment_date', filters.dateRange.start)
          .lte('appointment_date', filters.dateRange.end);
      }

      // Apply sorting and pagination
      query = query
        .order('appointment_date', { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('❌ Error fetching appointments:', error);
        throw new Error(error.message);
      }

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointmentById(id: string): Promise<AppointmentWithRelations | null> {
    try {
      const supabase = await getSupabase();

      const { data, error } = await supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(
            id,
            first_name,
            last_name,
            phone,
            email,
            gender,
            age
          ),
          doctor:users!future_appointments_doctor_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Appointment not found
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      logger.error('Error fetching appointment:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: CreateAppointmentData): Promise<any> {
    try {
      const supabase = await getSupabase();

      // Check for conflicts
      const hasConflict = await this.checkTimeConflict(
        appointmentData.doctor_id,
        appointmentData.appointment_date
      );

      if (hasConflict) {
        throw new Error('Doctor is not available at the requested time');
      }

      // Only include columns that exist in future_appointments table
      const insertData: any = {
        patient_id: appointmentData.patient_id,
        doctor_id: appointmentData.doctor_id,
        appointment_date: appointmentData.appointment_date,
        appointment_type: appointmentData.appointment_type || 'CONSULTATION',
        status: appointmentData.status || 'SCHEDULED',
        hospital_id: appointmentData.hospital_id || HOSPITAL_ID,
      };

      // Optional fields
      if (appointmentData.department_id) insertData.department_id = appointmentData.department_id;
      if (appointmentData.appointment_time) insertData.appointment_time = appointmentData.appointment_time;
      if (appointmentData.reason) insertData.reason = appointmentData.reason;
      if (appointmentData.priority) insertData.priority = appointmentData.priority;
      if (appointmentData.notes) insertData.notes = appointmentData.notes;
      if (appointmentData.created_from) insertData.created_from = appointmentData.created_from;
      if (appointmentData.consultation_mode) insertData.consultation_mode = appointmentData.consultation_mode;
      if (appointmentData.join_url) insertData.join_url = appointmentData.join_url;

      const { data, error } = await supabase
        .from('future_appointments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating appointment:', error);
        throw new Error(error.message);
      }

      logger.log('✅ Appointment created:', data.id);
      return data;
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment with a new patient
   */
  async createAppointmentWithNewPatient(
    appointmentData: Omit<CreateAppointmentData, 'patient_id'>,
    patientData: any
  ): Promise<{ appointment: any; patient: any }> {
    try {
      const supabase = await getSupabase();

      // First create the new patient
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (patientError) {
        throw new Error('Failed to create patient: ' + patientError.message);
      }

      // Then create the appointment with the new patient ID
      const appointment = await this.createAppointment({
        ...appointmentData,
        patient_id: newPatient.id,
      });

      return { appointment, patient: newPatient };
    } catch (error) {
      logger.error('Error creating appointment with new patient:', error);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(id: string, updates: UpdateAppointmentData): Promise<any> {
    try {
      const supabase = await getSupabase();

      const { data, error } = await supabase
        .from('future_appointments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<void> {
    try {
      const supabase = await getSupabase();

      const updateData: any = {
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        const { data: appointment } = await supabase
          .from('future_appointments')
          .select('notes')
          .eq('id', id)
          .single();

        const currentNotes = appointment?.notes || '';
        updateData.notes = currentNotes
          ? `${currentNotes}\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`;
      }

      const { error } = await supabase
        .from('future_appointments')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(): Promise<AppointmentWithRelations[]> {
    try {
      const supabase = await getSupabase();
      const todayStr = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(
            id,
            first_name,
            last_name,
            phone
          ),
          doctor:users!future_appointments_doctor_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('appointment_date', todayStr)
        .order('appointment_time', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a doctor
   */
  async getDoctorUpcomingAppointments(doctorId: string, limit: number = 10): Promise<AppointmentWithRelations[]> {
    try {
      const supabase = await getSupabase();

      const { data, error } = await supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(
            id,
            first_name,
            last_name,
            phone
          ),
          doctor:users!future_appointments_doctor_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('doctor_id', doctorId)
        .in('status', ['SCHEDULED', 'CONFIRMED'])
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching doctor upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(): Promise<{
    total: number;
    today: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    statusDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    completionRate: number;
  }> {
    try {
      const supabase = await getSupabase();
      const todayStr = new Date().toISOString().split('T')[0];

      const [
        { count: total },
        { count: todayCount },
        { count: scheduled },
        { count: completed },
        { count: cancelled },
      ] = await Promise.all([
        supabase.from('future_appointments').select('id', { count: 'exact', head: true }),
        supabase.from('future_appointments').select('id', { count: 'exact', head: true })
          .eq('appointment_date', todayStr),
        supabase.from('future_appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'SCHEDULED'),
        supabase.from('future_appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'COMPLETED'),
        supabase.from('future_appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'CANCELLED'),
      ]);

      // Get all appointments for detailed stats
      const { data: appointments } = await supabase
        .from('future_appointments')
        .select('status, appointment_type');

      // Calculate distributions
      const statusDistribution: Record<string, number> = {};
      const typeDistribution: Record<string, number> = {};

      appointments?.forEach((appointment: any) => {
        if (appointment.status) {
          statusDistribution[appointment.status] = (statusDistribution[appointment.status] || 0) + 1;
        }
        if (appointment.appointment_type) {
          typeDistribution[appointment.appointment_type] = (typeDistribution[appointment.appointment_type] || 0) + 1;
        }
      });

      const completionRate = total ? ((completed || 0) / (total || 1)) * 100 : 0;

      return {
        total: total || 0,
        today: todayCount || 0,
        scheduled: scheduled || 0,
        completed: completed || 0,
        cancelled: cancelled || 0,
        statusDistribution,
        typeDistribution,
        completionRate,
      };
    } catch (error) {
      logger.error('Error fetching appointment stats:', error);
      throw error;
    }
  }

  /**
   * Check for time conflicts
   */
  private async checkTimeConflict(
    doctorId: string,
    appointmentDate: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const supabase = await getSupabase();
      const appointmentDateOnly = appointmentDate.split('T')[0];

      let query = supabase
        .from('future_appointments')
        .select('id, appointment_time')
        .eq('doctor_id', doctorId)
        .in('status', ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'])
        .eq('appointment_date', appointmentDateOnly);

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // For now, no conflict detection (would need time slot logic)
      return false;
    } catch (error) {
      logger.error('Error checking time conflict:', error);
      return false;
    }
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    try {
      const supabase = await getSupabase();

      const { error } = await supabase
        .from('future_appointments')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      logger.error('Error deleting appointment:', error);
      throw error;
    }
  }

  /**
   * Subscribe to appointment changes
   */
  async subscribeToAppointments(callback: (payload: any) => void) {
    const supabase = await getSupabase();
    return supabase
      .channel('future_appointments_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'future_appointments'
        },
        callback
      )
      .subscribe();
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
