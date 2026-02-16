// Chief Complaints Recording Component
// Feature #7: Chief Complaints Recording

import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, AlertCircle, Plus, X, Search, Clipboard } from 'lucide-react';

interface ChiefComplaint {
  id: string;
  complaint: string;
  duration: string; // e.g., "2 days", "1 week", "3 months"
  severity: 'mild' | 'moderate' | 'severe' | 'emergency';
  body_part?: string; // Optional: affected body part
  notes?: string; // Additional notes
}

interface ChiefComplaintsProps {
  patientId?: string;
  onComplaintsChange?: (complaints: ChiefComplaint[]) => void;
  initialComplaints?: ChiefComplaint[];
  readOnly?: boolean;
}

const ChiefComplaints: React.FC<ChiefComplaintsProps> = ({
  patientId,
  onComplaintsChange,
  initialComplaints = [],
  readOnly = false
}) => {
  const [complaints, setComplaints] = useState<ChiefComplaint[]>(initialComplaints);
  const [newComplaint, setNewComplaint] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | 'emergency'>('moderate');
  const [bodyPart, setBodyPart] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Common chief complaints (based on Indian hospital data)
  const commonComplaints = [
    { text: 'Fever', category: 'General' },
    { text: 'Cough', category: 'Respiratory' },
    { text: 'Headache', category: 'Neurological' },
    { text: 'Abdominal pain', category: 'Gastrointestinal' },
    { text: 'Chest pain', category: 'Cardiac' },
    { text: 'Shortness of breath', category: 'Respiratory' },
    { text: 'Vomiting', category: 'Gastrointestinal' },
    { text: 'Diarrhea', category: 'Gastrointestinal' },
    { text: 'Body ache', category: 'Musculoskeletal' },
    { text: 'Weakness', category: 'General' },
    { text: 'Dizziness', category: 'Neurological' },
    { text: 'Back pain', category: 'Musculoskeletal' },
    { text: 'Joint pain', category: 'Musculoskeletal' },
    { text: 'Burning micturition', category: 'Urological' },
    { text: 'Rash', category: 'Dermatological' },
    { text: 'Itching', category: 'Dermatological' },
    { text: 'Loss of appetite', category: 'General' },
    { text: 'Weight loss', category: 'General' },
    { text: 'Palpitations', category: 'Cardiac' },
    { text: 'Swelling', category: 'General' }
  ];

  // Common durations
  const commonDurations = [
    'Few hours', '1 day', '2 days', '3 days', '4 days', '5 days', '6 days',
    '1 week', '2 weeks', '3 weeks', '1 month', '2 months', '3 months',
    '6 months', '1 year', 'Chronic'
  ];

  // Common body parts
  const commonBodyParts = [
    'Head', 'Neck', 'Chest', 'Abdomen', 'Back', 'Upper limb', 'Lower limb',
    'Whole body', 'Right side', 'Left side', 'Multiple sites'
  ];

  // Add new complaint
  const addComplaint = () => {
    if (!newComplaint.trim()) return;

    const complaint: ChiefComplaint = {
      id: Date.now().toString(),
      complaint: newComplaint.trim(),
      duration: duration || 'Not specified',
      severity,
      body_part: bodyPart || undefined,
      notes: notes || undefined
    };

    const updatedComplaints = [...complaints, complaint];
    setComplaints(updatedComplaints);
    
    if (onComplaintsChange) {
      onComplaintsChange(updatedComplaints);
    }

    // Reset form
    setNewComplaint('');
    setDuration('');
    setSeverity('moderate');
    setBodyPart('');
    setNotes('');
    setShowForm(false);
  };

  // Remove complaint
  const removeComplaint = (id: string) => {
    const updatedComplaints = complaints.filter(c => c.id !== id);
    setComplaints(updatedComplaints);
    
    if (onComplaintsChange) {
      onComplaintsChange(updatedComplaints);
    }
  };

  // Use common complaint
  const useCommonComplaint = (text: string) => {
    setNewComplaint(text);
    setShowForm(true);
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return '🟢';
      case 'moderate': return '🟡';
      case 'severe': return '🟠';
      case 'emergency': return '🔴';
      default: return '⚪';
    }
  };

  // Filter common complaints by search
  const filteredComplaints = commonComplaints.filter(complaint =>
    complaint.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate summary text
  const generateSummary = () => {
    if (complaints.length === 0) return 'No complaints recorded';
    
    const mainComplaint = complaints[0];
    let summary = `${mainComplaint.complaint} for ${mainComplaint.duration}`;
    
    if (complaints.length > 1) {
      summary += ` + ${complaints.length - 1} more complaint${complaints.length > 2 ? 's' : ''}`;
    }
    
    return summary;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Chief Complaints</h3>
            <p className="text-sm text-gray-500">Patient's main reasons for visit</p>
          </div>
        </div>
        
        {!readOnly && complaints.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showForm ? 'Hide Form' : 'Add Another'}
          </button>
        )}
      </div>

      {/* Summary Bar */}
      {complaints.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clipboard size={16} className="text-blue-600" />
              <span className="font-medium text-blue-800">Summary:</span>
              <span className="text-blue-700">{generateSummary()}</span>
            </div>
            <div className="text-sm text-blue-600">
              {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Current Complaints List */}
      {complaints.length > 0 ? (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className={`border rounded-lg p-3 ${getSeverityColor(complaint.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{complaint.complaint}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                      {getSeverityIcon(complaint.severity)} {complaint.severity}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Duration: {complaint.duration}</span>
                    </div>
                    
                    {complaint.body_part && (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>Location: {complaint.body_part}</span>
                      </div>
                    )}
                    
                    {complaint.notes && (
                      <div>
                        <span className="font-medium">Notes:</span> {complaint.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                {!readOnly && (
                  <button
                    onClick={() => removeComplaint(complaint.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
          <MessageSquare className="mx-auto text-gray-400 mb-2" size={24} />
          <p className="text-gray-500">No chief complaints recorded</p>
          <p className="text-sm text-gray-400 mt-1">Add patient's main reasons for visit</p>
        </div>
      )}

      {/* Add Complaint Form */}
      {!readOnly && (showForm || complaints.length === 0) && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">
              {complaints.length === 0 ? 'Add Chief Complaint' : 'Add Another Complaint'}
            </h4>
            {complaints.length > 0 && (
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Common Complaints Quick Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Quick Select</label>
              <div className="relative w-48">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search complaints..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filteredComplaints.slice(0, 8).map((item) => (
                <button
                  key={item.text}
                  onClick={() => useCommonComplaint(item.text)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  {item.text}
                  <span className="text-xs text-gray-500 ml-1">({item.category})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Complaint Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint *
            </label>
            <textarea
              value={newComplaint}
              onChange={(e) => setNewComplaint(e.target.value)}
              placeholder="Describe the main complaint in patient's own words..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select duration</option>
                {commonDurations.map((dur) => (
                  <option key={dur} value={dur}>{dur}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mild">🟢 Mild (Routine)</option>
                <option value="moderate">🟡 Moderate (Urgent)</option>
                <option value="severe">🟠 Severe (Emergency)</option>
                <option value="emergency">🔴 Critical (Immediate)</option>
              </select>
            </div>

            {/* Body Part */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Affected Area (Optional)
              </label>
              <select
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select body part</option>
                {commonBodyParts.map((part) => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about the complaint..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <button
              onClick={addComplaint}
              disabled={!newComplaint.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} />
              Add Complaint
            </button>
          </div>
        </div>
      )}

      {/* Add Button (when form is hidden) */}
      {!readOnly && !showForm && complaints.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Another Complaint
        </button>
      )}

      {/* Medical Documentation Note */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium">Medical Documentation Note:</span>
            <p className="mt-1">
              Chief complaints should be recorded in the patient's own words whenever possible.
              This forms the basis of medical history and is critical for diagnosis.
              Document duration, severity, and location accurately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiefComplaints;
