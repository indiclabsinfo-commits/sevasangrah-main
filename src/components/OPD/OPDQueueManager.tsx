import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import { logger } from '../../utils/logger';
import type { User, OPDQueue } from '../../config/supabaseNew';
import VitalsRecordingModal from './VitalsRecordingModal';
import WalkInQueueModal from './WalkInQueueModal';

const OPDQueueManager: React.FC = () => {
    const [queues, setQueues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Vitals Modal State
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<{ id: string, name: string, queueId: string } | null>(null);

    // Walk-in Modal State
    const [showWalkInModal, setShowWalkInModal] = useState(false);

    useEffect(() => {
        loadDoctors();
        loadQueues();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadQueues, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDoctors = async () => {
        try {
            const docs = await HospitalService.getDoctors();
            setDoctors(docs);
        } catch (error) {
            console.error('Failed to load doctors', error);
        }
    };

    const loadQueues = async () => {
        try {
            setLoading(true);
            const data = await HospitalService.getOPDQueues(
                statusFilter !== 'all' ? statusFilter : undefined,
                selectedDoctor || undefined
            );
            setQueues(data);
        } catch (error) {
            console.error('Failed to load queues', error);
            toast.error('Failed to load queue data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (queueId: string, newStatus: string) => {
        try {
            await HospitalService.updateQueueStatus(queueId, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            loadQueues();
        } catch (error) {
            toast.error('Failed to update status');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'VITALS_DONE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'IN_CONSULTATION': return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">🏥 OPD Queue Live Status</h2>
                    <p className="text-sm text-gray-500">Real-time patient flow monitoring</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowWalkInModal(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Add Walk-in
                    </button>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => { setSelectedDoctor(e.target.value); loadQueues(); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Doctors</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>Dr. {doc.first_name} {doc.last_name}</option>
                        ))}
                    </select>
                    <button
                        onClick={loadQueues}
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Queue Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && queues.length === 0 ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : queues.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p>No patients in queue currently</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {queues.map((item) => (
                            <div
                                key={item.id}
                                className={`p-4 rounded-lg border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow relative ${item.priority ? 'border-l-red-500' : 'border-l-blue-500'
                                    }`}
                            >
                                {item.priority && (
                                    <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                        EMERGENCY / VIP
                                    </span>
                                )}

                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        {/* Token Number */}
                                        <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-16 h-16 shrink-0">
                                            <span className="text-xs text-gray-500 font-bold uppercase">Token</span>
                                            <span className="text-2xl font-bold text-gray-800">{item.token_number}</span>
                                        </div>

                                        {/* Patient Info */}
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                {item.first_name} {item.last_name}
                                            </h3>
                                            <div className="text-sm text-gray-600 flex flex-wrap gap-x-3">
                                                <span>{item.age} yrs / {item.gender}</span>
                                                <span>•</span>
                                                <span>{item.patient_code}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Doctor: <span className="font-medium text-blue-600">
                                                    {item.doctor_name ? `Dr. ${item.doctor_name} ${item.doctor_last_name || ''}` : 'Unassigned'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions & Status */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>

                                        <div className="flex gap-2 mt-2">
                                            {item.status === 'WAITING' && (
                                                <button
                                                    onClick={() => openVitalsModal(item, item.id)}
                                                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md hover:bg-blue-100 border border-blue-200"
                                                >
                                                    Record Vitals
                                                </button>
                                            )}

                                            {item.status === 'VITALS_DONE' && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'IN_CONSULTATION')}
                                                    className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-md hover:bg-green-100 border border-green-200"
                                                >
                                                    Start Consult
                                                </button>
                                            )}

                                            {item.status === 'IN_CONSULTATION' && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 border border-gray-300"
                                                >
                                                    Complete
                                                </button>
                                            )}

                                            {/* Cancel Button */}
                                            {(item.status === 'WAITING' || item.status === 'VITALS_DONE') && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Remove from queue?')) handleStatusChange(item.id, 'CANCELLED');
                                                    }}
                                                    className="px-2 py-1 text-red-400 hover:text-red-600 text-sm"
                                                    title="Cancel"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Vitals Modal */}
            {selectedPatientForVitals && (
                <VitalsRecordingModal
                    isOpen={showVitalsModal}
                    onClose={() => setShowVitalsModal(false)}
                    patientId={selectedPatientForVitals.id} // This needs to be the actual UUID for the table
                    patientName={selectedPatientForVitals.name}
                    queueId={selectedPatientForVitals.queueId}
                    onSuccess={() => {
                        loadQueues();
                        setShowVitalsModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default OPDQueueManager;
