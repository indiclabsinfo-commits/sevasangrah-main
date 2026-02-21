// Medical Certificate Generator Component
// Feature #13: Medical certificate generation
// Connected to Express.js backend for DB storage + PDF generation

import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Copy, Check, AlertCircle, Calendar, User, Stethoscope, Building } from 'lucide-react';
import api from '../services/apiService';

interface CertificateTemplate {
  id: string;
  template_name: string;
  template_type: 'sick_leave' | 'fitness' | 'disability' | 'other';
  content: string;
  variables: string[];
}

interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  address?: string;
  phone?: string;
}

interface DoctorInfo {
  id: string;
  name: string;
  registration?: string;
  specialization?: string;
}

interface MedicalCertificateGeneratorProps {
  patient: PatientInfo;
  doctor: DoctorInfo;
  diagnosis?: string;
  diagnosisCodes?: string[];
  onCertificateGenerated?: (certificateData: any) => void;
}

const MedicalCertificateGenerator: React.FC<MedicalCertificateGeneratorProps> = ({
  patient,
  doctor,
  diagnosis = '',
  diagnosisCodes = [],
  onCertificateGenerated
}) => {
  // Certificate state
  const [certificateType, setCertificateType] = useState<'sick_leave' | 'fitness' | 'disability'>('sick_leave');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [restrictions, setRestrictions] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('medical leave');
  const [disabilityPercentage, setDisabilityPercentage] = useState<number>(0);
  const [natureOfDisability, setNatureOfDisability] = useState<string>('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<string>('');
  const [certificateNumber, setCertificateNumber] = useState<string>('');
  const [savedCertificateId, setSavedCertificateId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Calculate end date based on duration
  useEffect(() => {
    if (startDate && durationDays > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + durationDays - 1);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, durationDays]);

  // Mock templates (in production, fetch from API)
  const templates: CertificateTemplate[] = [
    {
      id: '1',
      template_name: 'Standard Sick Leave Certificate',
      template_type: 'sick_leave',
      content: `MEDICAL CERTIFICATE

This is to certify that Mr./Ms. {patient_name}, {age} years, {gender}, 
resident of {address}, was examined by me on {examination_date}.

Diagnosis: {diagnosis}
ICD-10 Code(s): {diagnosis_codes}

The patient is suffering from {diagnosis_lower} and requires rest 
and medical treatment for a period of {duration_days} day(s) 
from {start_date} to {end_date}.

During this period, the patient is advised complete rest and 
should avoid strenuous activities.

Recommendations: {recommendations}

This certificate is issued for the purpose of {purpose}.

Doctor's Name: {doctor_name}
Doctor's Registration: {doctor_registration}
Hospital: {hospital_name}
Hospital Address: {hospital_address}
Certificate Number: {certificate_number}
Date of Issue: {issued_date}

Signature: ____________________
Stamp:`,
      variables: ['patient_name', 'age', 'gender', 'address', 'examination_date', 'diagnosis', 'diagnosis_codes', 'diagnosis_lower', 'duration_days', 'start_date', 'end_date', 'recommendations', 'purpose', 'doctor_name', 'doctor_registration', 'hospital_name', 'hospital_address', 'certificate_number', 'issued_date']
    },
    {
      id: '2',
      template_name: 'Fitness Certificate',
      template_type: 'fitness',
      content: `FITNESS CERTIFICATE

This is to certify that I have examined Mr./Ms. {patient_name}, 
{age} years, {gender}, on {examination_date}.

After thorough medical examination and review of medical history, 
I find the patient to be in good health and physically fit.

The patient is medically fit for:
{purpose}

No restrictions apply at this time.

Additional Notes: {additional_notes}

Doctor's Name: {doctor_name}
Doctor's Registration: {doctor_registration}
Hospital: {hospital_name}
Hospital Address: {hospital_address}
Certificate Number: {certificate_number}
Date of Issue: {issued_date}

Signature: ____________________
Stamp:`,
      variables: ['patient_name', 'age', 'gender', 'examination_date', 'purpose', 'additional_notes', 'doctor_name', 'doctor_registration', 'hospital_name', 'hospital_address', 'certificate_number', 'issued_date']
    },
    {
      id: '3',
      template_name: 'Disability Certificate',
      template_type: 'disability',
      content: `DISABILITY CERTIFICATE

This is to certify that I have examined Mr./Ms. {patient_name}, 
{age} years, {gender}, on {examination_date}.

Diagnosis: {diagnosis}
ICD-10 Code(s): {diagnosis_codes}

After thorough examination and assessment, the patient has been 
found to have {disability_percentage}% disability.

Nature of Disability: {nature_of_disability}
Duration: {duration} (from {start_date} to {end_date})

Restrictions: {restrictions}
Recommendations: {recommendations}

This certificate is issued for the purpose of availing benefits 
under the Rights of Persons with Disabilities Act, 2016.

Doctor's Name: {doctor_name}
Doctor's Registration: {doctor_registration}
Specialization: {doctor_specialization}
Hospital: {hospital_name}
Hospital Address: {hospital_address}
Certificate Number: {certificate_number}
Date of Issue: {issued_date}

Signature: ____________________
Stamp:`,
      variables: ['patient_name', 'age', 'gender', 'examination_date', 'diagnosis', 'diagnosis_codes', 'disability_percentage', 'nature_of_disability', 'duration', 'start_date', 'end_date', 'restrictions', 'recommendations', 'doctor_name', 'doctor_registration', 'doctor_specialization', 'hospital_name', 'hospital_address', 'certificate_number', 'issued_date']
    }
  ];

  // Get current template
  const currentTemplate = templates.find(t => t.template_type === certificateType) || templates[0];

  // Generate certificate number
  const generateCertNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MC-${year}-${month}-${random}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Generate certificate content and save to backend
  const generateCertificate = async () => {
    setLoading(true);

    // Generate certificate number (used as fallback if backend doesn't provide one)
    const certNumber = generateCertNumber();

    // Prepare variables for template
    const templateVars: Record<string, string> = {
      patient_name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      address: patient.address || 'Address not specified',
      examination_date: formatDate(new Date().toISOString()),
      diagnosis: diagnosis || 'Not specified',
      diagnosis_codes: diagnosisCodes.join(', ') || 'Not specified',
      diagnosis_lower: (diagnosis || '').toLowerCase(),
      duration_days: durationDays.toString(),
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      duration: `${durationDays} day${durationDays !== 1 ? 's' : ''}`,
      restrictions: restrictions || 'None',
      recommendations: recommendations || 'As per medical advice',
      additional_notes: additionalNotes || 'None',
      purpose: purpose,
      disability_percentage: disabilityPercentage.toString(),
      nature_of_disability: natureOfDisability || 'Not specified',
      doctor_name: doctor.name,
      doctor_registration: doctor.registration || 'Not specified',
      doctor_specialization: doctor.specialization || 'General Physician',
      hospital_name: 'Magnus Hospital',
      hospital_address: 'Hospital Address, City, State - PIN',
      certificate_number: certNumber,
      issued_date: formatDate(new Date().toISOString())
    };

    // Replace variables in template for preview
    let certificateContent = currentTemplate.content;
    Object.entries(templateVars).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      certificateContent = certificateContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    // Try to save to backend
    let savedCertNumber = certNumber;
    let savedId: string | null = null;
    try {
      const result = await api.certificates.create({
        certificate_number: certNumber,
        patient_id: patient.id,
        doctor_id: doctor.id,
        certificate_type: certificateType,
        diagnosis,
        diagnosis_codes: diagnosisCodes,
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        restrictions: restrictions || null,
        recommendations: recommendations || null,
        additional_notes: additionalNotes || null,
        purpose,
        disability_percentage: certificateType === 'disability' ? disabilityPercentage : null,
        nature_of_disability: certificateType === 'disability' ? natureOfDisability : null,
      });
      savedCertNumber = result?.certificate_number || certNumber;
      savedId = result?.id || null;
    } catch (err) {
      console.warn('Backend not available for certificate save, using local generation:', err);
    }

    setCertificateNumber(savedCertNumber);
    setSavedCertificateId(savedId);
    setGeneratedCertificate(certificateContent);
    setLoading(false);

    // Callback with certificate data
    if (onCertificateGenerated) {
      onCertificateGenerated({
        id: savedId,
        certificateNumber: savedCertNumber,
        certificateType,
        content: certificateContent,
        patient,
        doctor,
        diagnosis,
        durationDays,
        startDate,
        endDate,
        issuedDate: new Date().toISOString()
      });
    }
  };

  // Download as PDF (from backend) or text (fallback)
  const downloadCertificate = () => {
    if (!generatedCertificate) return;

    // If saved to backend, download real PDF
    if (savedCertificateId) {
      const pdfUrl = api.certificates.getPdfUrl(savedCertificateId);
      window.open(pdfUrl, '_blank');
      return;
    }

    // Fallback: download as text file
    const blob = new Blob([generatedCertificate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Certificate_${certificateNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCertificate)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  // Print certificate
  const printCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Medical Certificate - ${certificateNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              .certificate { border: 2px solid #000; padding: 30px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { white-space: pre-line; }
              .signature { margin-top: 50px; text-align: right; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="certificate">
              <div class="content">${generatedCertificate.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()">Print</button>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Reset form
  const resetForm = () => {
    setCertificateType('sick_leave');
    setDurationDays(1);
    setStartDate(new Date().toISOString().split('T')[0]);
    setRestrictions('');
    setRecommendations('');
    setAdditionalNotes('');
    setPurpose('medical leave');
    setDisabilityPercentage(0);
    setNatureOfDisability('');
    setGeneratedCertificate('');
    setCertificateNumber('');
    setSavedCertificateId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Medical Certificate Generator</h2>
            <p className="text-sm text-gray-600">Generate official medical certificates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User size={16} />
          <span>{patient.name}</span>
          <Stethoscope size={16} className="ml-2" />
          <span>{doctor.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Certificate Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Certificate Type Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3">Certificate Type</h3>
            <div className="grid grid-cols-3 gap-3">
              {['sick_leave', 'fitness', 'disability'].map((type) => (
                <button
                  key={type}
                  onClick={() => setCertificateType(type as any)}
                  className={`p-3 rounded-lg border transition-colors ${
                    certificateType === type
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium capitalize">{type.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {type === 'sick_leave' && 'For work/school leave'}
                    {type === 'fitness' && 'Medical fitness proof'}
                    {type === 'disability' && 'Disability certification'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-700">Certificate Details</h3>
            
            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis *
              </label>
              <textarea
                value={diagnosis}
                onChange={(e) => {}}
                placeholder="Enter diagnosis..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                rows={2}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Diagnosis from consultation will be used automatically
              </p>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* End Date Display */}
            {endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Certificate valid from <strong>{formatDate(startDate)}</strong> to <strong>{formatDate(endDate)}</strong>
                    ({durationDays} day{durationDays !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )}

            {/* Additional Fields based on certificate type */}
            {certificateType === 'sick_leave' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restrictions
                  </label>
                  <textarea
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="Specify any work/school restrictions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendations
                  </label>
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Medical recommendations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Certificate
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., medical leave, insurance claim..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}

            {certificateType === 'fitness' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Fitness Certificate
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., employment, sports participation, travel..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any additional notes or observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
              </>
            )}

            {certificateType === 'disability' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disability Percentage *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        value={disabilityPercentage}
                        onChange={(e) => setDisabilityPercentage(parseInt(e.target.value))}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="w-16 text-center font-medium">
                        {disabilityPercentage}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nature of Disability
                    </label>
                    <input
                      type="text"
                      value={natureOfDisability}
                      onChange={(e) => setNatureOfDisability(e.target.value)}
                      placeholder="e.g., physical, visual, hearing..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restrictions
                  </label>
                  <textarea
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="Specify restrictions due to disability..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendations
                  </label>
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Recommendations for support and accommodations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={generateCertificate}
              disabled={loading || !diagnosis}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Generate Certificate
                </>
              )}
            </button>
            
            <button
              onClick={resetForm}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Column - Preview & Actions */}
        <div className="space-y-6">
          {/* Preview Toggle */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Certificate Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            
            {showPreview && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">
                  Template: {currentTemplate.template_name}
                </div>
                <div className="bg-gray-50 border border-gray-300 rounded p-3 max-h-60 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {currentTemplate.content.substring(0, 200)}...
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Generated Certificate Actions */}
          {generatedCertificate && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-700">Certificate Ready</h3>
                <div className="text-sm font-mono text-blue-600">
                  {certificateNumber}
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={downloadCertificate}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={18} />
                  {savedCertificateId ? 'Download PDF' : 'Download as Text'}
                </button>
                
                <button
                  onClick={printCertificate}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer size={18} />
                  Print Certificate
                </button>
                
                <button
                  onClick={copyToClipboard}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
              
              <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium">Legal Note:</span>
                    <p className="mt-1">
                      This is an official medical certificate. Keep it secure.
                      Certificate can be verified using the certificate number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Certificate Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Patient:</span>
                <span className="font-medium">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Doctor:</span>
                <span className="font-medium">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Type:</span>
                <span className="font-medium capitalize">{certificateType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Duration:</span>
                <span className="font-medium">{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
              </div>
              {certificateNumber && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Certificate #:</span>
                  <span className="font-medium font-mono">{certificateNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Preview (Full) */}
      {generatedCertificate && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Certificate Preview</h3>
            <div className="text-sm text-gray-500">
              Certificate #: <span className="font-mono font-bold">{certificateNumber}</span>
            </div>
          </div>
          
          <div className="border-2 border-gray-800 p-6 rounded-lg">
            <pre className="whitespace-pre-wrap font-serif text-gray-900 leading-relaxed">
              {generatedCertificate}
            </pre>
            
            <div className="mt-8 pt-6 border-t border-gray-300 text-center">
              <div className="inline-block text-center">
                <div className="mb-2">____________________</div>
                <div className="text-sm font-medium">Doctor's Signature</div>
                <div className="text-xs text-gray-500 mt-1">{doctor.name}</div>
                <div className="text-xs text-gray-500">{doctor.registration || 'Medical Registration Number'}</div>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <Building size={12} />
                  <span>Magnus Hospital | Hospital Address, City, State - PIN</span>
                </div>
                <div className="mt-1">Phone: +91-XXXXXXXXXX | Email: info@magnushospital.com</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalCertificateGenerator;