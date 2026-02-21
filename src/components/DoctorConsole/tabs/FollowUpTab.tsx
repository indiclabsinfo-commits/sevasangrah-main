import React from 'react';
import type { ConsultationDraft } from '../hooks/useConsultation';

interface FollowUpTabProps {
  draft: ConsultationDraft;
  onUpdate: (updates: Partial<ConsultationDraft>) => void;
}

const FollowUpTab: React.FC<FollowUpTabProps> = ({ draft, onUpdate }) => {
  return (
    <div className="space-y-5">
      {/* Treatment Plan */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Treatment Plan</h3>
        <textarea
          value={draft.treatment_plan}
          onChange={(e) => onUpdate({ treatment_plan: e.target.value })}
          placeholder="Enter treatment plan, advice, and instructions..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {/* Follow-up Date */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Follow-up</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up Date</label>
            <input
              type="date"
              value={draft.follow_up_date}
              onChange={(e) => onUpdate({ follow_up_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Quick Select</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '3 Days', days: 3 },
                { label: '1 Week', days: 7 },
                { label: '2 Weeks', days: 14 },
                { label: '1 Month', days: 30 },
              ].map(opt => (
                <button
                  key={opt.days}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + opt.days);
                    onUpdate({ follow_up_date: d.toISOString().split('T')[0] });
                  }}
                  className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up Instructions</label>
        <textarea
          value={draft.follow_up_notes}
          onChange={(e) => onUpdate({ follow_up_notes: e.target.value })}
          placeholder="Instructions for next visit, tests to bring, etc..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default FollowUpTab;
