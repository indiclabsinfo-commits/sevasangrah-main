import { useState, useEffect, useCallback, useRef } from 'react';
import { opdService } from '../../../services/opdService';
import { SupabaseHospitalService } from '../../../services/supabaseHospitalService';
import { getSupabase } from '../../../lib/supabaseClient';

export interface QueueEntry {
  id: string;
  queue_no: number;
  queue_status: 'WAITING' | 'VITALS_DONE' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  priority: boolean;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    phone: string;
    uhid?: string;
    blood_group?: string;
    patient_id?: string;
  };
  doctor_id: string;
  doctor?: any;
  queue_date: string;
  wait_time?: number;
  consultation_start_time?: string;
  consultation_end_time?: string;
  created_at: string;
  notes?: string;
}

export function useDoctorQueue(doctorId: string | null) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!doctorId) return;
    try {
      const data = await opdService.getTodayQueueForDoctor(doctorId);
      setQueue(data as QueueEntry[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Initial load + polling every 15 seconds
  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    refresh();
    pollRef.current = setInterval(refresh, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh, doctorId]);

  // Supabase realtime subscription
  useEffect(() => {
    if (!doctorId) return;
    let channel: any;
    getSupabase().then(supabase => {
      channel = supabase
        .channel('doctor-queue-' + doctorId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'opd_queue',
          filter: `doctor_id=eq.${doctorId}`
        }, () => refresh())
        .subscribe();
    });
    return () => {
      channel?.unsubscribe();
    };
  }, [doctorId, refresh]);

  const setPatientInConsultation = useCallback(async (queueId: string) => {
    await SupabaseHospitalService.updateOPDQueueStatus(queueId, 'IN_CONSULTATION');
    await refresh();
  }, [refresh]);

  const completeQueueEntry = useCallback(async (queueId: string) => {
    await SupabaseHospitalService.updateOPDQueueStatus(queueId, 'COMPLETED');
    await refresh();
  }, [refresh]);

  // Computed stats
  const stats = {
    total: queue.length,
    waiting: queue.filter(q => q.queue_status === 'WAITING').length,
    vitalsDone: queue.filter(q => q.queue_status === 'VITALS_DONE').length,
    inConsultation: queue.filter(q => q.queue_status === 'IN_CONSULTATION').length,
    completed: queue.filter(q => q.queue_status === 'COMPLETED').length,
  };

  return { queue, loading, error, refresh, setPatientInConsultation, completeQueueEntry, stats };
}
