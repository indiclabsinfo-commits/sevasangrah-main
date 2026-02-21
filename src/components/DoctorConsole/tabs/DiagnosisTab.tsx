import React, { useState } from 'react';
import ICD10Lookup from '../../ICD10Lookup';
import { X } from 'lucide-react';
import type { ConsultationDraft } from '../hooks/useConsultation';

interface DiagnosisTabProps {
  draft: ConsultationDraft;
  onUpdate: (updates: Partial<ConsultationDraft>) => void;
}

interface ICD10Code {
  code: string;
  description: string;
}

const DiagnosisTab: React.FC<DiagnosisTabProps> = ({ draft, onUpdate }) => {
  const [selectedCodes, setSelectedCodes] = useState<ICD10Code[]>(
    (draft.diagnosis_codes || []).map(code => ({ code, description: '' }))
  );

  const handleSelectCode = (code: ICD10Code) => {
    if (selectedCodes.some(c => c.code === code.code)) return;
    const updated = [...selectedCodes, code];
    setSelectedCodes(updated);
    onUpdate({ diagnosis_codes: updated.map(c => c.code) });

    // Also append to diagnosis text
    const diagText = draft.diagnosis
      ? `${draft.diagnosis}, ${code.code} - ${code.description}`
      : `${code.code} - ${code.description}`;
    onUpdate({ diagnosis: diagText, diagnosis_codes: updated.map(c => c.code) });
  };

  const handleRemoveCode = (codeStr: string) => {
    const updated = selectedCodes.filter(c => c.code !== codeStr);
    setSelectedCodes(updated);
    onUpdate({ diagnosis_codes: updated.map(c => c.code) });
  };

  return (
    <div className="space-y-4">
      {/* Diagnosis free text */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Diagnosis</h3>
        <textarea
          value={draft.diagnosis}
          onChange={(e) => onUpdate({ diagnosis: e.target.value })}
          placeholder="Enter diagnosis..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {/* Selected ICD-10 codes */}
      {selectedCodes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Selected ICD-10 Codes</label>
          <div className="flex flex-wrap gap-2">
            {selectedCodes.map(code => (
              <span
                key={code.code}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
              >
                {code.code}{code.description ? ` - ${code.description}` : ''}
                <button
                  onClick={() => handleRemoveCode(code.code)}
                  className="hover:text-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ICD-10 Lookup */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Search ICD-10 Codes</h4>
        <ICD10Lookup
          onSelectCode={handleSelectCode}
          selectedCodes={selectedCodes}
          onRemoveCode={handleRemoveCode}
          maxSelections={10}
        />
      </div>
    </div>
  );
};

export default DiagnosisTab;
