import React, { useState } from 'react';
import { Plus, Trash2, Search, FileText } from 'lucide-react';
import PrescriptionTemplates from '../../PrescriptionTemplates';
import { useDrugSearch } from '../hooks/useDrugSearch';
import type { PrescriptionLine, ConsultationDraft } from '../hooks/useConsultation';

interface PrescriptionTabProps {
  patientId: string;
  consultationId: string | null;
  draft: ConsultationDraft;
  onUpdate: (updates: Partial<ConsultationDraft>) => void;
}

const FREQUENCIES = ['OD', 'BD', 'TDS', 'QID', 'SOS', 'STAT', 'HS', 'PRN'];
const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Nasal'];

const PrescriptionTab: React.FC<PrescriptionTabProps> = ({ patientId, consultationId, draft, onUpdate }) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const { results: drugResults, loading: drugLoading, search: searchDrugs, clear: clearDrugs } = useDrugSearch();

  const lines = draft.prescriptionLines;

  const addLine = (line?: Partial<PrescriptionLine>) => {
    const newLine: PrescriptionLine = {
      id: crypto.randomUUID(),
      drug_name: line?.drug_name || '',
      drug_id: line?.drug_id,
      dosage: line?.dosage || '',
      frequency: line?.frequency || 'OD',
      duration: line?.duration || '',
      route: line?.route || 'Oral',
      instructions: line?.instructions || '',
    };
    onUpdate({ prescriptionLines: [...lines, newLine] });
  };

  const updateLine = (id: string, field: keyof PrescriptionLine, value: string) => {
    onUpdate({
      prescriptionLines: lines.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const removeLine = (id: string) => {
    onUpdate({ prescriptionLines: lines.filter(l => l.id !== id) });
  };

  const handleDrugSearch = (query: string) => {
    setDrugSearchQuery(query);
    searchDrugs(query);
    setShowDrugDropdown(query.length >= 2);
  };

  const handleSelectDrug = (drug: any) => {
    addLine({
      drug_id: drug.id,
      drug_name: drug.drug_name || drug.generic_name,
      route: drug.route || 'Oral',
      dosage: drug.strength || '',
    });
    setDrugSearchQuery('');
    setShowDrugDropdown(false);
    clearDrugs();
  };

  const handleSelectTemplate = (_template: any, items: any[]) => {
    const newLines: PrescriptionLine[] = items.map(item => ({
      id: crypto.randomUUID(),
      drug_id: item.drug_id,
      drug_name: item.drug_name,
      dosage: item.dosage || '',
      frequency: item.frequency || 'OD',
      duration: item.duration || '',
      route: item.route || 'Oral',
      instructions: item.instructions || '',
    }));
    onUpdate({ prescriptionLines: [...lines, ...newLines] });
    setShowTemplates(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Prescription</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium transition-colors"
          >
            <FileText size={13} /> Load Template
          </button>
          <button
            onClick={() => addLine()}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
          >
            <Plus size={13} /> Add Drug
          </button>
        </div>
      </div>

      {/* Template picker */}
      {showTemplates && (
        <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
          <PrescriptionTemplates
            patientId={patientId}
            consultationId={consultationId || undefined}
            mode="selector"
            onSelectTemplate={handleSelectTemplate}
          />
        </div>
      )}

      {/* Drug search */}
      <div className="relative">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={drugSearchQuery}
            onChange={(e) => handleDrugSearch(e.target.value)}
            onFocus={() => drugSearchQuery.length >= 2 && setShowDrugDropdown(true)}
            onBlur={() => setTimeout(() => setShowDrugDropdown(false), 200)}
            placeholder="Search drugs from catalog..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {showDrugDropdown && (drugResults.length > 0 || drugLoading) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {drugLoading ? (
              <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
            ) : (
              drugResults.map((drug: any) => (
                <button
                  key={drug.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectDrug(drug)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-800">{drug.drug_name}</span>
                  {drug.generic_name && drug.generic_name !== drug.drug_name && (
                    <span className="text-gray-500 ml-1">({drug.generic_name})</span>
                  )}
                  {drug.strength && <span className="text-gray-400 ml-1">- {drug.strength}</span>}
                  {drug.drug_type && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{drug.drug_type}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Drug table */}
      {lines.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Drug Name</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Dosage</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Frequency</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Duration</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Route</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Instructions</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-1">
                    <input
                      value={line.drug_name}
                      onChange={(e) => updateLine(line.id, 'drug_name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Drug name"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      value={line.dosage}
                      onChange={(e) => updateLine(line.id, 'dosage', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 500mg"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <select
                      value={line.frequency}
                      onChange={(e) => updateLine(line.id, 'frequency', e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1">
                    <input
                      value={line.duration}
                      onChange={(e) => updateLine(line.id, 'duration', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 5 days"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <select
                      value={line.route}
                      onChange={(e) => updateLine(line.id, 'route', e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1">
                    <input
                      value={line.instructions}
                      onChange={(e) => updateLine(line.id, 'instructions', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="e.g. After food"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() => removeLine(line.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-sm">No drugs added yet</p>
          <p className="text-xs mt-1">Search above or load a template to add drugs</p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionTab;
