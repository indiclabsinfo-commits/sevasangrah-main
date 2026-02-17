// Duplicate Patient Check Component
// Feature #22: Duplicate patient registration check

import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Check, X, User, Phone, Fingerprint, Calendar, Merge } from 'lucide-react';
import { checkForDuplicates, type DuplicateCheckResult, type DuplicateMatch } from '../utils/duplicatePatientCheck';
import { logger } from '../utils/logger';

interface PatientData {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  aadhaar?: string;
  abhaId?: string;
  dateOfBirth?: string;
  gender?: string;
}

interface DuplicatePatientCheckProps {
  patientData: PatientData;
  onDuplicateFound?: (result: DuplicateCheckResult) => void;
  onNoDuplicates?: () => void;
  onActionSelected?: (action: 'block' | 'warn' | 'allow' | 'merge') => void;
  autoCheck?: boolean;
  showDetails?: boolean;
}

const DuplicatePatientCheck: React.FC<DuplicatePatientCheckProps> = ({
  patientData,
  onDuplicateFound,
  onNoDuplicates,
  onActionSelected,
  autoCheck = true,
  showDetails = true
}) => {
  // State
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DuplicateCheckResult | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);
  const [primaryPatient, setPrimaryPatient] = useState<string>('');

  // Auto-check on patient data change
  useEffect(() => {
    if (autoCheck && patientData.firstName && patientData.phone) {
      performCheck();
    }
  }, [patientData, autoCheck]);

  // Perform duplicate check
  const performCheck = async () => {
    try {
      setChecking(true);
      
      const checkData = {
        patientId: patientData.id || 'new-patient',
        firstName: patientData.firstName,
        lastName: patientData.lastName || '',
        phone: patientData.phone,
        aadhaar: patientData.aadhaar,
        abhaId: patientData.abhaId,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender
      };
      
      logger.log('🔍 Performing duplicate check:', checkData);
      const checkResult = await checkForDuplicates(checkData);
      setResult(checkResult);
      
      // Callbacks
      if (checkResult.hasDuplicates && onDuplicateFound) {
        onDuplicateFound(checkResult);
      } else if (!checkResult.hasDuplicates && onNoDuplicates) {
        onNoDuplicates();
      }
      
      logger.log('✅ Duplicate check completed:', checkResult);
    } catch (error) {
      logger.error('❌ Error performing duplicate check:', error);
    } finally {
      setChecking(false);
    }
  };

  // Handle action selection
  const handleAction = (action: 'block' | 'warn' | 'allow' | 'merge') => {
    if (onActionSelected) {
      onActionSelected(action);
    }
    
    if (action === 'merge') {
      setShowMergeModal(true);
    }
  };

  // Toggle duplicate selection for merging
  const toggleDuplicateSelection = (patientId: string) => {
    setSelectedDuplicates(prev => 
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  // Get severity color based on match score
  const getSeverityColor = (score: number) => {
    if (score >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  // Get action button color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'block': return 'bg-red-600 hover:bg-red-700';
      case 'warn': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'allow': return 'bg-green-600 hover:bg-green-700';
      case 'merge': return 'bg-purple-600 hover:bg-purple-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Get match icon
  const getMatchIcon = (score: number) => {
    if (score >= 90) return <AlertTriangle size={16} />;
    if (score >= 70) return <Users size={16} />;
    return <User size={16} />;
  };

  if (!patientData.firstName || !patientData.phone) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">Enter patient details to check for duplicates</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Check Button */}
      {!autoCheck && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-800">Duplicate Check</h3>
            <p className="text-sm text-gray-600">Check if patient already exists in system</p>
          </div>
          <button
            onClick={performCheck}
            disabled={checking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {checking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <Users size={16} />
                Check for Duplicates
              </>
            )}
          </button>
        </div>
      )}

      {/* Checking Indicator */}
      {checking && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-medium text-blue-800">Checking for duplicates...</p>
              <p className="text-sm text-blue-600">
                Comparing with existing patients in database
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !checking && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className={`border rounded-lg p-4 ${
            result.suggestedAction === 'block' ? 'bg-red-50 border-red-200' :
            result.suggestedAction === 'warn' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.suggestedAction === 'block' ? (
                  <AlertTriangle className="text-red-600" size={24} />
                ) : result.suggestedAction === 'warn' ? (
                  <AlertTriangle className="text-yellow-600" size={24} />
                ) : (
                  <Check className="text-green-600" size={24} />
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {result.suggestedAction === 'block' ? '❌ Duplicate Found!' :
                     result.suggestedAction === 'warn' ? '⚠️ Potential Duplicate' :
                     '✅ No Duplicates Found'}
                  </h3>
                  <p className="text-sm">
                    {result.suggestedAction === 'block' ? 'Exact match found. Registration blocked.' :
                     result.suggestedAction === 'warn' ? `${result.totalMatches} potential match(es) found.` :
                     'Patient appears to be unique.'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{result.confidence}%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {result.suggestedAction === 'block' && (
              <>
                <button
                  onClick={() => handleAction('block')}
                  className={`px-4 py-2 text-white rounded-lg flex-1 ${getActionColor('block')}`}
                >
                  Block Registration
                </button>
                <button
                  onClick={() => handleAction('merge')}
                  className={`px-4 py-2 text-white rounded-lg flex-1 ${getActionColor('merge')}`}
                >
                  <Merge size={16} className="inline mr-2" />
                  Merge Patients
                </button>
              </>
            )}
            
            {result.suggestedAction === 'warn' && (
              <>
                <button
                  onClick={() => handleAction('warn')}
                  className={`px-4 py-2 text-white rounded-lg flex-1 ${getActionColor('warn')}`}
                >
                  Continue with Warning
                </button>
                <button
                  onClick={() => handleAction('merge')}
                  className={`px-4 py-2 text-white rounded-lg flex-1 ${getActionColor('merge')}`}
                >
                  <Merge size={16} className="inline mr-2" />
                  Review & Merge
                </button>
              </>
            )}
            
            {result.suggestedAction === 'allow' && (
              <button
                onClick={() => handleAction('allow')}
                className={`px-4 py-2 text-white rounded-lg flex-1 ${getActionColor('allow')}`}
              >
                Continue Registration
              </button>
            )}
          </div>

          {/* Detailed Matches */}
          {showDetails && (result.exactMatches.length > 0 || result.potentialMatches.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Matching Patients</h4>
              
              {/* Exact Matches */}
              {result.exactMatches.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">Exact Matches</h5>
                  <div className="space-y-2">
                    {result.exactMatches.map((match) => (
                      <DuplicateMatchCard
                        key={match.patientId}
                        match={match}
                        isSelected={selectedDuplicates.includes(match.patientId)}
                        onToggleSelect={() => toggleDuplicateSelection(match.patientId)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Potential Matches */}
              {result.potentialMatches.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-yellow-700 mb-2">Potential Matches</h5>
                  <div className="space-y-2">
                    {result.potentialMatches.map((match) => (
                      <DuplicateMatchCard
                        key={match.patientId}
                        match={match}
                        isSelected={selectedDuplicates.includes(match.patientId)}
                        onToggleSelect={() => toggleDuplicateSelection(match.patientId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Matches Message - REMOVED as requested */}
          {/* {showDetails && result.totalMatches === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Check className="text-green-600 mx-auto mb-2" size={24} />
              <p className="font-medium text-green-800">No duplicate patients found</p>
              <p className="text-sm text-green-600 mt-1">
                This patient appears to be unique in the system
              </p>
            </div>
          )} */}
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Merge Duplicate Patients</h3>
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Merge className="text-purple-600" size={20} />
                    <span className="font-medium text-purple-800">Merge Instructions</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Select which patient records to merge into the primary patient.
                    All appointments, transactions, and medical records will be transferred.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Primary Patient (will keep this record)
                  </label>
                  <select
                    value={primaryPatient}
                    onChange={(e) => setPrimaryPatient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select primary patient</option>
                    <option value={patientData.id || 'new'}>New Patient (being registered)</option>
                    {result?.exactMatches.map(match => (
                      <option key={match.patientId} value={match.patientId}>
                        {match.patient.first_name} {match.patient.last_name} (Existing)
                      </option>
                    ))}
                    {result?.potentialMatches.map(match => (
                      <option key={match.patientId} value={match.patientId}>
                        {match.patient.first_name} {match.patient.last_name} (Potential)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Duplicates to Merge (will be archived)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result?.exactMatches.map(match => (
                      <label key={match.patientId} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates.includes(match.patientId)}
                          onChange={() => toggleDuplicateSelection(match.patientId)}
                          className="rounded"
                        />
                        <DuplicateMatchCard match={match} compact />
                      </label>
                    ))}
                    {result?.potentialMatches.map(match => (
                      <label key={match.patientId} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates.includes(match.patientId)}
                          onChange={() => toggleDuplicateSelection(match.patientId)}
                          className="rounded"
                        />
                        <DuplicateMatchCard match={match} compact />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle merge
                    setShowMergeModal(false);
                    if (onActionSelected) {
                      onActionSelected('merge');
                    }
                  }}
                  disabled={!primaryPatient || selectedDuplicates.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex-1"
                >
                  <Merge size={16} className="inline mr-2" />
                  Merge Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Duplicate Match Card Component
interface DuplicateMatchCardProps {
  match: DuplicateMatch;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  compact?: boolean;
}

const DuplicateMatchCard: React.FC<DuplicateMatchCardProps> = ({
  match,
  isSelected = false,
  onToggleSelect,
  compact = false
}) => {
  return (
    <div className={`border rounded-lg p-3 ${getSeverityColor(match.matchScore)} ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getMatchIcon(match.matchScore)}
            <span className="font-medium">
              {match.patient.first_name} {match.patient.last_name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50">
              {match.matchScore}% match
            </span>
          </div>
          
          {!compact && (
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div className="flex items-center gap-1">
                <Phone size={12} />
                <span>{match.patient.phone || 'No phone'}</span>
              </div>
              {match.patient.aadhaar_number && (
                <div className="flex items-center gap-1">
                  <Fingerprint size={12} />
                  <span className="font-mono">••••{match.patient.aadhaar_number.slice(-4)}</span>
                </div>
              )}
              {match.patient.date_of_birth && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(match.patient.date_of_birth)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{match.patient.gender || 'Not specified'}</span>
              </div>
            </div>
          )}
          
          {!compact && match.matchReasons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Match Reasons:</p>
              <div className="flex flex-wrap gap-1">
                {match.matchReasons.map((reason, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-white bg-opacity-50 rounded">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {!compact && (
            <div className="text-xs text-gray-600 mt-2">
              Patient ID: {match.patient.id.substring(0, 8)}... • 
              Created: {formatDate(match.patient.created_at)}
              {match.patient.last_visit && ` • Last visit: ${formatDate(match.patient.last_visit)}`}
            </div>
          )}
        </div>
        
        {onToggleSelect && (
          <button
            onClick={onToggleSelect}
            className={`ml-2 p-2 rounded ${isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={isSelected ? 'Deselect for merge' : 'Select for merge'}
          >
            {isSelected ? <Check size={16} /> : <User size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default DuplicatePatientCheck;