import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseHospitalService } from '../services/supabaseHospitalService';
import type { User as Doctor } from '../config/supabaseNew';
import { announcePatient } from '../utils/voiceAnnouncement';

interface QueuePatient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  queue_no: number;
  queue_status: 'waiting' | 'called' | 'completed';
  age?: number;
  gender?: string;
  doctor_id?: string;
  assigned_doctor: string;
  doctor?: Doctor;
}

const QueueDisplayScreen: React.FC = () => {
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Doctor Filter State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const docs = await SupabaseHospitalService.getDoctors();
        setDoctors(docs);
      } catch (err) {
        console.error('Failed to load doctors', err);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch queue with polling
  const fetchQueue = async () => {
    try {
      // Pass selectedDoctor to filter if set. Pass undefined for status to fetch all active statuses (or backend default)
      const data = await SupabaseHospitalService.getOPDQueues(undefined, selectedDoctor || undefined);

      // Transform data to match component interface
      const transformedData: QueuePatient[] = data.map((item: any) => ({
        id: item.id,
        patient_id: item.patient_code || item.patient_id, // Use code if available
        first_name: item.first_name,
        last_name: item.last_name,
        queue_no: item.token_number,
        // Map status: IN_CONSULTATION -> called, WAITING/VITALS_DONE -> waiting
        queue_status: item.status === 'IN_CONSULTATION' ? 'called' :
          item.status === 'COMPLETED' ? 'completed' : 'waiting',
        age: item.age,
        gender: item.gender,
        doctor_id: item.doctor_id,
        assigned_doctor: item.doctor?.name || (item.assigned_doctor ? item.assigned_doctor : 'Unassigned'),
        doctor: item.doctor
      }));

      setQueuePatients(transformedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching queue:', err);
      setError(err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  // Update queue status
  const updateQueueStatus = async (patientId: string, status: 'waiting' | 'called' | 'completed') => {
    try {
      // Map UI status back to API status
      let apiStatus = 'WAITING';
      if (status === 'called') apiStatus = 'IN_CONSULTATION';
      if (status === 'completed') apiStatus = 'COMPLETED';

      await SupabaseHospitalService.updateOPDQueueStatus(patientId, apiStatus);

      // Find patient name for announcement
      const patient = queuePatients.find(p => p.id === patientId);

      // Refresh the queue
      await fetchQueue();
      toast.success(`Patient status updated to ${status}`);

      // Announce if status is 'called'
      if (status === 'called' && patient) {
        announcePatient({
          patientName: `${patient.first_name} ${patient.last_name}`,
          tokenNumber: String(patient.queue_no),
          doctorName: patient.doctor ? `Dr. ${patient.doctor.first_name} ${patient.doctor.last_name}` : undefined
        });
      }
    } catch (err) {
      console.error('Error updating queue status:', err);
      toast.error('Failed to update queue status');
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Poll for updates every 3 seconds (Simulated Real-time)
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [selectedDoctor]); // Re-fetch when filter changes

  // Get statistics
  const stats = {
    total: queuePatients.length,
    waiting: queuePatients.filter(p => p.queue_status === 'waiting').length,
    called: queuePatients.filter(p => p.queue_status === 'called').length,
    completed: queuePatients.filter(p => p.queue_status === 'completed').length,
  };

  // Get current patient (first one with status 'called' or 'waiting')
  const currentPatient = queuePatients.find(p => p.queue_status === 'called') ||
    queuePatients.find(p => p.queue_status === 'waiting');

  if (loading && queuePatients.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F7FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '24px', color: '#666666' }}>Loading queue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F7FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <AlertCircle style={{ width: '64px', height: '64px', color: '#EF4444' }} />
        <div style={{ fontSize: '24px', color: '#EF4444' }}>Error: {error}</div>
        <button
          onClick={fetchQueue}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0056B3',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FA', padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px 32px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#333333', margin: 0 }}>
              Patient Queue
            </h1>
            <p style={{ fontSize: '18px', color: '#666666', margin: '8px 0 0 0' }}>
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Doctor Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0F7FF', padding: '8px 16px', borderRadius: '8px' }}>
              <Filter style={{ width: '20px', height: '20px', color: '#0056B3' }} />
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                style={{
                  fontSize: '16px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #0056B3',
                  color: '#0056B3',
                  fontWeight: '600',
                  minWidth: '200px',
                  backgroundColor: 'transparent'
                }}
              >
                <option value="">All Doctors</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>Dr. {doc.first_name} {doc.last_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock style={{ width: '32px', height: '32px', color: '#0056B3' }} />
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#0056B3' }}>
                {currentTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F0F7FF', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#0056B3' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: '#666666', marginTop: '4px' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#FFF8E1', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F59E0B' }}>{stats.waiting}</div>
            <div style={{ fontSize: '14px', color: '#666666', marginTop: '4px' }}>Waiting</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3' }}>{stats.called}</div>
            <div style={{ fontSize: '14px', color: '#666666', marginTop: '4px' }}>Called</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#E8F5E9', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4CAF50' }}>{stats.completed}</div>
            <div style={{ fontSize: '14px', color: '#666666', marginTop: '4px' }}>Completed</div>
          </div>
        </div>
      </div>

      {/* Current Patient Display */}
      {currentPatient && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '48px',
            marginBottom: '24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            border: '3px solid #0056B3',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '18px',
                color: '#666666',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: '600',
              }}
            >
              Now Calling
            </p>
            <div
              style={{
                fontSize: '120px',
                fontWeight: '900',
                color: '#0056B3',
                lineHeight: '1',
                marginBottom: '24px',
              }}
            >
              {currentPatient.queue_no}
            </div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              {currentPatient.first_name} {currentPatient.last_name}
            </div>
            <div style={{ fontSize: '24px', color: '#666666', marginTop: '16px' }}>
              Patient ID: {currentPatient.patient_id}
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#333333', marginBottom: '16px' }}>
          Queue List
        </h2>

        {queuePatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#666666' }}>
            <User style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '18px' }}>No patients in queue today</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {queuePatients.map((patient) => (
              <div
                key={patient.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor:
                    patient.queue_status === 'completed' ? '#F5F5F5' :
                      patient.queue_status === 'called' ? '#E3F2FD' :
                        '#FFFFFF',
                  borderRadius: '8px',
                  border: `2px solid ${patient.queue_status === 'completed' ? '#E0E0E0' :
                    patient.queue_status === 'called' ? '#2196F3' :
                      '#EEEEEE'
                    }`,
                  opacity: patient.queue_status === 'completed' ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      backgroundColor: '#0056B3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '28px',
                      fontWeight: '700',
                    }}
                  >
                    {patient.queue_no}
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#333333' }}>
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666666', marginTop: '4px' }}>
                      ID: {patient.patient_id}
                      {patient.age && ` • ${patient.age}y`}
                      {patient.gender && ` • ${patient.gender}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Status Badge */}
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor:
                        patient.queue_status === 'completed' ? '#E8F5E9' :
                          patient.queue_status === 'called' ? '#E3F2FD' :
                            '#FFF8E1',
                      color:
                        patient.queue_status === 'completed' ? '#4CAF50' :
                          patient.queue_status === 'called' ? '#2196F3' :
                            '#F59E0B',
                      textTransform: 'capitalize',
                    }}
                  >
                    {patient.queue_status}
                  </div>

                  {/* Action Buttons */}
                  {patient.queue_status !== 'completed' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {patient.queue_status === 'waiting' && (
                        <button
                          onClick={() => updateQueueStatus(patient.id, 'called')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#2196F3',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Call
                        </button>
                      )}
                      {patient.queue_status === 'called' && (
                        <button
                          onClick={() => updateQueueStatus(patient.id, 'completed')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  )}

                  {patient.queue_status === 'completed' && (
                    <CheckCircle style={{ width: '24px', height: '24px', color: '#4CAF50' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueDisplayScreen;
