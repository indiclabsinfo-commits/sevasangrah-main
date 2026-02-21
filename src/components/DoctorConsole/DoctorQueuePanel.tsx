import React, { useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import QueuePatientCard from './QueuePatientCard';
import type { QueueEntry } from './hooks/useDoctorQueue';

interface DoctorQueuePanelProps {
  queue: QueueEntry[];
  loading: boolean;
  selectedEntryId: string | null;
  onSelectPatient: (entry: QueueEntry) => void;
  onRefresh: () => void;
  stats: {
    total: number;
    waiting: number;
    vitalsDone: number;
    inConsultation: number;
    completed: number;
  };
}

type FilterTab = 'all' | 'WAITING' | 'VITALS_DONE' | 'IN_CONSULTATION';

const DoctorQueuePanel: React.FC<DoctorQueuePanelProps> = ({
  queue,
  loading,
  selectedEntryId,
  onSelectPatient,
  onRefresh,
  stats,
}) => {
  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredQueue = filter === 'all'
    ? queue
    : queue.filter(q => q.queue_status === filter);

  // Sort: non-completed first, then by queue_no
  const sortedQueue = [...filteredQueue].sort((a, b) => {
    if (a.queue_status === 'COMPLETED' && b.queue_status !== 'COMPLETED') return 1;
    if (a.queue_status !== 'COMPLETED' && b.queue_status === 'COMPLETED') return -1;
    return (a.queue_no || 0) - (b.queue_no || 0);
  });

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'WAITING', label: 'Waiting', count: stats.waiting },
    { key: 'VITALS_DONE', label: 'Vitals', count: stats.vitalsDone },
    { key: 'IN_CONSULTATION', label: 'Active', count: stats.inConsultation },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Today's Queue</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.total - stats.completed} active
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {loading && queue.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : sortedQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm text-center">
              {filter === 'all' ? 'No patients in your queue today' : 'No patients with this status'}
            </p>
          </div>
        ) : (
          sortedQueue.map(entry => (
            <QueuePatientCard
              key={entry.id}
              entry={entry}
              isSelected={selectedEntryId === entry.id}
              onSelect={onSelectPatient}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Done: {stats.completed}/{stats.total}</span>
          <span>Waiting: {stats.waiting + stats.vitalsDone}</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorQueuePanel;
