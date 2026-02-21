import React from 'react';
import ChiefComplaints from '../../ChiefComplaints';
import type { ConsultationDraft } from '../hooks/useConsultation';

interface ComplaintsTabProps {
  patientId: string;
  draft: ConsultationDraft;
  onUpdate: (updates: Partial<ConsultationDraft>) => void;
}

const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ patientId, draft, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Chief Complaints</h3>
        <ChiefComplaints
          patientId={patientId}
          onComplaintsChange={(complaints) => {
            // Serialize complaints to string for storage
            const text = complaints
              .map(c => `${c.complaint}${c.duration ? ` (${c.duration})` : ''}${c.severity ? ` [${c.severity}]` : ''}`)
              .join('; ');
            onUpdate({ chief_complaints: text });
          }}
        />
      </div>

      {/* Additional notes */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Additional Notes</label>
        <textarea
          value={draft.chief_complaints}
          onChange={(e) => onUpdate({ chief_complaints: e.target.value })}
          placeholder="Additional complaint details or notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default ComplaintsTab;
