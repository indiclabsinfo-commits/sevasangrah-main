import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, AlertCircle, User, Phone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseHospitalService } from '../../services/supabaseHospitalService';
import type { Patient } from '../../services/supabaseHospitalService';

interface WalkInQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    doctors: Doctor[];
}

const WalkInQueueModal: React.FC<WalkInQueueModalProps> = ({ isOpen, onClose, onSuccess, doctors }) => {
    const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

    // Existing Patient State
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundPatients, setFoundPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // New Patient State
    const [newPatient, setNewPatient] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        age: '',
        gender: 'Male'
    });

    // Common State
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setSearchTerm('');
            setFoundPatients([]);
            setSelectedPatient(null);
            setSelectedDoctor('');
            setNotes('');
            setSearchError('');
            setNewPatient({ first_name: '', last_name: '', phone: '', age: '', gender: 'Male' });
            setActiveTab('existing');
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setSearching(true);
        setSearchError('');
        setSelectedPatient(null);

        try {
            // Search by name (if text) or phone (if digits)
            const patients = await SupabaseHospitalService.searchPatients(searchTerm.trim());

            if (patients && patients.length > 0) {
                setFoundPatients(patients);
            } else {
                setFoundPatients([]);
                setSearchError('No patients found. Please add a new patient.');
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchError('Error searching for patient.');
        } finally {
            setSearching(false);
        }
    };

    const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewPatient({ ...newPatient, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!selectedDoctor) {
            toast.error('Please select a doctor');
            return;
        }

        let patientId = selectedPatient?.id;

        setIsSubmitting(true);
        try {
            // If creating new patient
            if (activeTab === 'new') {
                if (!newPatient.first_name || !newPatient.last_name || !newPatient.phone || !newPatient.age) {
                    toast.error('Please fill all required patient details');
                    setIsSubmitting(false);
                    return;
                }

                const createdPatient = await SupabaseHospitalService.createPatient({
                    ...newPatient,
                    age: parseInt(newPatient.age),
                    email: '', // Optional
                    address: '', // Optional
                    medical_history: [],
                    is_active: true
                });

                if (!createdPatient) throw new Error('Failed to create patient');
                patientId = createdPatient.id;
            }

            if (!patientId) {
                toast.error('No patient selected or created');
                setIsSubmitting(false);
                return;
            }

            // Add to Queue
            await SupabaseHospitalService.addToOPDQueue({
                patient_id: patientId,
                doctor_id: selectedDoctor,
                priority: 'normal',
                notes: notes || 'Walk-in Visit'
            });

            toast.success('Added to queue successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Queue add error:', error);
            toast.error(error.message || 'Failed to add to queue');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Add Walk-in Visitor</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex mb-6 border-b">
                    <button
                        className={`flex-1 pb-2 text-center font-medium ${activeTab === 'existing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('existing')}
                    >
                        Existing Patient
                    </button>
                    <button
                        className={`flex-1 pb-2 text-center font-medium ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        New Patient
                    </button>
                </div>

                {activeTab === 'existing' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1.5 px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-200"
                            >
                                Search
                            </button>
                        </div>

                        {searching && <div className="text-center py-2 text-gray-500">Searching...</div>}

                        {searchError && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                                <AlertCircle size={16} />
                                {searchError}
                            </div>
                        )}

                        {foundPatients.length > 0 && (
                            <div className="max-h-60 overflow-y-auto border rounded-md">
                                {foundPatients.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPatient(p)}
                                        className={`p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0 ${selectedPatient?.id === p.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900">{p.first_name} {p.last_name}</div>
                                            <div className="text-xs text-gray-500">{p.phone} • {p.gender} • {p.age}y</div>
                                        </div>
                                        {selectedPatient?.id === p.id && <CheckCircle size={16} className="text-blue-600" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'new' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    required
                                    className="w-full border rounded-md p-2"
                                    value={newPatient.first_name}
                                    onChange={handleNewPatientChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    required
                                    className="w-full border rounded-md p-2"
                                    value={newPatient.last_name}
                                    onChange={handleNewPatientChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    className="w-full border rounded-md p-2"
                                    value={newPatient.phone}
                                    onChange={handleNewPatientChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                                <input
                                    type="number"
                                    name="age"
                                    required
                                    className="w-full border rounded-md p-2"
                                    value={newPatient.age}
                                    onChange={handleNewPatientChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                name="gender"
                                className="w-full border rounded-md p-2"
                                value={newPatient.gender}
                                onChange={handleNewPatientChange}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor *</label>
                        <select
                            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                        >
                            <option value="">-- Choose Doctor --</option>
                            {doctors.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>{doc.name || `Dr. ${doc.first_name} ${doc.last_name}`} - {doc.specialization || doc.department || 'General'}</option>
                            ))}
                        </select>
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
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Processing...' : 'Add to Queue'}
                    </button>

                    {activeTab === 'existing' && !foundPatients.length && !searching && (
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Can't find the patient? Switch to the "New Patient" tab.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalkInQueueModal;
