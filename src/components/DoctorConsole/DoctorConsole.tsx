import React, { useState, useEffect } from 'react';
import { Stethoscope, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseHospitalService } from '../../services/supabaseHospitalService';
import { useDoctorQueue } from './hooks/useDoctorQueue';
import DoctorQueuePanel from './DoctorQueuePanel';
import ConsultationWorkspace from './ConsultationWorkspace';
import PatientHistoryDrawer from './PatientHistoryDrawer';
import type { QueueEntry } from './hooks/useDoctorQueue';

const DoctorConsole: React.FC = () => {
  const { user } = useAuth();
  const [doctorRecord, setDoctorRecord] = useState<any | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Resolve logged-in user to doctor record
  useEffect(() => {
    const loadDoctor = async () => {
      if (!user?.id) {
        setDoctorLoading(false);
        return;
      }
      try {
        const doc = await SupabaseHospitalService.getDoctorRecordForUser(user.id);
        setDoctorRecord(doc);
      } catch (error: any) {
        console.error('Failed to load doctor record:', error);
      } finally {
        setDoctorLoading(false);
      }
    };
    loadDoctor();
  }, [user?.id]);

  const { queue, loading, refresh, setPatientInConsultation, completeQueueEntry, stats } =
    useDoctorQueue(doctorRecord?.id ?? null);

  const handleSelectPatient = async (entry: QueueEntry) => {
    // If clicking the same patient, do nothing
    if (selectedEntry?.id === entry.id) return;

    setSelectedEntry(entry);
    setShowHistory(false);

    // Auto-transition to IN_CONSULTATION if not already
    if (entry.queue_status !== 'IN_CONSULTATION' && entry.queue_status !== 'COMPLETED') {
      try {
        await setPatientInConsultation(entry.id);
      } catch (error: any) {
        toast.error(`Failed to start consultation: ${error.message}`);
      }
    }
  };

  const handleComplete = async () => {
    if (selectedEntry) {
      try {
        await completeQueueEntry(selectedEntry.id);
      } catch (error: any) {
        toast.error(`Failed to complete queue entry: ${error.message}`);
      }
    }
    setSelectedEntry(null);
    setShowHistory(false);
  };

  const doctorName = doctorRecord?.name ||
    (doctorRecord?.first_name ? `${doctorRecord.first_name} ${doctorRecord.last_name || ''}`.trim() : 'Doctor');

  // Loading state
  if (doctorLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading Doctor Console...</p>
        </div>
      </div>
    );
  }

  // No doctor record found
  if (!doctorRecord) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-3 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Doctor Profile Not Linked</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your user account could not be matched to a doctor profile. Please contact the administrator to link your account.
          </p>
          <p className="text-xs text-gray-400">Logged in as: {user?.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-gray-100">
      {/* Left: Queue Panel */}
      <DoctorQueuePanel
        queue={queue}
        loading={loading}
        selectedEntryId={selectedEntry?.id || null}
        onSelectPatient={handleSelectPatient}
        onRefresh={refresh}
        stats={stats}
      />

      {/* Right: Consultation Workspace or Empty State */}
      <div className="flex-1 flex overflow-hidden relative">
        {selectedEntry ? (
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 overflow-hidden transition-all ${showHistory ? 'mr-0' : ''}`}>
              <ConsultationWorkspace
                queueEntry={selectedEntry}
                doctorId={doctorRecord.user_id || doctorRecord.id}
                doctorName={doctorName}
                onComplete={handleComplete}
                onOpenHistory={() => setShowHistory(!showHistory)}
                showHistoryActive={showHistory}
              />
            </div>

            {/* History drawer */}
            {showHistory && selectedEntry.patient && (
              <PatientHistoryDrawer
                patientId={selectedEntry.patient.id}
                patientName={`${selectedEntry.patient.first_name} ${selectedEntry.patient.last_name}`.trim()}
                onClose={() => setShowHistory(false)}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Stethoscope size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-600 mb-1">Welcome, Dr. {doctorName}</h2>
              <p className="text-sm text-gray-400">Select a patient from the queue to start consultation</p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
                <span>Waiting: {stats.waiting}</span>
                <span>Vitals Done: {stats.vitalsDone}</span>
                <span>Completed: {stats.completed}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorConsole;
