import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User as Doctor, PatientWithRelations } from '../../config/supabaseNew';

interface AddToQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    patient: PatientWithRelations | null;
    doctors: any[]; // Using any[] to be safe with mixed User/Doctor types from different contexts
}

const AddToQueueModal: React.FC<AddToQueueModalProps> = ({ isOpen, onClose, onSuccess, patient, doctors }) => {
    // Debug doctors data
    React.useEffect(() => {
        if (isOpen) {
            console.log('🏥 AddToQueueModal Docs:', doctors);
        }
    }, [isOpen, doctors]);

    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!patient || !selectedDoctor) {
            toast.error('Please select a doctor');
            console.error('Missing data for queue add:', { patient, selectedDoctor });
            return;
        }

        setIsSubmitting(true);
        const payload = {
            patient_id: patient.id,
            doctor_id: selectedDoctor,
            appointment_id: undefined,
            priority: false,
            notes: notes || 'Direct Add from List'
        };
        console.log('🚀 Sending AddToQueue Payload:', payload);

        try {
            await SupabaseHospitalService.addToOPDQueue(payload);

            toast.success('Added to queue successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('❌ Queue add error:', error);
            if (error.response) {
                console.error('❌ Server Error Details:', error.response.data);
                console.error('❌ Status Code:', error.response.status);
            }
            toast.error(error.response?.data?.error || error.message || 'Failed to add to queue');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Add to OPD Queue</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <p className="font-semibold text-blue-900">{patient.first_name} {patient.last_name}</p>
                    <p className="text-sm text-blue-700">ID: {patient.patient_id} • {patient.phone}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor *</label>
                        {doctors.length === 0 ? (
                            <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
                                No doctors found. Please ensure doctors are registered in the system.
                            </div>
                        ) : (
                            <select
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                            >
                                <option value="">-- Choose Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>Dr. {doc.first_name || doc.name} {doc.last_name} - {doc.specialization || doc.department || 'General'}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                            className="w-full border rounded-md p-2 h-20 resize-none"
                            placeholder="Reason for visit..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedDoctor}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${isSubmitting || !selectedDoctor
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Adding...' : 'Add to Queue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToQueueModal;
