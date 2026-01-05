import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, AlertCircle } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import toast from 'react-hot-toast';
import type { User, Patient } from '../../config/supabaseNew';

interface WalkInQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    doctors: User[];
}

const WalkInQueueModal: React.FC<WalkInQueueModalProps> = ({ isOpen, onClose, onSuccess, doctors }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setSearchTerm('');
            setFoundPatient(null);
            setSelectedDoctor('');
            setNotes('');
            setSearchError('');
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setSearching(true);
        setSearchError('');
        setFoundPatient(null);

        try {
            // Try to find patient by phone first, then name
            // Simple heuristic: if it looks like a phone number, search by phone
            const isPhone = /^\d+$/.test(searchTerm.trim());

            const patient = await HospitalService.findExistingPatient(
                isPhone ? searchTerm.trim() : undefined,
                !isPhone ? searchTerm.trim() : undefined
            );

            if (patient) {
                setFoundPatient(patient);
            } else {
                setSearchError('Patient not found. Please register them in "New Patient" first.');
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchError('Error searching for patient.');
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!foundPatient || !selectedDoctor) {
            toast.error('Please select a patient and a doctor');
            return;
        }

        setIsSubmitting(true);
        try {
            await HospitalService.addToOPDQueue({
                patient_id: foundPatient.id, // Use UUID based on service method requirements
                doctor_id: selectedDoctor,
                appointment_id: undefined, // Explicitly undefined for walk-in
                priority: false,
                notes: notes || 'Walk-in Visit'
            });

            toast.success('Added to queue successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Queue add error:', error);
            toast.error('Failed to add to queue');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Add Walk-in Patient</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Patient Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Phone number or First Name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={searching || !searchTerm.trim()}
                                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {searching ? '...' : <Search size={20} />}
                            </button>
                        </div>
                        {searchError && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle size={14} /> {searchError}
                            </p>
                        )}
                    </div>

                    {/* Selected Patient Display */}
                    {foundPatient && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <div className="font-semibold text-blue-800">
                                {foundPatient.first_name} {foundPatient.last_name}
                            </div>
                            <div className="text-sm text-blue-600">
                                ID: {foundPatient.patient_id} • {foundPatient.phone}
                            </div>
                        </div>
                    )}

                    {/* Doctor Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Doctor</label>
                        <select
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Doctor</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    Dr. {doc.first_name} {doc.last_name} ({doc.department || 'General'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Reason for visit..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!foundPatient || !selectedDoctor || isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <UserPlus size={18} />
                            {isSubmitting ? 'Adding...' : 'Add to Queue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalkInQueueModal;
