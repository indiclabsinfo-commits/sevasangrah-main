// Examination Templates Component
// US-017: Examination templates table
// US-018: Examination template selector

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Copy, Check, X, Save, Stethoscope, Heart, Brain, Lung } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

interface BodySystem {
  id: string;
  system_code: string;
  system_name: string;
  description?: string;
  display_order: number;
}

interface ExaminationComponent {
  id: string;
  component_code: string;
  component_name: string;
  system_code: string;
  normal_range?: string;
  measurement_unit?: string;
  input_type: string;
  options?: any[];
}

interface ExaminationTemplate {
  id: string;
  template_name: string;
  template_code: string;
  department?: string;
  specialty?: string;
  systems: string[];
  components: string[];
  is_active: boolean;
  is_default: boolean;
  created_by?: string;
  created_at: string;
}

interface ExaminationTemplatesProps {
  patientId?: string;
  consultationId?: string;
  onSelectTemplate?: (template: ExaminationTemplate) => void;
  onSaveFindings?: (findings: any) => void;
  mode?: 'selector' | 'manager' | 'recorder';
}

const ExaminationTemplates: React.FC<ExaminationTemplatesProps> = ({
  patientId,
  consultationId,
  onSelectTemplate,
  onSaveFindings,
  mode = 'selector'
}) => {
  // State
  const [templates, setTemplates] = useState<ExaminationTemplate[]>([]);
  const [systems, setSystems] = useState<BodySystem[]>([]);
  const [components, setComponents] = useState<ExaminationComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ExaminationTemplate | null>(null);
  const [findings, setFindings] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showFindingsRecorder, setShowFindingsRecorder] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = await getSupabase();

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('examination_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Load systems
      const { data: systemsData, error: systemsError } = await supabase
        .from('body_systems')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (systemsError) throw systemsError;
      setSystems(systemsData || []);

      // Load components
      const { data: componentsData, error: componentsError } = await supabase
        .from('examination_components')
        .select('*')
        .eq('is_active', true)
        .order('component_name');

      if (componentsError) throw componentsError;
      setComponents(componentsData || []);

      logger.log('✅ Examination data loaded');
    } catch (error) {
      logger.error('❌ Error loading examination data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: ExaminationTemplate) => {
    setSelectedTemplate(template);
    
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    
    if (mode === 'recorder' && patientId) {
      setShowFindingsRecorder(true);
      initializeFindings(template);
    }
  };

  // Initialize findings for selected template
  const initializeFindings = (template: ExaminationTemplate) => {
    const initialFindings: Record<string, any> = {};
    
    template.components.forEach(componentCode => {
      const component = components.find(c => c.component_code === componentCode);
      if (component) {
        initialFindings[componentCode] = {
          value: '',
          normal: true,
          notes: '',
          component
        };
      }
    });
    
    setFindings(initialFindings);
  };

  // Update finding value
  const updateFinding = (componentCode: string, field: string, value: any) => {
    setFindings(prev => ({
      ...prev,
      [componentCode]: {
        ...prev[componentCode],
        [field]: value
      }
    }));
  };

  // Save examination findings
  const saveFindings = async () => {
    if (!patientId || !selectedTemplate) return;

    try {
      const supabase = await getSupabase();
      
      const examinationData = {
        patient_id: patientId,
        consultation_id: consultationId,
        template_id: selectedTemplate.id,
        examination_data: findings,
        examination_date: new Date().toISOString().split('T')[0],
        examined_by: 'system', // In real app, use current user
        is_abnormal: Object.values(findings).some(f => !f.normal)
      };

      const { data, error } = await supabase
        .from('examination_findings')
        .insert([examinationData])
        .select()
        .single();

      if (error) throw error;

      logger.log('✅ Examination findings saved:', data);
      
      if (onSaveFindings) {
        onSaveFindings(data);
      }
      
      setShowFindingsRecorder(false);
      setSelectedTemplate(null);
      setFindings({});
      
      // Show success message
      alert('Examination findings saved successfully!');
    } catch (error) {
      logger.error('❌ Error saving examination findings:', error);
      alert('Failed to save examination findings');
    }
  };

  // Get system icon
  const getSystemIcon = (systemCode: string) => {
    switch (systemCode) {
      case 'cvs': return <Heart size={16} className="text-red-500" />;
      case 'respiratory': return <Lung size={16} className="text-blue-500" />;
      case 'cns': return <Brain size={16} className="text-purple-500" />;
      default: return <Stethoscope size={16} className="text-gray-500" />;
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.template_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !departmentFilter || template.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Get unique departments
  const departments = Array.from(new Set(templates.map(t => t.department).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading examination templates...</span>
      </div>
    );
  }

  // Template Selector Mode
  if (mode === 'selector' && !showFindingsRecorder) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Examination Templates</h3>
            <p className="text-sm text-gray-600">Select a template to start examination</p>
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
                <Stethoscope size={20} className="text-gray-400" />
              </div>
              
              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-2">
                  {template.department && (
                    <span className="font-medium">{template.department}</span>
                  )}
                  {template.specialty && ` • ${template.specialty}`}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.systems.slice(0, 3).map(systemCode => {
                    const system = systems.find(s => s.system_code === systemCode);
                    return (
                      <span key={systemCode} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                        {getSystemIcon(systemCode)}
                        {system?.system_name || systemCode}
                      </span>
                    );
                  })}
                  {template.systems.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      +{template.systems.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  {template.components.length} components
                </div>
              </div>
              
              <button className="w-full mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Select Template
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <Stethoscope size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No examination templates found</p>
            <p className="text-sm text-gray-500 mt-1">Try changing your search or filters</p>
          </div>
        )}
      </div>
    );
  }

  // Findings Recorder Mode
  if (showFindingsRecorder && selectedTemplate) {
    const templateSystems = systems.filter(s => selectedTemplate.systems.includes(s.system_code));
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Recording Examination: {selectedTemplate.template_name}
            </h3>
            <p className="text-sm text-gray-600">
              Patient ID: {patientId?.substring(0, 8)}... • Template: {selectedTemplate.template_code}
            </p>
          </div>
          <button
            onClick={() => {
              setShowFindingsRecorder(false);
              setSelectedTemplate(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Systems Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {templateSystems.map(system => (
              <button
                key={system.id}
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-blue-600 hover:border-blue-300 whitespace-nowrap"
              >
                {getSystemIcon(system.system_code)}
                <span className="ml-2">{system.system_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Examination Form */}
        <div className="space-y-6">
          {selectedTemplate.components.map(componentCode => {
            const component = components.find(c => c.component_code === componentCode);
            if (!component) return null;
            
            const finding = findings[componentCode] || { value: '', normal: true, notes: '' };
            const system = systems.find(s => s.system_code === component.system_code);
            
            return (
              <div key={componentCode} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{component.component_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      {system && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {system.system_name}
                        </span>
                      )}
                      {component.normal_range && (
                        <span className="text-xs text-gray-600">
                          Normal: {component.normal_range}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={finding.normal}
                        onChange={(e) => updateFinding(componentCode, 'normal', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-600">Normal</span>
                    </label>
                  </div>
                </div>
                
                {/* Input Field */}
                <div className="mb-3">
                  {component.input_type === 'text' && (
                    <textarea
                      value={finding.value}
                      onChange={(e) => updateFinding(componentCode, 'value', e.target.value)}
                      placeholder="Enter findings..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  )}
                  
                  {component.input_type === 'number' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={finding.value}
                        onChange={(e) => updateFinding(componentCode, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter value"
                      />
                      {component.measurement_unit && (
                        <span className="text-gray-600">{component.measurement_unit}</span>
                      )}
                    </div>
                  )}
                  
                  {component.input_type === 'select' && component.options && (
                    <select
                      value={finding.value}
                      onChange={(e) => updateFinding(componentCode, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      {component.options.map((option: string, idx: number) => (
                        <option key={idx} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                {/* Notes */}
                <div>
                  <textarea
                    value={finding.notes}
                    onChange={(e) => updateFinding(componentCode, 'notes', e.target.value)}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={1}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setShowFindingsRecorder(false);
              setSelectedTemplate(null);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={saveFindings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save Examination Findings
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
          <Stethoscope size={48} className="mx-auto text-gray-300 mb-3" />
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

export default ExaminationTemplates;