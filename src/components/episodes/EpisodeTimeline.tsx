// Episode of Care Timeline
// Feature: Group and visualize patient episodes

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Link2, FileText, Pill, Stethoscope, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/apiService';

interface Episode {
  id: string;
  episode_number: string;
  episode_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  primary_diagnosis?: string;
  primary_doctor_id?: string;
  department?: string;
  notes?: string;
  records?: EpisodeRecord[];
}

interface EpisodeRecord {
  id: string;
  record_type: string;
  record_id: string;
  record_date: string;
  description?: string;
}

interface EpisodeTimelineProps {
  patientId: string;
  patientName?: string;
}

const EpisodeTimeline: React.FC<EpisodeTimelineProps> = ({ patientId, patientName }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEpisode, setNewEpisode] = useState({
    episode_type: 'opd_visit',
    start_date: new Date().toISOString().split('T')[0],
    primary_diagnosis: '',
    department: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEpisodes();
  }, [patientId]);

  const loadEpisodes = async () => {
    setLoading(true);
    try {
      const data = await api.episodes.list(patientId);
      setEpisodes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load episodes:', err);
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const createEpisode = async () => {
    setCreating(true);
    try {
      await api.episodes.create({
        patient_id: patientId,
        ...newEpisode,
      });
      setShowNewForm(false);
      setNewEpisode({
        episode_type: 'opd_visit',
        start_date: new Date().toISOString().split('T')[0],
        primary_diagnosis: '',
        department: '',
        notes: '',
      });
      await loadEpisodes();
    } catch (err: any) {
      alert('Failed to create episode: ' + (err.message || 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const closeEpisode = async (episodeId: string) => {
    try {
      await api.episodes.update(episodeId, {
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0],
      });
      await loadEpisodes();
    } catch (err: any) {
      alert('Failed to close episode: ' + (err.message || 'Unknown error'));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opd_visit': return <Stethoscope size={16} />;
      case 'ipd_admission': return <Activity size={16} />;
      case 'emergency': return <Activity size={16} className="text-red-600" />;
      case 'surgery': return <FileText size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <Stethoscope size={14} />;
      case 'prescription': return <Pill size={14} />;
      case 'investigation': return <FileText size={14} />;
      case 'procedure': return <Activity size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Episodes of Care</h2>
            <p className="text-sm text-gray-600">
              {patientName ? `${patientName} - ` : ''}{episodes.length} episode{episodes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          New Episode
        </button>
      </div>

      {/* New Episode Form */}
      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-gray-800">Create New Episode</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Episode Type</label>
              <select
                value={newEpisode.episode_type}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, episode_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="opd_visit">OPD Visit</option>
                <option value="ipd_admission">IPD Admission</option>
                <option value="emergency">Emergency</option>
                <option value="surgery">Surgery</option>
                <option value="followup">Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={newEpisode.start_date}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={newEpisode.department}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., General Medicine"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Diagnosis</label>
              <input
                type="text"
                value={newEpisode.primary_diagnosis}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, primary_diagnosis: e.target.value }))}
                placeholder="Initial diagnosis..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={newEpisode.notes}
              onChange={(e) => setNewEpisode(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createEpisode}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
            >
              {creating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus size={16} />
              )}
              Create Episode
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {episodes.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Clock size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No episodes yet</p>
          <p className="text-sm text-gray-500 mt-1">Create the first episode of care for this patient</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-4">
            {episodes.map((episode) => (
              <div key={episode.id} className="relative pl-14">
                {/* Timeline dot */}
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                  episode.status === 'active' ? 'bg-green-500 border-green-300' :
                  episode.status === 'completed' ? 'bg-blue-500 border-blue-300' :
                  'bg-gray-400 border-gray-300'
                }`}></div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Episode Header */}
                  <button
                    onClick={() => setExpandedEpisode(expandedEpisode === episode.id ? null : episode.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(episode.episode_type)}
                      <div className="text-left">
                        <div className="font-medium text-gray-800">
                          {episode.episode_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          <span className="text-sm font-mono text-gray-500 ml-2">#{episode.episode_number}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(episode.start_date)}
                          {episode.end_date ? ` - ${formatDate(episode.end_date)}` : ' - Ongoing'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(episode.status)}`}>
                        {episode.status}
                      </span>
                      {expandedEpisode === episode.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Episode Details */}
                  {expandedEpisode === episode.id && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                      {episode.primary_diagnosis && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">Diagnosis</div>
                          <div className="text-sm text-gray-800">{episode.primary_diagnosis}</div>
                        </div>
                      )}

                      {episode.department && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">Department</div>
                          <div className="text-sm text-gray-800">{episode.department}</div>
                        </div>
                      )}

                      {episode.notes && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</div>
                          <div className="text-sm text-gray-800">{episode.notes}</div>
                        </div>
                      )}

                      {/* Linked Records */}
                      {episode.records && episode.records.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Linked Records</div>
                          <div className="space-y-2">
                            {episode.records.map((record) => (
                              <div key={record.id} className="flex items-center gap-3 bg-gray-50 rounded p-2">
                                {getRecordIcon(record.record_type)}
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-700 capitalize">
                                    {record.record_type}
                                  </div>
                                  {record.description && (
                                    <div className="text-xs text-gray-500">{record.description}</div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{formatDate(record.record_date)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {episode.status === 'active' && (
                          <button
                            onClick={() => closeEpisode(episode.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            Close Episode
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeTimeline;
