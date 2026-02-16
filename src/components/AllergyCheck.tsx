// Allergy Check Component
// US-023: Allergy check to prescription

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, Search, Filter, User, Pill, Shield, Check, X } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

interface Allergy {
  id: string;
  allergen_name: string;
  allergen_type: 'drug' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  onset_date?: string;
  resolved: boolean;
  notes?: string;
}

interface Allergen {
  id: string;
  allergen_code: string;
  allergen_name: string;
  allergen_type: string;
  category?: string;
}

interface Drug {
  id: string;
  drug_name: string;
  generic_name?: string;
  category?: string;
}

interface AllergyCheckProps {
  patientId: string;
  patientName?: string;
  onAllergiesUpdated?: (allergies: Allergy[]) => void;
  onSafetyCheck?: (hasAllergies: boolean) => void;
  mode?: 'manager' | 'checker' | 'recorder';
  drugIdsToCheck?: string[]; // For checking against specific drugs
}

const AllergyCheck: React.FC<AllergyCheckProps> = ({
  patientId,
  patientName,
  onAllergiesUpdated,
  onSafetyCheck,
  mode = 'manager',
  drugIdsToCheck = []
}) => {
  // State
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  // New allergy form
  const [newAllergy, setNewAllergy] = useState({
    allergen_name: '',
    allergen_type: 'drug' as 'drug' | 'food' | 'environmental' | 'other',
    drug_id: '',
    reaction: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe' | 'life-threatening',
    onset_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = await getSupabase();

      // Load patient allergies
      const { data: allergiesData, error: allergiesError } = await supabase
        .from('patient_allergies')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (allergiesError) throw allergiesError;
      setAllergies(allergiesData || []);

      // Load allergen catalog
      const { data: allergensData, error: allergensError } = await supabase
        .from('allergen_catalog')
        .select('*')
        .eq('is_active', true)
        .order('allergen_name');

      if (allergensError) throw allergensError;
      setAllergens(allergensData || []);

      // Load drugs for drug allergies
      const { data: drugsData, error: drugsError } = await supabase
        .from('drug_catalog')
        .select('id, drug_name, generic_name, category')
        .eq('is_active', true)
        .order('drug_name')
        .limit(100);

      if (drugsError) throw drugsError;
      setDrugs(drugsData || []);

      logger.log('✅ Allergy data loaded for patient:', patientId);

      // Notify parent about allergies
      if (onAllergiesUpdated) {
        onAllergiesUpdated(allergiesData || []);
      }

      // Check safety if drug IDs provided
      if (drugIdsToCheck.length > 0) {
        checkDrugSafety(drugIdsToCheck);
      }
    } catch (error) {
      logger.error('❌ Error loading allergy data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check drug safety against allergies
  const checkDrugSafety = async (drugIds: string[]) => {
    try {
      const supabase = await getSupabase();
      
      const { data, error } = await supabase.rpc('check_patient_allergies', {
        patient_id: patientId,
        drug_ids: drugIds
      });

      if (error) throw error;

      const hasAllergies = data && data.length > 0;
      
      if (onSafetyCheck) {
        onSafetyCheck(hasAllergies);
      }

      return data || [];
    } catch (error) {
      logger.error('❌ Error checking drug safety:', error);
      return [];
    }
  };

  // Add new allergy
  const addAllergy = async () => {
    if (!newAllergy.allergen_name.trim() || !newAllergy.reaction.trim()) {
      alert('Please enter allergen name and reaction');
      return;
    }

    try {
      const supabase = await getSupabase();
      
      const allergyData = {
        patient_id: patientId,
        allergen_name: newAllergy.allergen_name,
        allergen_type: newAllergy.allergen_type,
        drug_id: newAllergy.drug_id || null,
        reaction: newAllergy.reaction,
        severity: newAllergy.severity,
        onset_date: newAllergy.onset_date || null,
        notes: newAllergy.notes,
        resolved: false
      };

      const { data, error } = await supabase
        .from('patient_allergies')
        .insert([allergyData])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAllergies(prev => [data, ...prev]);
      
      // Reset form
      setNewAllergy({
        allergen_name: '',
        allergen_type: 'drug',
        drug_id: '',
        reaction: '',
        severity: 'moderate',
        onset_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setShowAddForm(false);
      
      // Notify parent
      if (onAllergiesUpdated) {
        onAllergiesUpdated([data, ...allergies]);
      }

      logger.log('✅ Allergy added:', data);
      alert('Allergy recorded successfully!');
    } catch (error) {
      logger.error('❌ Error adding allergy:', error);
      alert('Failed to add allergy');
    }
  };

  // Mark allergy as resolved
  const resolveAllergy = async (allergyId: string) => {
    try {
      const supabase = await getSupabase();
      
      const { error } = await supabase
        .from('patient_allergies')
        .update({ resolved: true, updated_at: new Date().toISOString() })
        .eq('id', allergyId);

      if (error) throw error;

      // Update local state
      setAllergies(prev => prev.map(a => 
        a.id === allergyId ? { ...a, resolved: true } : a
      ));

      logger.log('✅ Allergy resolved:', allergyId);
      
      // Notify parent
      if (onAllergiesUpdated) {
        onAllergiesUpdated(allergies.map(a => 
          a.id === allergyId ? { ...a, resolved: true } : a
        ));
      }
    } catch (error) {
      logger.error('❌ Error resolving allergy:', error);
    }
  };

  // Delete allergy
  const deleteAllergy = async (allergyId: string) => {
    if (!confirm('Are you sure you want to delete this allergy record?')) {
      return;
    }

    try {
      const supabase = await getSupabase();
      
      const { error } = await supabase
        .from('patient_allergies')
        .delete()
        .eq('id', allergyId);

      if (error) throw error;

      // Update local state
      setAllergies(prev => prev.filter(a => a.id !== allergyId));

      logger.log('✅ Allergy deleted:', allergyId);
      
      // Notify parent
      if (onAllergiesUpdated) {
        onAllergiesUpdated(allergies.filter(a => a.id !== allergyId));
      }
    } catch (error) {
      logger.error('❌ Error deleting allergy:', error);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'life-threatening': return 'bg-red-100 text-red-800 border-red-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get allergen type icon
  const getAllergenTypeIcon = (type: string) => {
    switch (type) {
      case 'drug': return <Pill size={16} />;
      case 'food': return <Shield size={16} />;
      case 'environmental': return <Filter size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  // Filter allergies
  const filteredAllergies = allergies.filter(allergy => {
    const matchesSearch = allergy.allergen_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allergy.reaction.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allergy.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || allergy.allergen_type === filterType;
    const matchesResolved = showResolved ? true : !allergy.resolved;
    return matchesSearch && matchesType && matchesResolved;
  });

  // Get unique allergen types
  const allergenTypes = Array.from(new Set(allergies.map(a => a.allergen_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading allergy data...</span>
      </div>
    );
  }

  // Allergy Manager Mode
  if (mode === 'manager') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Allergy Management</h3>
            <p className="text-sm text-gray-600">
              {patientName ? `Patient: ${patientName}` : `Patient ID: ${patientId.substring(0, 8)}...`}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <Plus size={14} />
            Add Allergy
          </button>
        </div>

        {/* Add Allergy Form */}
        {showAddForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-3">Record New Allergy</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Allergen Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Allergen Name *
                </label>
                <input
                  type="text"
                  value={newAllergy.allergen_name}
                  onChange={(e) => setNewAllergy({ ...newAllergy, allergen_name: e.target.value })}
                  placeholder="e.g., Penicillin, Peanuts, Dust"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Allergen Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Allergen Type *
                </label>
                <select
                  value={newAllergy.allergen_type}
                  onChange={(e) => setNewAllergy({ ...newAllergy, allergen_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="drug">Drug</option>
                  <option value="food">Food</option>
                  <option value="environmental">Environmental</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Drug Selection (if drug allergy) */}
              {newAllergy.allergen_type === 'drug' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Specific Drug (Optional)
                  </label>
                  <select
                    value={newAllergy.drug_id}
                    onChange={(e) => setNewAllergy({ ...newAllergy, drug_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a drug...</option>
                    {drugs.map(drug => (
                      <option key={drug.id} value={drug.id}>
                        {drug.drug_name} {drug.generic_name ? `(${drug.generic_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reaction */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reaction *
                </label>
                <input
                  type="text"
                  value={newAllergy.reaction}
                  onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
                  placeholder="e.g., Rash, Anaphylaxis, Nausea"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Severity *
                </label>
                <select
                  value={newAllergy.severity}
                  onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life-threatening">Life-threatening</option>
                </select>
              </div>

              {/* Onset Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Onset Date
                </label>
                <input
                  type="date"
                  value={newAllergy.onset_date}
                  onChange={(e) => setNewAllergy({ ...newAllergy, onset_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue500 focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  value={newAllergy.notes}
                  onChange={(e) => setNewAllergy({ ...newAllergy, notes: e.target.value })}
                  placeholder="Additional details about the allergy..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addAllergy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1"
              >
                Save Allergy
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search allergies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {allergenTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Show Resolved</span>
          </label>
        </div>

        {/* Allergies List */}
        <div className="space-y-3">
          {filteredAllergies.length > 0 ? (
            filteredAllergies.map(allergy => (
              <div
                key={allergy.id}
                className={`border rounded-lg p-4 ${allergy.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${getSeverityColor(allergy.severity)}`}>
                        {getAllergenTypeIcon(allergy.allergen_type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {allergy.allergen_name}
                          {allergy.resolved && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                              Resolved
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded capitalize">
                            {allergy.allergen_type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${getSeverityColor(allergy.severity)}`}>
                            {allergy.severity.replace('-', ' ')}
                          </span>
                          {allergy.onset_date && (
                            <span className="text-xs text-gray-500">
                              {new Date(allergy.onset_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reaction:</span> {allergy.reaction}
                      </p>
                      {allergy.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Notes:</span> {allergy.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {!allergy.resolved && (
                      <button
                        onClick={() => resolveAllergy(allergy.id)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                        title="Mark as resolved"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAllergy(allergy.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                      title="Delete allergy"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-gray-200 rounded-lg">
              <AlertTriangle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No allergies found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || filterType !== 'all' || !showResolved
                  ? 'Try changing your search or filters'
                  : 'No allergy records for this patient'}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
          <div>
            {allergies.filter(a => !a.resolved).length} active allergy{allergies.filter(a => !a.resolved).length !== 1 ? 'ies' : ''}
          </div>
          <div>
            {allergies.filter(a => a.resolved).length} resolved
          </div>
        </div>
      </div>
    );
  }

  // Allergy Checker Mode (for prescription safety)
  if (mode === 'checker' && drugIdsToCheck.length > 0) {
    const activeAllergies = allergies.filter(a => !a.resolved);
    const hasRelevantAllergies = activeAllergies.some(allergy => {
      // Check if allergy is relevant to prescribed drugs
      // This would be more sophisticated in real implementation
      return allergy.allergen_type === 'drug';
    });

    return (
      <div className={`border rounded-lg p-4 ${
        hasRelevantAllergies 
          ? 'border-red-300 bg-red-50' 
          : 'border-green-300 bg-green-50'
      }`}>
        <div className="flex items-start">
          <AlertTriangle size={20} className={`mt-0.5 mr-3 ${
            hasRelevantAllergies ? 'text-red-600' : 'text-green-600'
          }`} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">Allergy Check</h4>
            <p className="text-sm mt-1">
              {hasRelevantAllergies ? (
                <span className="text-red-700">
                  Patient has {activeAllergies.length} active drug allergy{activeAllergies.length !== 1 ? 'ies' : ''}. Review before prescribing.
                </span>
              ) : (
                <span className="text-green-700">
                  No active drug allergies found for this patient.
                </span>
              )}
            </p>
            
            {hasRelevantAllergies && (
              <div className="mt-3 space-y-2">
                {activeAllergies.map(allergy => (
                  <div key={allergy.id} className="text-sm">
                    <span className="font-medium">{allergy.allergen_name}</span>: {allergy.reaction} ({allergy.severity})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Recorder Mode (quick add)
  if (mode === 'recorder') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800">Quick Allergy Record</h4>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAddForm ? 'Cancel' : 'Add Allergy'}
          </button>
        </div>

        {showAddForm ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newAllergy.allergen_name}
              onChange={(e) => setNewAllergy({ ...newAllergy, allergen_name: e.target.value })}
              placeholder="Allergen name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={newAllergy.reaction}
              onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
              placeholder="Reaction"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={addAllergy}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border border-gray-200 rounded-lg">
            <Plus size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-600">No allergies recorded</p>
            <p className="text-xs text-gray-500">Click "Add Allergy" to record one</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AllergyCheck;