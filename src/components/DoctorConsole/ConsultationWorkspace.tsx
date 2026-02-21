import React, { useState } from 'react';
import {
  MessageSquare, Stethoscope, FileSearch, Pill, CalendarCheck,
  Save, Printer, CheckCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import PatientBanner from './PatientBanner';
import ComplaintsTab from './tabs/ComplaintsTab';
import ExaminationTab from './tabs/ExaminationTab';
import DiagnosisTab from './tabs/DiagnosisTab';
import PrescriptionTab from './tabs/PrescriptionTab';
import FollowUpTab from './tabs/FollowUpTab';
import { useConsultation } from './hooks/useConsultation';
import type { QueueEntry } from './hooks/useDoctorQueue';

interface ConsultationWorkspaceProps {
  queueEntry: QueueEntry;
  doctorId: string;
  doctorName: string;
  onComplete: () => void;
  onOpenHistory: () => void;
  showHistoryActive: boolean;
}

type TabId = 'complaints' | 'examination' | 'diagnosis' | 'prescription' | 'followup';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'complaints', label: 'Complaints', icon: <MessageSquare size={15} /> },
  { id: 'examination', label: 'Examination', icon: <Stethoscope size={15} /> },
  { id: 'diagnosis', label: 'Diagnosis', icon: <FileSearch size={15} /> },
  { id: 'prescription', label: 'Prescription', icon: <Pill size={15} /> },
  { id: 'followup', label: 'Follow-up', icon: <CalendarCheck size={15} /> },
];

const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({
  queueEntry,
  doctorId,
  doctorName,
  onComplete,
  onOpenHistory,
  showHistoryActive,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('complaints');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const {
    draft,
    updateDraft,
    consultationId,
    state,
    lastSaved,
    saveConsultation,
    completeConsultation,
  } = useConsultation(
    queueEntry.patient?.id || null,
    doctorId,
    queueEntry.id
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConsultation();
      toast.success('Consultation saved');
    } catch (error: any) {
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!draft.chief_complaints && !draft.diagnosis) {
      toast.error('Please add at least complaints or diagnosis before completing');
      return;
    }
    setCompleting(true);
    try {
      await completeConsultation();
      toast.success('Consultation completed successfully');
      onComplete();
    } catch (error: any) {
      toast.error(`Failed to complete: ${error.message}`);
    } finally {
      setCompleting(false);
    }
  };

  const handlePrint = async () => {
    // Save first
    try {
      await saveConsultation();
      // Open print dialog
      window.print();
    } catch (error: any) {
      toast.error(`Save before print failed: ${error.message}`);
    }
  };

  // Check which tabs have content
  const tabProgress: Record<TabId, boolean> = {
    complaints: !!draft.chief_complaints,
    examination: !!draft.examination_findings,
    diagnosis: !!draft.diagnosis,
    prescription: draft.prescriptionLines.length > 0,
    followup: !!draft.follow_up_date || !!draft.treatment_plan,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Patient Banner */}
      <PatientBanner
        patient={queueEntry.patient}
        onToggleHistory={onOpenHistory}
        showHistoryActive={showHistoryActive}
      />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-1 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tabProgress[tab.id] && (
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            )}
          </button>
        ))}

        {/* Save indicator */}
        <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          {state === 'saving' && <Loader2 size={12} className="animate-spin" />}
          {lastSaved && (
            <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl">
          {activeTab === 'complaints' && (
            <ComplaintsTab
              patientId={queueEntry.patient?.id || ''}
              draft={draft}
              onUpdate={updateDraft}
            />
          )}
          {activeTab === 'examination' && (
            <ExaminationTab
              patientId={queueEntry.patient?.id || ''}
              consultationId={consultationId}
              draft={draft}
              onUpdate={updateDraft}
            />
          )}
          {activeTab === 'diagnosis' && (
            <DiagnosisTab draft={draft} onUpdate={updateDraft} />
          )}
          {activeTab === 'prescription' && (
            <PrescriptionTab
              patientId={queueEntry.patient?.id || ''}
              consultationId={consultationId}
              draft={draft}
              onUpdate={updateDraft}
            />
          )}
          {activeTab === 'followup' && (
            <FollowUpTab draft={draft} onUpdate={updateDraft} />
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || state === 'completed'}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          {draft.prescriptionLines.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              <Printer size={14} />
              Print Prescription
            </button>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={completing || state === 'completed'}
          className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Complete & Close
        </button>
      </div>
    </div>
  );
};

export default ConsultationWorkspace;
