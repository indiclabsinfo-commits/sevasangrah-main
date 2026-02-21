// Version 2.1 - Added OPD Consultation Form integration
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Reorder } from 'framer-motion';
import {
    Users,
    Activity,
    Calendar,
    Clock,
    CheckCircle,
    PlayCircle,
    UserPlus,
    RefreshCw,
    Phone,
    Settings,
    Stethoscope
} from 'lucide-react';
import { logger } from '../../utils/logger';
import { SupabaseHospitalService } from '../../services/supabaseHospitalService';
import type { User } from '../../services/supabaseHospitalService';
import { announcePatient } from '../../utils/voiceAnnouncement';
import { ElevenLabsService } from '../../services/elevenLabsService';
import VitalsRecordingModal from './VitalsRecordingModal';
import WalkInQueueModal from './WalkInQueueModal';
import OPDConsultationForm from './OPDConsultationForm';
import TATDisplay from './TATDisplay';

const OPDQueueManager: React.FC = () => {
    const [queue, setQueue] = useState<any[]>([]); // Renamed from queues to queue
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Vitals Modal State
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<{ id: string, name: string, queueId: string } | null>(null);

    // Walk-in Modal State
    const [showWalkInModal, setShowWalkInModal] = useState(false);

    // Call Patient Modal State
    const [showCallModal, setShowCallModal] = useState(false);
    const [selectedPatientForCall, setSelectedPatientForCall] = useState<{ name: string, phone: string } | null>(null);

    // Consultation Modal State
    const [showConsultationModal, setShowConsultationModal] = useState(false);
    const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<{
        patientId: string,
        patientName: string,
        doctorId: string,
        doctorName: string,
        queueId: string
    } | null>(null);

    // Settings Modal State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [elevenLabsKey, setElevenLabsKey] = useState(localStorage.getItem('eleven_labs_api_key') || '');
    const [voices, setVoices] = useState<any[]>([]);
    const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem('eleven_labs_voice_id') || '');

    useEffect(() => {
        loadDoctors();
        loadQueues();

        // Auto-refresh every 3 seconds for near real-time updates
        const interval = setInterval(loadQueues, 3000);
        return () => clearInterval(interval);
    }, []);

    // Fetch voices when settings modal opens
    useEffect(() => {
        if (showSettingsModal && elevenLabsKey) {
            ElevenLabsService.getVoices(elevenLabsKey)
                .then(setVoices)
                .catch(err => {
                    console.error(err);
                    // Don't show toast on every open if key is invalid, just log
                });
        }
    }, [showSettingsModal, elevenLabsKey]);

    const loadDoctors = async () => {
        try {
            const docs = await SupabaseHospitalService.getDoctors();
            setDoctors(docs);
        } catch (error) {
            console.error('Failed to load doctors', error);
            toast.error('Failed to load doctors');
        }
    };

    const loadQueues = async () => {
        try {
            setLoading(true);
            const data = await SupabaseHospitalService.getOPDQueues(
                statusFilter !== 'all' ? statusFilter : undefined,
                selectedDoctor || undefined
            );

            // Map Supabase response to UI format
            const mappedData = data.map((item: any) => ({
                ...item,
                id: item.id,
                status: (item.queue_status || 'WAITING').toUpperCase(),
                token_number: item.queue_no,
                patient: item.patient ? {
                    id: item.patient.id,
                    first_name: item.patient.first_name,
                    last_name: item.patient.last_name,
                    age: item.patient.age,
                    gender: item.patient.gender,
                    phone: item.patient.phone,
                    patient_id: item.patient.uhid || `P${item.patient.id.substring(0, 8)}`
                } : {
                    id: item.patient_id,
                    first_name: 'Unknown',
                    last_name: 'Patient',
                    age: 0,
                    gender: 'Unknown'
                },
                doctor: item.doctor ? {
                    id: item.doctor.id,
                    name: item.doctor.name,
                    first_name: item.doctor.first_name || item.doctor.name?.split(' ').slice(0, -1).join(' '),
                    last_name: item.doctor.last_name || item.doctor.name?.split(' ').pop() || '',
                    department: item.doctor.department,
                    specialization: item.doctor.specialization
                } : {
                    id: item.doctor_id,
                    name: 'Unknown Doctor',
                    first_name: 'Unknown',
                    last_name: 'Doctor'
                }
            }));

            setQueue(mappedData);
            logger.log(`✅ Loaded ${mappedData.length} queue items`);
        } catch (error) {
            console.error('Failed to load queues', error);
            toast.error('Failed to load queue data');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (queueId: string, newStatus: string) => {
        try {
            // Map frontend status to backend status
            const backendStatus = newStatus.toLowerCase() as 'waiting' | 'in_consultation' | 'completed' | 'cancelled';

            await SupabaseHospitalService.updateOPDQueueStatus(queueId, backendStatus);
            toast.success(`Status updated to ${newStatus}`);

            // Announce if status is 'IN_CONSULTATION' (Start)
            if (newStatus === 'IN_CONSULTATION') {
                const item = queue.find(q => q.id === queueId);
                if (item && item.patient) {
                    announcePatient({
                        patientName: `${item.patient.first_name} ${item.patient.last_name}`,
                        tokenNumber: String(item.queue_no || item.token_number || '0'),
                        doctorName: item.doctor?.name || undefined
                    });
                }
            }

            loadQueues();
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update status');
        }
    };

    const handleStatusChange = async (queueId: string, newStatus: string) => {
        await updateStatus(queueId, newStatus);
    };

    const handleReorder = async (newQueue: any[]) => {
        // Optimistic update
        setQueue(newQueue);

        try {
            // Prepare the payload: array of { id, queue_no }
            const reorderPayload = newQueue.map((item, index) => ({
                id: item.id,
                order: index + 1
            }));

            await SupabaseHospitalService.reorderOPDQueue(reorderPayload);
            // toast.success('Queue order updated'); // Optional: don't spam toasts
        } catch (error) {
            console.error('Failed to persist queue order', error);
            toast.error('Failed to save new order');
            loadQueues(); // Revert on error
        }
    };

    const openVitalsModal = (patient: any, queueId: string) => {
        setSelectedPatientForVitals({
            id: patient.patient_id, // Use the correct ID field based on SQL join
            name: `${patient.first_name} ${patient.last_name}`,
            queueId: queueId
        });
        setShowVitalsModal(true);
    };

    const getStatusColor = (status: string | undefined) => {
        if (!status) return 'bg-gray-50 border-l-gray-300 text-gray-600';
        switch (status) {
            case 'WAITING': return 'bg-yellow-50 border-l-yellow-500 text-yellow-800';
            case 'VITALS_DONE': return 'bg-blue-50 border-l-blue-500 text-blue-800';
            case 'IN_CONSULTATION': return 'bg-green-50 border-l-green-500 text-green-800';
            case 'COMPLETED': return 'bg-gray-50 border-l-gray-400 text-gray-600';
            case 'CANCELLED': return 'bg-red-50 border-l-red-500 text-red-800';
            default: return 'bg-gray-50 border-l-gray-300 text-gray-600';
        }
    };

    // Sort function for local state only (initially matches backend sort)
    // When dragging happens, the order is updated locally then sent to backend

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">🏥 OPD Queue Live Status</h2>
                    <p className="text-sm text-gray-500">Drag to reorder • {queue.length} patients waiting</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="bg-gray-100 p-2 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Voice Settings"
                    >
                        <Settings size={20} />
                    </button>

                    <button
                        onClick={() => setShowWalkInModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <UserPlus size={20} />
                        Walk-in Patient
                    </button>
                    <button
                        onClick={loadQueues}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Refresh Queue"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => { setSelectedDoctor(e.target.value); loadQueues(); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Doctors</option>
                        {doctors.map((doc: any) => (
                            <option key={doc.id} value={doc.id}>{doc.name || `${doc.first_name} ${doc.last_name}`}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Queue List - Draggable */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {loading && queue.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : queue.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No patients in queue</p>
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={queue}
                        onReorder={handleReorder}
                        className="space-y-3"
                    >
                        {queue.map((item, index) => (
                            <Reorder.Item
                                key={item.id}
                                value={item}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <div className={`bg-white p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow relative ${getStatusColor(item.status)}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-700 text-sm mt-1">
                                                {item.token_number}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {item.patient?.first_name} {item.patient?.last_name}
                                                </h3>
                                                <div className="text-sm text-gray-600 flex flex-col gap-1 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        Queue Pos #{index + 1} • {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                    {item.appointment_id && (
                                                        <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                                            📅 Appt: {item.patient?.appointments?.find(a => a.id === item.appointment_id)?.appointment_time || 'Scheduled'}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        👨‍⚕️ {item.doctor?.name || item.assigned_doctor || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 items-end">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                                                item.status === 'IN_CONSULTATION' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {(item.status || 'WAITING').replace(/_/g, ' ')}
                                            </span>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-2">
                                                {item.status === 'WAITING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatientForVitals({
                                                                id: item.patient?.id,
                                                                name: `${item.patient?.first_name} ${item.patient?.last_name}`,
                                                                queueId: item.id
                                                            });
                                                            setShowVitalsModal(true);
                                                        }}
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Record Vitals"
                                                    >
                                                        <Activity size={14} /> Vitals
                                                    </button>
                                                )}

                                                {item.status === 'WAITING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatientForCall({
                                                                name: `${item.patient?.first_name} ${item.patient?.last_name}`,
                                                                phone: item.phone || 'No phone number'
                                                            });
                                                            setShowCallModal(true);
                                                        }}
                                                        className="bg-purple-50 text-purple-600 hover:bg-purple-100 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Call Patient"
                                                    >
                                                        <Phone size={14} /> Call
                                                    </button>
                                                )}

                                                {item.status === 'WAITING' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'IN_CONSULTATION')}
                                                        className="bg-green-50 text-green-600 hover:bg-green-100 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Start Consultation"
                                                    >
                                                        <PlayCircle size={14} /> Start
                                                    </button>
                                                )}

                                                {(item.status === 'VITALS_DONE' || item.status === 'IN_CONSULTATION') && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatientForConsultation({
                                                                patientId: item.patient?.id,
                                                                patientName: `${item.patient?.first_name} ${item.patient?.last_name}`,
                                                                doctorId: item.doctor?.id || item.doctor_id,
                                                                doctorName: item.doctor?.name || 'Doctor',
                                                                queueId: item.id
                                                            });
                                                            setShowConsultationModal(true);
                                                        }}
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Record Consultation"
                                                    >
                                                        <Stethoscope size={14} /> Consult
                                                    </button>
                                                )}

                                                {item.status === 'IN_CONSULTATION' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'COMPLETED')}
                                                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                                                        title="Complete"
                                                    >
                                                        <CheckCircle size={14} /> Done
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAT Display */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <TATDisplay
                                            queueItem={item}
                                            config={{
                                                maxWaitTime: 30,
                                                maxConsultationTime: 15,
                                                maxTotalTAT: 60
                                            }}
                                        />
                                    </div>

                                    {/* Drag Handle Indicator (Visual only) */}
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 opacity-50 hover:opacity-100 cursor-grab">
                                        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                                            <circle cx="4" cy="4" r="1.5" />
                                            <circle cx="4" cy="10" r="1.5" />
                                            <circle cx="4" cy="16" r="1.5" />
                                            <circle cx="8" cy="4" r="1.5" />
                                            <circle cx="8" cy="10" r="1.5" />
                                            <circle cx="8" cy="16" r="1.5" />
                                        </svg>
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Modals */}
            <WalkInQueueModal
                isOpen={showWalkInModal}
                onClose={() => { setShowWalkInModal(false); loadQueues(); }}
                onSuccess={loadQueues}
                doctors={doctors as any}
            />

            {/* Vitals Modal */}
            {selectedPatientForVitals && (
                <VitalsRecordingModal
                    isOpen={showVitalsModal}
                    onClose={() => setShowVitalsModal(false)}
                    patientId={selectedPatientForVitals.id}
                    patientName={selectedPatientForVitals.name}
                    queueId={selectedPatientForVitals.queueId}
                    onSuccess={() => {
                        setShowVitalsModal(false);
                        loadQueues();
                    }}
                />
            )}

            {/* Consultation Modal */}
            {selectedPatientForConsultation && (
                <OPDConsultationForm
                    isOpen={showConsultationModal}
                    onClose={() => {
                        setShowConsultationModal(false);
                        setSelectedPatientForConsultation(null);
                    }}
                    patientId={selectedPatientForConsultation.patientId}
                    patientName={selectedPatientForConsultation.patientName}
                    doctorId={selectedPatientForConsultation.doctorId}
                    doctorName={selectedPatientForConsultation.doctorName}
                    queueId={selectedPatientForConsultation.queueId}
                    onSuccess={(consultationId) => {
                        logger.log('✅ Consultation created:', consultationId);
                        setShowConsultationModal(false);
                        setSelectedPatientForConsultation(null);
                        loadQueues();
                        toast.success('Consultation recorded successfully!');
                    }}
                />
            )}

            {/* Call Patient Modal */}
            {showCallModal && selectedPatientForCall && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCallModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Phone className="text-purple-600" size={24} />
                                Call Patient
                            </h3>
                            <button
                                onClick={() => setShowCallModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Patient Name</label>
                                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedPatientForCall.name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Phone Number</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-2xl font-bold text-purple-600">{selectedPatientForCall.phone}</p>
                                    {selectedPatientForCall.phone !== 'No phone number' && (
                                        <a
                                            href={`tel:${selectedPatientForCall.phone}`}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 transition-colors"
                                        >
                                            <Phone size={16} />
                                            Call Now
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowCallModal(false)}
                            className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* Voice Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSettingsModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Settings className="text-gray-600" size={24} />
                                Voice Settings
                            </h3>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">ElevenLabs API Key</label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Enter your API key for high-quality AI voice announcements.
                                    Leave empty to use browser voice.
                                </p>
                                <input
                                    type="password"
                                    value={elevenLabsKey}
                                    onChange={(e) => setElevenLabsKey(e.target.value)}
                                    placeholder="sk_..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {elevenLabsKey && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Voice Selection</label>
                                    <select
                                        value={selectedVoice}
                                        onChange={(e) => setSelectedVoice(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Default (Rachel)</option>
                                        {voices.map((voice: any) => (
                                            <option key={voice.voice_id} value={voice.voice_id}>
                                                {voice.name} ({voice.labels?.accent || 'General'})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Tip: To get Indian voices, go to <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noopener noreferrer" className="underline font-medium">ElevenLabs Voice Library</a>, filter by "Indian", and click "Add to VoiceLab". Then refresh this page.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.setItem('eleven_labs_api_key', elevenLabsKey);
                                    if (selectedVoice) {
                                        localStorage.setItem('eleven_labs_voice_id', selectedVoice);
                                    } else {
                                        localStorage.removeItem('eleven_labs_voice_id');
                                    }
                                    setShowSettingsModal(false);
                                    toast.success('Voice settings saved');
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OPDQueueManager;
