// Supabase Queue Service - Direct database access
// Replaces broken API endpoints for OPD queues

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface OPDQueueItem {
  id: string;
  patient_id: string;
  doctor_id: string;
  queue_no: number;
  queue_status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'VITALS_DONE';
  priority: boolean;
  token_number?: string;
  queue_date?: string;
  consultation_start_time?: string;
  consultation_end_time?: string;
  consultation_duration?: number;
  wait_time?: number;
  total_tat?: number;
  tat_status?: string;
  tat_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    phone: string;
    uhid?: string;
  };

  doctor?: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    department?: string;
    specialization?: string;
  };
}

export class SupabaseQueueService {
  // Get OPD queues with filters
  static async getOPDQueues(
    status?: string,
    doctor_id?: string,
    date?: string
  ): Promise<OPDQueueItem[]> {
    try {
      logger.log('🔍 Fetching OPD queues from Supabase', { status, doctor_id, date });
      
      let query = supabase
        .from('opd_queue')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:doctors(id, name, first_name, last_name, department, specialization)
        `)
        .order('queue_no', { ascending: true });

      // Apply filters - use UPPERCASE to match DB defaults
      if (status && status !== 'all') {
        query = query.eq('queue_status', status.toUpperCase());
      }

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      if (date) {
        query = query.eq('queue_date', date);
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

  // Add patient to queue
  static async addToQueue(data: {
    patient_id: string;
    doctor_id: string;
    priority?: boolean;
    notes?: string;
  }): Promise<OPDQueueItem> {
    try {
      logger.log('➕ Adding patient to OPD queue:', data);

      // Get today's date string for queue_date filter
      const todayStr = new Date().toISOString().split('T')[0];

      const { data: lastQueue, error: queueError } = await supabase
        .from('opd_queue')
        .select('queue_no')
        .eq('doctor_id', data.doctor_id)
        .eq('queue_date', todayStr)
        .order('queue_no', { ascending: false })
        .limit(1);

      if (queueError) {
        logger.error('❌ Error getting last queue number:', queueError);
      }

      const nextQueueNumber = (lastQueue?.[0]?.queue_no || 0) + 1;

      // Create queue entry - priority is BOOLEAN, status is UPPERCASE
      const queueData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        queue_no: nextQueueNumber,
        queue_status: 'WAITING',
        priority: data.priority || false,
        notes: data.notes,
        queue_date: todayStr,
        token_number: String(nextQueueNumber)
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

  // Update queue status
  static async updateQueueStatus(
    queueId: string,
    status: string
  ): Promise<OPDQueueItem> {
    try {
      // Normalize status to UPPERCASE
      const normalizedStatus = status.toUpperCase();
      logger.log('🔄 Updating queue status:', { queueId, status: normalizedStatus });

      const updateData: any = {
        queue_status: normalizedStatus,
        updated_at: new Date().toISOString()
      };

      // Set consultation timestamps
      if (normalizedStatus === 'IN_CONSULTATION') {
        updateData.consultation_start_time = new Date().toISOString();
        // Calculate wait_time from created_at
        const { data: queue } = await supabase
          .from('opd_queue')
          .select('created_at')
          .eq('id', queueId)
          .single();
        if (queue?.created_at) {
          const waitMinutes = Math.round((Date.now() - new Date(queue.created_at).getTime()) / (1000 * 60));
          updateData.wait_time = waitMinutes;
        }
      } else if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED') {
        updateData.consultation_end_time = new Date().toISOString();

        // Calculate consultation duration and total TAT
        const { data: queue } = await supabase
          .from('opd_queue')
          .select('consultation_start_time, created_at')
          .eq('id', queueId)
          .single();

        if (queue?.consultation_start_time) {
          const startTime = new Date(queue.consultation_start_time);
          const endTime = new Date();
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          updateData.consultation_duration = durationMinutes;
        }
        if (queue?.created_at) {
          const totalMinutes = Math.round((Date.now() - new Date(queue.created_at).getTime()) / (1000 * 60));
          updateData.total_tat = totalMinutes;
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

  // Reorder queues
  static async reorderQueues(items: { id: string; queue_no: number }[]): Promise<void> {
    try {
      logger.log('📋 Reordering queues:', items);
      
      // Update each queue item
      for (const item of items) {
        const { error } = await supabase
          .from('opd_queue')
          .update({ queue_no: item.queue_no, updated_at: new Date().toISOString() })
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

  // Get queue statistics
  static async getQueueStats(doctor_id?: string): Promise<{
    total: number;
    waiting: number;
    in_consultation: number;
    completed: number;
    avg_wait_time: number;
  }> {
    try {
      logger.log('📊 Getting queue statistics');
      
      const todayStr = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('opd_queue')
        .select('queue_status, wait_time, consultation_start_time, consultation_end_time, consultation_duration, total_tat')
        .eq('queue_date', todayStr);

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Error getting queue stats:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        waiting: data?.filter(q => q.queue_status === 'WAITING').length || 0,
        in_consultation: data?.filter(q => q.queue_status === 'IN_CONSULTATION').length || 0,
        completed: data?.filter(q => q.queue_status === 'COMPLETED').length || 0,
        avg_wait_time: 0
      };
      
      // Calculate average wait time from wait_time column
      const queuesWithWait = data?.filter(q => q.wait_time != null) || [];
      if (queuesWithWait.length > 0) {
        const totalWaitTime = queuesWithWait.reduce((sum, q) => sum + (q.wait_time || 0), 0);
        stats.avg_wait_time = Math.round(totalWaitTime / queuesWithWait.length);
      }
      
      logger.log('✅ Queue statistics:', stats);
      return stats;
    } catch (error) {
      logger.error('🚨 Failed to get queue stats:', error);
      return {
        total: 0,
        waiting: 0,
        in_consultation: 0,
        completed: 0,
        avg_wait_time: 0
      };
    }
  }

  // Get doctors list
  static async getDoctors(): Promise<any[]> {
    try {
      logger.log('👨‍⚕️ Fetching doctors from Supabase');

      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, first_name, last_name, department, specialization, fee, consultation_fee')
        .eq('is_active', true)
        .order('name');

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

  // Get patient by ID
  static async getPatient(patientId: string): Promise<any> {
    try {
      logger.log('👤 Fetching patient:', patientId);
      
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
      throw error;
    }
  }

  // Get today's queues for a patient
  static async getPatientQueues(patientId: string): Promise<OPDQueueItem[]> {
    try {
      logger.log('📅 Getting patient queues:', patientId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('opd_queue')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:doctors(id, name, first_name, last_name, department, specialization)
        `)
        .eq('patient_id', patientId)
        .eq('queue_date', todayStr)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('❌ Error fetching patient queues:', error);
        throw error;
      }
      
      logger.log(`✅ Found ${data?.length || 0} queues for patient`);
      return data || [];
    } catch (error) {
      logger.error('🚨 Failed to fetch patient queues:', error);
      return [];
    }
  }
}

export default SupabaseQueueService;