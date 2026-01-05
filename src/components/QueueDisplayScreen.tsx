import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';

interface QueuePatient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  queue_no: number;
  queue_status: 'waiting' | 'called' | 'completed';
  age?: number;
  gender?: string;
}

const QueueDisplayScreen: React.FC = () => {
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's queue
  const fetchQueue = async () => {
    try {
      const data = await HospitalService.getOPDQueues();

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
        gender: item.gender
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

      await HospitalService.updateQueueStatus(patientId, apiStatus);

      // Refresh the queue
      await fetchQueue();
      toast.success(`Patient status updated to ${status}`);
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

  // Fetch queue on mount and refresh every 10 seconds
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
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
            <div style={{ fontSize: '32px', fontWeight: '600', color: '#333333', marginBottom: '8px' }}>
              {currentPatient.first_name} {currentPatient.last_name}
            </div>
            <div style={{ fontSize: '20px', color: '#666666' }}>
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
