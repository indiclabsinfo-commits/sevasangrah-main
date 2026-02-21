import React from 'react';
import { Clock, PlayCircle, User, Video, ExternalLink } from 'lucide-react';
import type { QueueEntry } from './hooks/useDoctorQueue';

interface QueuePatientCardProps {
  entry: QueueEntry;
  isSelected: boolean;
  onSelect: (entry: QueueEntry) => void;
}

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  WAITING: { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700', label: 'Waiting' },
  VITALS_DONE: { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700', label: 'Vitals Done' },
  IN_CONSULTATION: { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-700', label: 'In Consultation' },
  COMPLETED: { bg: 'bg-gray-50', border: 'border-l-gray-400', text: 'text-gray-500', label: 'Completed' },
};

function getWaitMinutes(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.round((now.getTime() - created.getTime()) / 60000);
}

const QueuePatientCard: React.FC<QueuePatientCardProps> = ({ entry, isSelected, onSelect }) => {
  const status = statusConfig[entry.queue_status] || statusConfig.WAITING;
  const patientName = `${entry.patient?.first_name || 'Unknown'} ${entry.patient?.last_name || ''}`.trim();
  const waitMin = getWaitMinutes(entry.created_at);
  const isCompleted = entry.queue_status === 'COMPLETED';

  return (
    <button
      onClick={() => !isCompleted && onSelect(entry)}
      disabled={isCompleted}
      className={`w-full text-left p-3 border-l-4 transition-all ${status.border} ${
        isSelected
          ? 'bg-blue-50 ring-1 ring-blue-300'
          : isCompleted
            ? 'bg-gray-50 opacity-60'
            : `${status.bg} hover:shadow-sm hover:bg-opacity-80`
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">#{entry.queue_no}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {entry.consultation_mode && entry.consultation_mode !== 'physical' && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
              entry.consultation_mode === 'google_meet' ? 'bg-blue-100 text-blue-700' :
              entry.consultation_mode === 'zoom' ? 'bg-indigo-100 text-indigo-700' :
              'bg-green-100 text-green-700'
            }`}>
              <Video size={10} />
              {entry.consultation_mode === 'google_meet' ? 'Meet' : entry.consultation_mode === 'zoom' ? 'Zoom' : 'WhatsApp'}
            </span>
          )}
          {entry.priority && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Priority</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <User size={14} className="text-gray-400 flex-shrink-0" />
        <span className="font-medium text-sm text-gray-800 truncate">{patientName}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {entry.patient?.age ? `${entry.patient.age}y` : ''}{entry.patient?.gender ? ` / ${entry.patient.gender.charAt(0)}` : ''}
          {entry.patient?.uhid ? ` | ${entry.patient.uhid}` : ''}
        </span>
        {!isCompleted && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {waitMin}m
          </span>
        )}
      </div>

      {!isCompleted && entry.queue_status !== 'IN_CONSULTATION' && !isSelected && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
            <PlayCircle size={13} /> Start Consultation
          </span>
        </div>
      )}

      {!isCompleted && entry.join_url && entry.consultation_mode !== 'physical' && (
        <div className="mt-2">
          <a
            href={entry.join_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
          >
            <ExternalLink size={11} /> Join Call
          </a>
        </div>
      )}
    </button>
  );
};

export default QueuePatientCard;
