import React, { useEffect, useState } from 'react';
import { X, ChevronDown, ChevronUp, Stethoscope, Pill, Activity, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { opdService } from '../../services/opdService';

interface PatientHistoryDrawerProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

interface HistoryData {
  consultations: any[];
  prescriptions: any[];
  vitals: any;
}

const PatientHistoryDrawer: React.FC<PatientHistoryDrawerProps> = ({ patientId, patientName, onClose }) => {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const history = await opdService.getPatientHistory(patientId);
        setData(history);
      } catch {
        setData({ consultations: [], prescriptions: [], vitals: null });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-96 bg-white border-l border-gray-200 flex flex-col h-full flex-shrink-0 shadow-lg"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Patient History</h3>
          <p className="text-xs text-gray-500">{patientName}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Vitals Summary */}
            {data?.vitals && (
              <div className="p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  <Activity size={13} /> Latest Vitals
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data.vitals.blood_pressure_systolic && (
                    <div className="bg-pink-50 text-pink-700 px-2 py-1.5 rounded">
                      BP: {data.vitals.blood_pressure_systolic}/{data.vitals.blood_pressure_diastolic}
                    </div>
                  )}
                  {data.vitals.pulse_rate && (
                    <div className="bg-red-50 text-red-700 px-2 py-1.5 rounded">
                      Pulse: {data.vitals.pulse_rate} bpm
                    </div>
                  )}
                  {data.vitals.temperature_f && (
                    <div className="bg-orange-50 text-orange-700 px-2 py-1.5 rounded">
                      Temp: {data.vitals.temperature_f}°F
                    </div>
                  )}
                  {data.vitals.spO2_percentage && (
                    <div className="bg-blue-50 text-blue-700 px-2 py-1.5 rounded">
                      SpO2: {data.vitals.spO2_percentage}%
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Consultations */}
            <div className="p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                <Stethoscope size={13} /> Past Consultations ({data?.consultations?.length || 0})
              </h4>

              {(!data?.consultations || data.consultations.length === 0) ? (
                <p className="text-xs text-gray-400 py-2">No previous consultations found</p>
              ) : (
                <div className="space-y-2">
                  {data.consultations.slice(0, 10).map((c: any) => {
                    const isExpanded = expandedIds.has(c.id);
                    const doctorName = c.doctor
                      ? `Dr. ${c.doctor.first_name || ''} ${c.doctor.last_name || ''}`.trim()
                      : 'Doctor';
                    return (
                      <div key={c.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-700">
                                {formatDate(c.consultation_date)}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                c.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px]">
                              {c.diagnosis || c.chief_complaints || 'No details'}
                            </p>
                          </div>
                          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 py-2 bg-gray-50 text-xs space-y-1.5 border-t border-gray-100">
                                <p className="text-gray-500">{doctorName}</p>
                                {c.chief_complaints && (
                                  <div>
                                    <span className="font-medium text-gray-600">Complaints:</span>{' '}
                                    <span className="text-gray-500">{c.chief_complaints}</span>
                                  </div>
                                )}
                                {c.diagnosis && (
                                  <div>
                                    <span className="font-medium text-gray-600">Diagnosis:</span>{' '}
                                    <span className="text-gray-500">{c.diagnosis}</span>
                                  </div>
                                )}
                                {c.treatment_plan && (
                                  <div>
                                    <span className="font-medium text-gray-600">Treatment:</span>{' '}
                                    <span className="text-gray-500">{c.treatment_plan}</span>
                                  </div>
                                )}
                                {c.follow_up_date && (
                                  <div>
                                    <span className="font-medium text-gray-600">Follow-up:</span>{' '}
                                    <span className="text-gray-500">{formatDate(c.follow_up_date)}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prescriptions */}
            <div className="p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                <Pill size={13} /> Past Prescriptions ({data?.prescriptions?.length || 0})
              </h4>

              {(!data?.prescriptions || data.prescriptions.length === 0) ? (
                <p className="text-xs text-gray-400 py-2">No previous prescriptions found</p>
              ) : (
                <div className="space-y-2">
                  {data.prescriptions.slice(0, 5).map((p: any, idx: number) => (
                    <div key={p.id || idx} className="border border-gray-200 rounded-lg px-3 py-2 text-xs">
                      <p className="font-medium text-gray-700">
                        {formatDate(p.prescription_date || p.created_at)}
                      </p>
                      {p.medications && (
                        <p className="text-gray-500 mt-1 truncate">
                          {typeof p.medications === 'string'
                            ? JSON.parse(p.medications).map((m: any) => m.drug_name).join(', ')
                            : Array.isArray(p.medications)
                              ? p.medications.map((m: any) => m.drug_name).join(', ')
                              : 'Prescription details'
                          }
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PatientHistoryDrawer;
