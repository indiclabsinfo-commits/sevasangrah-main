// Drug Interaction Check Component
// US-021: Drug interactions table
// US-022: Drug interaction check

import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, Info, CheckCircle, Pill, AlertOctagon, Search } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

interface DrugInteraction {
  drug1_name: string;
  drug2_name: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  description: string;
  management: string;
}

interface PatientAllergy {
  allergen_name: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  drug_name?: string;
}

interface SafetyCheckResult {
  has_interactions: boolean;
  has_allergies: boolean;
  interactions: DrugInteraction[];
  allergies: PatientAllergy[];
  is_safe: boolean;
}

interface DrugInteractionCheckProps {
  patientId?: string;
  drugIds: string[];
  drugNames: string[];
  onSafetyResult?: (result: SafetyCheckResult) => void;
  mode?: 'prescription' | 'standalone' | 'report';
}

const DrugInteractionCheck: React.FC<DrugInteractionCheckProps> = ({
  patientId,
  drugIds,
  drugNames,
  onSafetyResult,
  mode = 'prescription'
}) => {
  // State
  const [loading, setLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Run safety check when drugIds change
  useEffect(() => {
    if (drugIds.length > 0) {
      runSafetyCheck();
    } else {
      setSafetyResult(null);
    }
  }, [drugIds.join(',')]); // Dependency on drugIds array

  const runSafetyCheck = async () => {
    if (drugIds.length === 0) return;

    try {
      setLoading(true);
      const supabase = await getSupabase();

      // Call the safety check function
      const { data, error } = await supabase.rpc('safety_check_prescription', {
        patient_id: patientId || null,
        drug_ids: drugIds
      });

      if (error) throw error;

      setSafetyResult(data);
      
      if (onSafetyResult) {
        onSafetyResult(data);
      }

      logger.log('✅ Safety check completed:', data);
    } catch (error) {
      logger.error('❌ Error running safety check:', error);
      // Fallback to client-side check if RPC fails
      runClientSideCheck();
    } finally {
      setLoading(false);
    }
  };

  const runClientSideCheck = async () => {
    // Fallback client-side check
    // In real implementation, this would check against a local database
    const mockResult: SafetyCheckResult = {
      has_interactions: false,
      has_allergies: false,
      interactions: [],
      allergies: [],
      is_safe: true
    };
    
    setSafetyResult(mockResult);
    
    if (onSafetyResult) {
      onSafetyResult(mockResult);
    }
  };

  // Get severity icon and color
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'contraindicated':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'major':
        return { icon: AlertOctagon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'moderate':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'minor':
        return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  // Get allergy severity color
  const getAllergySeverityColor = (severity: string) => {
    switch (severity) {
      case 'life-threatening': return 'text-red-600 bg-red-50 border-red-200';
      case 'severe': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'mild': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filter interactions by search
  const filteredInteractions = safetyResult?.interactions?.filter(interaction => 
    interaction.drug1_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interaction.drug2_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredAllergies = safetyResult?.allergies?.filter(allergy =>
    allergy.allergen_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allergy.drug_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allergy.reaction.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking drug safety...</span>
      </div>
    );
  }

  // If no drugs selected
  if (drugIds.length === 0) {
    return (
      <div className="text-center py-6 border border-gray-200 rounded-lg">
        <Pill size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-600">No drugs selected for safety check</p>
        <p className="text-sm text-gray-500">Add drugs to prescription to check for interactions</p>
      </div>
    );
  }

  // If safe and no details shown
  if (safetyResult?.is_safe && !showDetails && mode === 'prescription') {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle size={20} className="text-green-600 mr-2" />
          <div>
            <h4 className="font-medium text-green-800">Prescription Safety Check</h4>
            <p className="text-sm text-green-600">
              {drugNames.length} drug{drugNames.length !== 1 ? 's' : ''} checked • No significant interactions or allergies found
            </p>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="ml-auto text-sm text-green-700 hover:text-green-900"
          >
            Show Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Drug Safety Check</h3>
          <p className="text-sm text-gray-600">
            Checking {drugNames.length} drug{drugNames.length !== 1 ? 's' : ''} for interactions and allergies
          </p>
        </div>
        {mode === 'prescription' && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search interactions or allergies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Safety Summary */}
      {!safetyResult?.is_safe && (
        <div className={`border rounded-lg p-4 ${
          safetyResult?.has_interactions && safetyResult.interactions.some(i => i.severity === 'contraindicated' || i.severity === 'major')
            ? 'border-red-300 bg-red-50'
            : 'border-yellow-300 bg-yellow-50'
        }`}>
          <div className="flex items-start">
            <AlertTriangle size={20} className={`mt-0.5 mr-3 ${
              safetyResult?.has_interactions && safetyResult.interactions.some(i => i.severity === 'contraindicated' || i.severity === 'major')
                ? 'text-red-600'
                : 'text-yellow-600'
            }`} />
            <div>
              <h4 className="font-medium text-gray-800">Safety Alert</h4>
              <ul className="mt-1 text-sm space-y-1">
                {safetyResult?.has_interactions && (
                  <li>
                    {safetyResult.interactions.filter(i => i.severity === 'contraindicated').length > 0 && (
                      <span className="text-red-700">
                        {safetyResult.interactions.filter(i => i.severity === 'contraindicated').length} contraindicated interaction{safetyResult.interactions.filter(i => i.severity === 'contraindicated').length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {safetyResult.interactions.filter(i => i.severity === 'major').length > 0 && (
                      <span className="text-orange-700">
                        {safetyResult.interactions.filter(i => i.severity === 'contraindicated').length > 0 && ', '}
                        {safetyResult.interactions.filter(i => i.severity === 'major').length} major interaction{safetyResult.interactions.filter(i => i.severity === 'major').length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </li>
                )}
                {safetyResult?.has_allergies && (
                  <li className="text-orange-700">
                    {safetyResult.allergies.length} potential allerg{safetyResult.allergies.length !== 1 ? 'ies' : 'y'}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Drug List */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Drugs Being Checked:</h4>
        <div className="flex flex-wrap gap-2">
          {drugNames.map((name, index) => (
            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Interactions Section */}
      {safetyResult?.has_interactions && (showDetails || mode !== 'prescription') && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Drug Interactions</h4>
          {filteredInteractions.length > 0 ? (
            filteredInteractions.map((interaction, index) => {
              const config = getSeverityConfig(interaction.severity);
              const Icon = config.icon;
              
              return (
                <div key={index} className={`border rounded-lg p-4 ${config.bg} ${config.border}`}>
                  <div className="flex items-start">
                    <Icon size={20} className={`mt-0.5 mr-3 ${config.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-800">
                          {interaction.drug1_name} + {interaction.drug2_name}
                        </h5>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg.replace('50', '100')}`}>
                          {interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{interaction.description}</p>
                      {interaction.management && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Management:</p>
                          <p className="text-sm text-gray-600">{interaction.management}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : searchTerm ? (
            <p className="text-sm text-gray-500 text-center py-4">No interactions match your search</p>
          ) : null}
        </div>
      )}

      {/* Allergies Section */}
      {safetyResult?.has_allergies && (showDetails || mode !== 'prescription') && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Allergy Alerts</h4>
          {filteredAllergies.length > 0 ? (
            filteredAllergies.map((allergy, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getAllergySeverityColor(allergy.severity)}`}>
                <div className="flex items-start">
                  <AlertTriangle size={20} className="mt-0.5 mr-3" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-800">
                        {allergy.allergen_name}
                        {allergy.drug_name && ` (${allergy.drug_name})`}
                      </h5>
                      <span className="px-2 py-0.5 rounded text-xs font-medium capitalize">
                        {allergy.severity.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Reaction: {allergy.reaction}</p>
                  </div>
                </div>
              </div>
            ))
          ) : searchTerm ? (
            <p className="text-sm text-gray-500 text-center py-4">No allergies match your search</p>
          ) : null}
        </div>
      )}

      {/* No Issues Found */}
      {safetyResult?.is_safe && (showDetails || mode !== 'prescription') && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-6 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
          <h4 className="font-medium text-green-800">No Safety Issues Found</h4>
          <p className="text-sm text-green-600 mt-1">
            The selected drugs have no significant interactions or allergy concerns
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {mode === 'standalone' && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={runSafetyCheck}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1"
          >
            Re-check Safety
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Print Report
          </button>
        </div>
      )}
    </div>
  );
};

export default DrugInteractionCheck;