// Prescription Templates Component
// US-019: Prescription templates table
// US-020: Prescription template selector

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Copy, Check, X, Save, Pill, Stethoscope, FileText, ClipboardList } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

interface Drug {
  id: string;
  drug_code: string;
  drug_name: string;
  generic_name?: string;
  strength?: string;
  unit?: string;
  route?: string;
  schedule?: string;
}

interface PrescriptionTemplate {
  id: string;
  template_name: string;
  template_code: string;
  description?: string;
  department?: string;
  specialty?: string;
  diagnosis_codes?: string[];
  is_active: boolean;
  is_default: boolean;
  item_count?: number;
  drug_names?: string[];
}

interface TemplateItem {
  id: string;
  template_id: string;
  drug_id?: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  route?: string;
  instructions?: string;
  display_order: number;
}

interface PrescriptionTemplatesProps {
  patientId?: string;
  consultationId?: string;
  onSelectTemplate?: (template: PrescriptionTemplate, items: TemplateItem[]) => void;
  onSavePrescription?: (prescription: any) => void;
  mode?: 'selector' | 'manager' | 'prescriber';
}

const PrescriptionTemplates: React.FC<PrescriptionTemplatesProps> = ({
  patientId,
  consultationId,
  onSelectTemplate,
  onSavePrescription,
  mode = 'selector'
}) => {
  // State
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [templateItems, setTemplateItems] = useState<Record<string, TemplateItem[]>>({});
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null);
  const [selectedItems, setSelectedItems] = useState<TemplateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showPrescriptionEditor, setShowPrescriptionEditor] = useState(false);
  const [customItems, setCustomItems] = useState<TemplateItem[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = await getSupabase();

      // Load templates with item count
      const { data: templatesData, error: templatesError } = await supabase
        .from('prescription_templates_view')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Load drugs
      const { data: drugsData, error: drugsError } = await supabase
        .from('drug_catalog')
        .select('*')
        .eq('is_active', true)
        .order('drug_name')
        .limit(100);

      if (drugsError) throw drugsError;
      setDrugs(drugsData || []);

      logger.log('✅ Prescription data loaded');
    } catch (error) {
      logger.error('❌ Error loading prescription data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load template items
  const loadTemplateItems = async (templateId: string) => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('prescription_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order');

      if (error) throw error;
      
      setTemplateItems(prev => ({
        ...prev,
        [templateId]: data || []
      }));
      
      return data || [];
    } catch (error) {
      logger.error('❌ Error loading template items:', error);
      return [];
    }
  };

  // Handle template selection
  const handleSelectTemplate = async (template: PrescriptionTemplate) => {
    setSelectedTemplate(template);
    
    // Load items if not already loaded
    if (!templateItems[template.id]) {
      const items = await loadTemplateItems(template.id);
      setSelectedItems(items);
    } else {
      setSelectedItems(templateItems[template.id]);
    }
    
    if (onSelectTemplate) {
      onSelectTemplate(template, templateItems[template.id] || []);
    }
    
    if (mode === 'prescriber' && patientId) {
      setShowPrescriptionEditor(true);
      // Initialize custom items from template
      if (templateItems[template.id]) {
        setCustomItems(templateItems[template.id].map(item => ({ ...item })));
      }
    }
  };

  // Add custom item
  const addCustomItem = () => {
    setCustomItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        template_id: selectedTemplate?.id || '',
        drug_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        route: 'oral',
        instructions: '',
        display_order: prev.length
      }
    ]);
  };

  // Update custom item
  const updateCustomItem = (index: number, field: keyof TemplateItem, value: string) => {
    setCustomItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  // Remove custom item
  const removeCustomItem = (index: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save prescription
  const savePrescription = async () => {
    if (!patientId || !consultationId) return;

    try {
      const supabase = await getSupabase();
      
      const prescriptionData = {
        patient_id: patientId,
        consultation_id: consultationId,
        template_id: selectedTemplate?.id,
        prescription_date: new Date().toISOString().split('T')[0],
        prescribed_by: 'system', // In real app, use current user
        items: customItems.map(item => ({
          drug_name: item.drug_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          route: item.route,
          instructions: item.instructions
        }))
      };

      // In real app, save to prescriptions table
      // For now, just log and call callback
      logger.log('✅ Prescription data:', prescriptionData);
      
      if (onSavePrescription) {
        onSavePrescription(prescriptionData);
      }
      
      setShowPrescriptionEditor(false);
      setSelectedTemplate(null);
      setCustomItems([]);
      
      // Show success message
      alert('Prescription saved successfully!');
    } catch (error) {
      logger.error('❌ Error saving prescription:', error);
      alert('Failed to save prescription');
    }
  };

  // Search drugs
  const searchDrugs = async (term: string) => {
    if (term.length < 2) return [];
    
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.rpc('search_drugs', {
        search_term: term,
        limit_count: 10
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('❌ Error searching drugs:', error);
      return [];
    }
  };

  // Get department icon
  const getDepartmentIcon = (department?: string) => {
    switch (department?.toLowerCase()) {
      case 'pediatrics': return <Stethoscope size={16} className="text-pink-500" />;
      case 'surgery': return <ClipboardList size={16} className="text-red-500" />;
      case 'cardiology': return <Heart size={16} className="text-red-500" />;
      default: return <Pill size={16} className="text-blue-500" />;
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.template_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !departmentFilter || template.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Get unique departments
  const departments = Array.from(new Set(templates.map(t => t.department).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading prescription templates...</span>
      </div>
    );
  }

  // Template Selector Mode
  if (mode === 'selector' && !showPrescriptionEditor) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Prescription Templates</h3>
            <p className="text-sm text-gray-600">Select a template for common conditions</p>
          </div>
          <button
            onClick={() => setShowTemplateManager(true)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
          >
            <Plus size={14} />
            Manage Templates
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-800">{template.template_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {template.template_code}
                    </span>
                    {template.is_default && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                {getDepartmentIcon(template.department)}
              </div>
              
              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-2">
                  {template.description && (
                    <p className="line-clamp-2">{template.description}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {template.department && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {template.department}
                      </span>
                    )}
                    {template.specialty && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {template.specialty}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-500">
                    {template.item_count || 0} drugs
                  </div>
                </div>
                
                {template.drug_names && template.drug_names.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Includes:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.drug_names.slice(0, 3).map((drug, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">
                          {drug}
                        </span>
                      ))}
                      {template.drug_names.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          +{template.drug_names.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button className="w-full mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Select Template
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <Pill size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No prescription templates found</p>
            <p className="text-sm text-gray-500 mt-1">Try changing your search or filters</p>
          </div>
        )}
      </div>
    );
  }

  // Prescription Editor Mode
  if (showPrescriptionEditor && selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Prescription: {selectedTemplate.template_name}
            </h3>
            <p className="text-sm text-gray-600">
              Patient ID: {patientId?.substring(0, 8)}... • Template: {selectedTemplate.template_code}
            </p>
          </div>
          <button
            onClick={() => {
              setShowPrescriptionEditor(false);
              setSelectedTemplate(null);
              setCustomItems([]);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Template Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">{selectedTemplate.template_name}</h4>
              <p className="text-sm text-blue-600">{selectedTemplate.description}</p>
            </div>
          </div>
        </div>

        {/* Prescription Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">Prescription Items</h4>
            <button
              onClick={addCustomItem}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm flex items-center gap-1"
            >
              <Plus size={14} />
              Add Drug
            </button>
          </div>

          {customItems.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Drug Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Drug Name *
                      </label>
                      <input
                        type="text"
                        value={item.drug_name}
                        onChange={(e) => updateCustomItem(index, 'drug_name', e.target.value)}
                        placeholder="Enter drug name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>

                    {/* Dosage */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) => updateCustomItem(index, 'dosage', e.target.value)}
                        placeholder="e.g., 1 tablet, 5ml"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Frequency *
                      </label>
                      <select
                        value={item.frequency}
                        onChange={(e) => updateCustomItem(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="OD">Once daily (OD)</option>
                        <option value="BD">Twice daily (BD)</option>
                        <option value="TDS">Thrice daily (TDS)</option>
                        <option value="QID">Four times daily (QID)</option>
                        <option value="SOS">As needed (SOS)</option>
                        <option value="STAT">Immediately (STAT)</option>
                        <option value="HS">At bedtime (HS)</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={item.duration || ''}
                        onChange={(e) => updateCustomItem(index, 'duration', e.target.value)}
                        placeholder="e.g., 5 days, 1 week"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Route and Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Route
                      </label>
                      <select
                        value={item.route || 'oral'}
                        onChange={(e) => updateCustomItem(index, 'route', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="oral">Oral</option>
                        <option value="iv">IV</option>
                        <option value="im">IM</option>
                        <option value="sc">Subcutaneous</option>
                        <option value="topical">Topical</option>
                        <option value="inhalation">Inhalation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={item.instructions || ''}
                        onChange={(e) => updateCustomItem(index, 'instructions', e.target.value)}
                        placeholder="e.g., After food, Before breakfast"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeCustomItem(index)}
                  className="ml-3 text-red-500 hover:text-red-700"
                  title="Remove drug"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {customItems.length === 0 && (
            <div className="text-center py-8 border border-gray-200 rounded-lg">
              <Pill size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-600">No drugs added yet</p>
              <p className="text-sm text-gray-500">Click "Add Drug" to start</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setShowPrescriptionEditor(false);
              setSelectedTemplate(null);
              setCustomItems([]);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={savePrescription}
            disabled={customItems.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save Prescription
          </button>
        </div>
      </div>
    );
  }

  // Template Manager Mode
  if (showTemplateManager) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Template Manager</h3>
          <button
            onClick={() => setShowTemplateManager(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="text-center py-8 border border-gray-200 rounded-lg">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">Template Manager UI coming soon</p>
          <p className="text-sm text-gray-500 mt-1">
            For now, use Supabase dashboard to manage templates
          </p>
          <button
            onClick={() => setShowTemplateManager(false)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PrescriptionTemplates;