import React from 'react';
import ExaminationTemplates from '../../ExaminationTemplates';
import type { ConsultationDraft } from '../hooks/useConsultation';

interface ExaminationTabProps {
  patientId: string;
  consultationId: string | null;
  draft: ConsultationDraft;
  onUpdate: (updates: Partial<ConsultationDraft>) => void;
}

const ExaminationTab: React.FC<ExaminationTabProps> = ({ patientId, consultationId, draft, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Examination Findings</h3>

        {/* Free-text findings */}
        <textarea
          value={draft.examination_findings}
          onChange={(e) => onUpdate({ examination_findings: e.target.value })}
          placeholder="Enter examination findings..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4"
        />
      </div>

      {/* Template-based examination */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Or use a template:</h4>
        <ExaminationTemplates
          patientId={patientId}
          consultationId={consultationId || undefined}
          mode="selector"
          onSelectTemplate={(template) => {
            onUpdate({
              examination_findings: draft.examination_findings
                ? `${draft.examination_findings}\n[Template: ${template.template_name}]`
                : `[Template: ${template.template_name}]`
            });
          }}
          onSaveFindings={(findings) => {
            const findingsText = typeof findings === 'string'
              ? findings
              : JSON.stringify(findings);
            onUpdate({
              examination_findings: draft.examination_findings
                ? `${draft.examination_findings}\n${findingsText}`
                : findingsText
            });
          }}
        />
      </div>
    </div>
  );
};

export default ExaminationTab;
