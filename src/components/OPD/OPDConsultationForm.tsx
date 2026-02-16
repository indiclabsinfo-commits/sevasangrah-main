import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    X,
    Save,
    FileText,
    Stethoscope,
    Activity,
    Calendar,
    Search,
    Plus,
    Trash2,
    CheckCircle
} from 'lucide-react';
import opdService, { type CreateConsultationData } from '../../services/opdService';
import ChiefComplaints from '../ChiefComplaints';
import ICD10Lookup from '../ICD10Lookup';
import ExaminationTemplates from '../ExaminationTemplates';
import { logger } from '../../utils/logger';

interface OPDConsultationFormProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    queueId?: string;
    onSuccess?: (consultationId: string) => void;
}

const OPDConsultationForm: React.FC<OPDConsultationFormProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    doctorId,
    doctorName,
    queueId,
    onSuccess
}) => {
    // Form state
    const [formData, setFormData] = useState<CreateConsultationData>({
        patient_id: patientId,
        doctor_id: doctorId,
        queue_id: queueId,
        chief_complaints: '',
        examination_findings: '',
        diagnosis: '',
        diagnosis_codes: [],
        treatment_plan: '',
        follow_up_date: '',
        follow_up_notes: ''
    });

    // Chief complaints state (structured)
    const [chiefComplaints, setChiefComplaints] = useState<any[]>([]);

    // Examination findings state
    const [examinationFindings, setExaminationFindings] = useState<any>(null);
    const [showExaminationTemplates, setShowExaminationTemplates] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [latestVitals, setLatestVitals] = useState<any>(null);
    const [patientHistory, setPatientHistory] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);

    // ICD-10 state (handled by ICD10Lookup component)

    // Load patient vitals and history on mount
    useEffect(() => {
        if (isOpen) {
            loadPatientData();
        }
    }, [isOpen, patientId]);

    const loadPatientData = async () => {
        try {
            // Load latest vitals
            const vitals = await opdService.getLatestVitals(patientId);
            setLatestVitals(vitals);

            // Load patient history
            const history = await opdService.getPatientHistory(patientId);
            setPatientHistory(history);

            logger.log('✅ Patient data loaded:', { vitals, history });
        } catch (error) {
            logger.error('❌ Error loading patient data:', error);
        }
    };

    // ICD-10 functions handled by ICD10Lookup component

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (chiefComplaints.length === 0) {
            toast.error('Please add at least one chief complaint');
            return;
        }

        if (!formData.diagnosis.trim()) {
            toast.error('Please enter diagnosis');
            return;
        }

        try {
            setLoading(true);

            // Create consultation
            const consultation = await opdService.createConsultation(formData);

            toast.success('Consultation recorded successfully!');
            logger.log('✅ Consultation created:', consultation);

            // Call success callback
            if (onSuccess) {
                onSuccess(consultation.id);
            }

            // Close modal
            onClose();
        } catch (error: any) {
            logger.error('❌ Error creating consultation:', error);
            toast.error('Failed to record consultation: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndPrescribe = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (chiefComplaints.length === 0 || !formData.diagnosis.trim()) {
            toast.error('Please add chief complaints and diagnosis');
            return;
        }

        try {
            setLoading(true);

            // Create consultation
            const consultation = await opdService.createConsultation(formData);

            toast.success('Consultation saved! Opening prescription...');
            logger.log('✅ Consultation created, opening prescription:', consultation);

            // TODO: Open prescription modal/page with consultation data
            // For now, just call success callback
            if (onSuccess) {
                onSuccess(consultation.id);
            }

            onClose();
        } catch (error: any) {
            logger.error('❌ Error creating consultation:', error);
            toast.error('Failed to save consultation: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Stethoscope size={28} />
                            OPD Consultation
                        </h2>
                        <p className="text-blue-100 mt-1">
                            Patient: <span className="font-semibold">{patientName}</span> |
                            Doctor: <span className="font-semibold">{doctorName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-800 p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Latest Vitals Display */}
                        {latestVitals && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <Activity size={18} />
                                    Latest Vitals
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    {latestVitals.blood_pressure && (
                                        <div>
                                            <span className="text-gray-600">BP:</span>
                                            <span className="ml-2 font-semibold">{latestVitals.blood_pressure}</span>
                                        </div>
                                    )}
                                    {latestVitals.temperature && (
                                        <div>
                                            <span className="text-gray-600">Temp:</span>
                                            <span className="ml-2 font-semibold">{latestVitals.temperature}°F</span>
                                        </div>
                                    )}
                                    {latestVitals.pulse && (
                                        <div>
                                            <span className="text-gray-600">Pulse:</span>
                                            <span className="ml-2 font-semibold">{latestVitals.pulse} bpm</span>
                                        </div>
                                    )}
                                    {latestVitals.spo2 && (
                                        <div>
                                            <span className="text-gray-600">SpO2:</span>
                                            <span className="ml-2 font-semibold">{latestVitals.spo2}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Patient History Toggle */}
                        {patientHistory && patientHistory.consultations.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">
                                        📋 Previous Consultations ({patientHistory.consultations.length})
                                    </span>
                                    <span className="text-gray-500">{showHistory ? '▼' : '▶'}</span>
                                </div>
                            </button>
                        )}

                        {/* Patient History Display */}
                        {showHistory && patientHistory && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                                {patientHistory.consultations.slice(0, 3).map((consultation: any, index: number) => (
                                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-xs text-gray-500 mb-1">
                                            {new Date(consultation.consultation_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm">
                                            <strong>Diagnosis:</strong> {consultation.diagnosis}
                                        </div>
                                        {consultation.treatment_plan && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                <strong>Treatment:</strong> {consultation.treatment_plan}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Chief Complaints */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Chief Complaints <span className="text-red-500">*</span>
                            </label>
                            <ChiefComplaints
                                patientId={patientId}
                                onComplaintsChange={(complaints) => {
                                    setChiefComplaints(complaints);
                                    // Convert structured complaints to text for backward compatibility
                                    const complaintsText = complaints.map(c => 
                                        `${c.complaint} (${c.duration}, ${c.severity})${c.body_part ? ` - ${c.body_part}` : ''}${c.notes ? ` - ${c.notes}` : ''}`
                                    ).join('; ');
                                    setFormData({ ...formData, chief_complaints: complaintsText });
                                }}
                            />
                        </div>

                        {/* Examination Findings */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Examination Findings
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowExaminationTemplates(!showExaminationTemplates)}
                                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                                >
                                    <Stethoscope size={14} />
                                    {showExaminationTemplates ? 'Hide Templates' : 'Use Template'}
                                </button>
                            </div>
                            
                            {showExaminationTemplates ? (
                                <div className="mb-4">
                                    <ExaminationTemplates
                                        patientId={patientId}
                                        consultationId={undefined} // Will be set after consultation creation
                                        mode="selector"
                                        onSelectTemplate={(template) => {
                                            // Auto-fill with template structure
                                            setFormData(prev => ({
                                                ...prev,
                                                examination_findings: `Using template: ${template.template_name}\n\n`
                                            }));
                                        }}
                                        onSaveFindings={(findings) => {
                                            setExaminationFindings(findings);
                                            setFormData(prev => ({
                                                ...prev,
                                                examination_findings: `Structured examination recorded. See examination_findings table for details.\n\n${prev.examination_findings}`
                                            }));
                                            setShowExaminationTemplates(false);
                                            toast.success('Examination findings saved!');
                                        }}
                                    />
                                </div>
                            ) : null}
                            
                            <textarea
                                value={formData.examination_findings}
                                onChange={(e) => setFormData({ ...formData, examination_findings: e.target.value })}
                                placeholder="Enter examination findings... (or use template above)"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Diagnosis */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Diagnosis <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.diagnosis}
                                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                placeholder="Enter diagnosis..."
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* ICD-10 Diagnosis Codes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ICD-10 Diagnosis Codes
                            </label>
                            <ICD10Lookup
                                onSelectCode={(code) => {
                                    const newCode = `${code.code} - ${code.description}`;
                                    if (!formData.diagnosis_codes?.includes(newCode)) {
                                        setFormData({
                                            ...formData,
                                            diagnosis_codes: [...(formData.diagnosis_codes || []), newCode]
                                        });
                                    }
                                }}
                                selectedCodes={[]} // We'll handle this differently
                                onRemoveCode={(codeToRemove) => {
                                    setFormData({
                                        ...formData,
                                        diagnosis_codes: formData.diagnosis_codes?.filter(code => 
                                            !code.startsWith(codeToRemove)
                                        ) || []
                                    });
                                }}
                            />
                            
                            {/* Display selected codes */}
                            {formData.diagnosis_codes && formData.diagnosis_codes.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {formData.diagnosis_codes.map((code, index) => (
                                        <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                                            <span className="text-sm text-blue-900">{code}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        diagnosis_codes: formData.diagnosis_codes?.filter((_, i) => i !== index) || []
                                                    });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Treatment Plan */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Treatment Plan
                            </label>
                            <textarea
                                value={formData.treatment_plan}
                                onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                                placeholder="Enter treatment plan and recommendations..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Follow-up Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Follow-up Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.follow_up_date}
                                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Follow-up Notes
                                </label>
                                <input
                                    type="text"
                                    value={formData.follow_up_notes}
                                    onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value })}
                                    placeholder="Follow-up instructions..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Consultation
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAndPrescribe}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <FileText size={18} />
                            Save & Prescribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OPDConsultationForm;
