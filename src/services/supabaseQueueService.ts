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
  queue_number: number;
  queue_status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  estimated_wait_time?: number;
  consultation_start_time?: string;
  consultation_end_time?: string;
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
    first_name: string;
    last_name: string;
    email: string;
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
        .from('opd_queues')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:users(id, first_name, last_name, email, specialization)
        `)
        .order('queue_number', { ascending: true });

      // Apply filters
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

  // Add patient to queue
  static async addToQueue(data: {
    patient_id: string;
    doctor_id: string;
    priority?: 'normal' | 'urgent' | 'emergency';
    notes?: string;
  }): Promise<OPDQueueItem> {
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
      
      if (queueError) {
        logger.error('❌ Error getting last queue number:', queueError);
      }
      
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

  // Update queue status
  static async updateQueueStatus(
    queueId: string,
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled'
  ): Promise<OPDQueueItem> {
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
        
        // Calculate consultation duration if start time exists
        const { data: queue } = await supabase
          .from('opd_queues')
          .select('consultation_start_time')
          .eq('id', queueId)
          .single();
          
        if (queue?.consultation_start_time) {
          const startTime = new Date(queue.consultation_start_time);
          const endTime = new Date();
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          updateData.consultation_duration = durationMinutes;
        }
      }
      
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

  // Reorder queues
  static async reorderQueues(items: { id: string; queue_number: number }[]): Promise<void> {
    try {
      logger.log('📋 Reordering queues:', items);
      
      // Update each queue item
      for (const item of items) {
        const { error } = await supabase
          .from('opd_queues')
          .update({ queue_number: item.queue_number, updated_at: new Date().toISOString() })
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
      
      let query = supabase
        .from('opd_queues')
        .select('queue_status, estimated_wait_time, consultation_start_time, consultation_end_time');
      
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
        waiting: data?.filter(q => q.queue_status === 'waiting').length || 0,
        in_consultation: data?.filter(q => q.queue_status === 'in_consultation').length || 0,
        completed: data?.filter(q => q.queue_status === 'completed').length || 0,
        avg_wait_time: 0
      };
      
      // Calculate average wait time for completed consultations
      const completedQueues = data?.filter(q => 
        q.queue_status === 'completed' && 
        q.consultation_start_time && 
        q.consultation_end_time
      ) || [];
      
      if (completedQueues.length > 0) {
        const totalWaitTime = completedQueues.reduce((sum, queue) => {
          const start = new Date(queue.consultation_start_time!);
          const end = new Date(queue.consultation_end_time!);
          return sum + (end.getTime() - start.getTime());
        }, 0);
        
        stats.avg_wait_time = Math.round(totalWaitTime / (completedQueues.length * 1000 * 60)); // Convert to minutes
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
        .from('users')
        .select('id, first_name, last_name, email, specialization, role')
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
      
      const { data, error } = await supabase
        .from('opd_queues')
        .select(`
          *,
          patient:patients(id, first_name, last_name, age, gender, phone, uhid),
          doctor:users(id, first_name, last_name, email, specialization)
        `)
        .eq('patient_id', patientId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
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