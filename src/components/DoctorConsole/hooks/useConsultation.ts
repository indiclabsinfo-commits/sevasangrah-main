import { useState, useCallback, useRef, useEffect } from 'react';
import { opdService, type CreateConsultationData, type OPDConsultation } from '../../../services/opdService';

export interface PrescriptionLine {
  id: string;
  drug_id?: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface ConsultationDraft {
  chief_complaints: string;
  examination_findings: string;
  diagnosis: string;
  diagnosis_codes: string[];
  treatment_plan: string;
  follow_up_date: string;
  follow_up_notes: string;
  prescriptionLines: PrescriptionLine[];
}

const EMPTY_DRAFT: ConsultationDraft = {
  chief_complaints: '',
  examination_findings: '',
  diagnosis: '',
  diagnosis_codes: [],
  treatment_plan: '',
  follow_up_date: '',
  follow_up_notes: '',
  prescriptionLines: [],
};

type ConsultationState = 'idle' | 'drafting' | 'saving' | 'saved' | 'completing' | 'completed';

export function useConsultation(patientId: string | null, doctorId: string | null, queueId: string | null) {
  const [draft, setDraft] = useState<ConsultationDraft>({ ...EMPTY_DRAFT });
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [state, setState] = useState<ConsultationState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when patient changes
  useEffect(() => {
    if (!patientId) {
      setDraft({ ...EMPTY_DRAFT });
      setConsultationId(null);
      setState('idle');
      setLastSaved(null);
      return;
    }

    // Check for existing in-progress consultation for this queue entry
    if (queueId) {
      opdService.getConsultationByQueueId(queueId).then(existing => {
        if (existing) {
          setConsultationId(existing.id);
          setDraft({
            chief_complaints: existing.chief_complaints || '',
            examination_findings: existing.examination_findings || '',
            diagnosis: existing.diagnosis || '',
            diagnosis_codes: existing.diagnosis_codes || [],
            treatment_plan: existing.treatment_plan || '',
            follow_up_date: existing.follow_up_date || '',
            follow_up_notes: existing.follow_up_notes || '',
            prescriptionLines: [],
          });
          setState('saved');
        } else {
          setDraft({ ...EMPTY_DRAFT });
          setConsultationId(null);
          setState('drafting');
        }
      });
    } else {
      setState('drafting');
    }
  }, [patientId, queueId]);

  const updateDraft = useCallback((updates: Partial<ConsultationDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
    if (state === 'idle') setState('drafting');

    // Debounced autosave
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      // Only autosave if we already have a consultation ID
      if (consultationId) {
        _autoSave();
      }
    }, 3000);
  }, [state, consultationId]);

  const _autoSave = useCallback(async () => {
    if (!consultationId || !patientId || !doctorId) return;
    try {
      await opdService.updateConsultation(consultationId, {
        chief_complaints: draft.chief_complaints || 'Pending',
        examination_findings: draft.examination_findings || undefined,
        diagnosis: draft.diagnosis || 'Pending',
        diagnosis_codes: draft.diagnosis_codes.length > 0 ? draft.diagnosis_codes : undefined,
        treatment_plan: draft.treatment_plan || undefined,
        follow_up_date: draft.follow_up_date || undefined,
        follow_up_notes: draft.follow_up_notes || undefined,
      });
      setLastSaved(new Date());
    } catch {
      // Silent fail for autosave
    }
  }, [consultationId, patientId, doctorId, draft]);

  const saveConsultation = useCallback(async (): Promise<string | null> => {
    if (!patientId || !doctorId) return null;
    setState('saving');

    try {
      if (consultationId) {
        // Update existing
        await opdService.updateConsultation(consultationId, {
          chief_complaints: draft.chief_complaints || 'Not recorded',
          examination_findings: draft.examination_findings || undefined,
          diagnosis: draft.diagnosis || 'Pending',
          diagnosis_codes: draft.diagnosis_codes.length > 0 ? draft.diagnosis_codes : undefined,
          treatment_plan: draft.treatment_plan || undefined,
          follow_up_date: draft.follow_up_date || undefined,
          follow_up_notes: draft.follow_up_notes || undefined,
        });
        setState('saved');
        setLastSaved(new Date());
        return consultationId;
      } else {
        // Create new
        const data: CreateConsultationData = {
          patient_id: patientId,
          doctor_id: doctorId,
          queue_id: queueId || undefined,
          chief_complaints: draft.chief_complaints || 'Not recorded',
          examination_findings: draft.examination_findings || undefined,
          diagnosis: draft.diagnosis || 'Pending',
          diagnosis_codes: draft.diagnosis_codes.length > 0 ? draft.diagnosis_codes : undefined,
          treatment_plan: draft.treatment_plan || undefined,
          follow_up_date: draft.follow_up_date || undefined,
          follow_up_notes: draft.follow_up_notes || undefined,
        };

        const consultation = await opdService.createConsultation(data);
        setConsultationId(consultation.id);
        setState('saved');
        setLastSaved(new Date());
        return consultation.id;
      }
    } catch (error) {
      setState('drafting');
      throw error;
    }
  }, [patientId, doctorId, queueId, consultationId, draft]);

  const completeConsultation = useCallback(async (): Promise<string | null> => {
    setState('completing');
    try {
      // Save first if not saved
      let id = consultationId;
      if (!id) {
        id = await saveConsultation();
      } else {
        await saveConsultation();
      }

      if (!id) throw new Error('Failed to save consultation');

      // Save prescription if any
      if (draft.prescriptionLines.length > 0 && patientId) {
        await opdService.savePrescriptionLines(id, patientId, draft.prescriptionLines);
      }

      // Mark consultation as completed
      await opdService.completeConsultation(id, queueId || undefined);

      setState('completed');
      return id;
    } catch (error) {
      setState('saved');
      throw error;
    }
  }, [consultationId, saveConsultation, queueId, draft.prescriptionLines, patientId]);

  // Cleanup autosave timer
  useEffect(() => {
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, []);

  return {
    draft,
    updateDraft,
    consultationId,
    state,
    lastSaved,
    saveConsultation,
    completeConsultation,
  };
}
