import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import { logger } from '../../utils/logger';

interface VitalsRecordingModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    queueId?: string; // Optional: if linking to a queue entry
    onSuccess?: () => void;
}

const VitalsRecordingModal: React.FC<VitalsRecordingModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    queueId,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        blood_pressure: '',
        pulse: '',
        temperature: '',
        weight: '',
        height: '',
        spo2: '',
        respiratory_rate: '',
        bmi: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            // Reset form or fetch latest vitals?
            // For now, clean slate for new reading
            setFormData({
                blood_pressure: '',
                pulse: '',
                temperature: '',
                weight: '',
                height: '',
                spo2: '',
                respiratory_rate: '',
                bmi: '',
                notes: ''
            });
        }
    }, [isOpen]);

    const calculateBMI = (weight: number, height: number) => {
        if (weight > 0 && height > 0) {
            // Height usually in cm, convert to meters
            const heightM = height / 100;
            const bmi = weight / (heightM * heightM);
            return bmi.toFixed(1);
        }
        return '';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate BMI if weight or height changes
            if (name === 'weight' || name === 'height') {
                const w = name === 'weight' ? parseFloat(value) : parseFloat(prev.weight);
                const h = name === 'height' ? parseFloat(value) : parseFloat(prev.height);
                if (!isNaN(w) && !isNaN(h)) {
                    newData.bmi = calculateBMI(w, h);
                }
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await HospitalService.getCurrentUser();

            const vitalsData = {
                patient_id: patientId,
                queue_id: queueId,
                // Convert strings to numbers where appropriate
                blood_pressure: formData.blood_pressure,
                pulse: formData.pulse ? parseInt(formData.pulse) : null,
                temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                spo2: formData.spo2 ? parseInt(formData.spo2) : null,
                respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
                bmi: formData.bmi ? parseFloat(formData.bmi) : null,
                notes: formData.notes,
                recorded_by: user?.id
            };

            await HospitalService.recordVitals(vitalsData);
            toast.success('Vitals recorded successfully');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving vitals:', error);
            toast.error('Failed to save vitals');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Record Vitals</h2>
                        <p className="text-sm text-gray-600">Patient: <span className="font-semibold">{patientName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* BP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                            <input
                                type="text"
                                name="blood_pressure"
                                value={formData.blood_pressure}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 120/80"
                            />
                        </div>

                        {/* Pulse */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (bpm)</label>
                            <input
                                type="number"
                                name="pulse"
                                value={formData.pulse}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 72"
                            />
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="temperature"
                                value={formData.temperature}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 98.6"
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 70.5"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 175"
                            />
                        </div>

                        {/* BMI (Read only mostly) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                            <input
                                type="number"
                                name="bmi"
                                value={formData.bmi}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                placeholder="Auto-calculated"
                            />
                        </div>

                        {/* SPO2 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SPO2 (%)</label>
                            <input
                                type="number"
                                name="spo2"
                                value={formData.spo2}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 99"
                            />
                        </div>

                        {/* Respiratory Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                            <input
                                type="number"
                                name="respiratory_rate"
                                value={formData.respiratory_rate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 16"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Complaints</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Any additional observations..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Vitals'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VitalsRecordingModal;
