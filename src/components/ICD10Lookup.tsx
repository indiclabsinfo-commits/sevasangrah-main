// ICD-10 Lookup Component
// For US-016: ICD-10 lookup to diagnosis

import React, { useState, useEffect, useRef } from 'react';
import { Search, Stethoscope, AlertCircle, Check, X, BookOpen } from 'lucide-react';

interface ICD10Code {
  code: string;
  description: string;
  chapter: string;
  severity: string;
  is_billable: boolean;
  requires_specialist: boolean;
}

interface ICD10LookupProps {
  onSelectCode?: (code: ICD10Code) => void;
  selectedCodes?: ICD10Code[];
  onRemoveCode?: (code: string) => void;
  maxSelections?: number;
}

const ICD10Lookup: React.FC<ICD10LookupProps> = ({
  onSelectCode,
  selectedCodes = [],
  onRemoveCode,
  maxSelections = 5
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ICD10Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock data - in production, this would call API
  const mockICD10Codes: ICD10Code[] = [
    { code: 'A00', description: 'Cholera', chapter: 'I. Infectious diseases', severity: 'severe', is_billable: true, requires_specialist: true },
    { code: 'I10', description: 'Essential hypertension', chapter: 'IX. Circulatory diseases', severity: 'moderate', is_billable: true, requires_specialist: false },
    { code: 'E11', description: 'Type 2 diabetes mellitus', chapter: 'IV. Endocrine diseases', severity: 'severe', is_billable: true, requires_specialist: true },
    { code: 'J00', description: 'Common cold', chapter: 'X. Respiratory diseases', severity: 'mild', is_billable: true, requires_specialist: false },
    { code: 'K29', description: 'Gastritis', chapter: 'XI. Digestive diseases', severity: 'moderate', is_billable: true, requires_specialist: false },
    { code: 'B54', description: 'Unspecified malaria', chapter: 'I. Infectious diseases', severity: 'severe', is_billable: true, requires_specialist: true },
    { code: 'A15', description: 'Respiratory tuberculosis', chapter: 'I. Infectious diseases', severity: 'severe', is_billable: true, requires_specialist: true },
    { code: 'R05', description: 'Cough', chapter: 'XVIII. Symptoms', severity: 'mild', is_billable: true, requires_specialist: false },
    { code: 'R10', description: 'Abdominal pain', chapter: 'XVIII. Symptoms', severity: 'moderate', is_billable: true, requires_specialist: false },
    { code: 'S00', description: 'Superficial head injury', chapter: 'XIX. Injuries', severity: 'moderate', is_billable: true, requires_specialist: false },
  ];

  // Search function
  const searchICD10 = (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const filtered = mockICD10Codes.filter(code =>
        code.code.toLowerCase().includes(term.toLowerCase()) ||
        code.description.toLowerCase().includes(term.toLowerCase()) ||
        code.chapter.toLowerCase().includes(term.toLowerCase())
      );
      
      setResults(filtered.slice(0, 10)); // Limit to 10 results
      setLoading(false);
      setShowResults(true);
    }, 300);
  };

  // Handle search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchICD10(searchTerm);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle code selection
  const handleSelectCode = (code: ICD10Code) => {
    if (selectedCodes.length >= maxSelections) {
      alert(`Maximum ${maxSelections} diagnoses allowed`);
      return;
    }

    if (onSelectCode) {
      onSelectCode(code);
    }
    
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return '🟢';
      case 'moderate': return '🟡';
      case 'severe': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-4" ref={searchRef}>
      {/* Selected Codes Display */}
      {selectedCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Selected Diagnoses</h3>
            <span className="text-xs text-gray-500">
              {selectedCodes.length}/{maxSelections}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedCodes.map((code, index) => (
              <div
                key={`${code.code}-${index}`}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg"
              >
                <Stethoscope size={14} />
                <span className="font-mono font-bold">{code.code}</span>
                <span className="text-sm">{code.description}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(code.severity)}`}>
                  {getSeverityIcon(code.severity)} {code.severity}
                </span>
                {onRemoveCode && (
                  <button
                    onClick={() => onRemoveCode(code.code)}
                    className="text-blue-400 hover:text-blue-600 ml-2"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={18} className="text-gray-600" />
          <label className="text-sm font-medium text-gray-700">
            ICD-10 Diagnosis Lookup
          </label>
          <span className="text-xs text-gray-500 ml-auto">
            WHO International Classification of Diseases
          </span>
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ICD-10 code or description (e.g., 'A00' or 'Cholera')"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          />
          
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="p-2 border-b bg-gray-50">
              <div className="text-sm font-medium text-gray-700">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              <div className="text-xs text-gray-500">
                Select a diagnosis code
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {results.map((code) => (
                <button
                  key={code.code}
                  onClick={() => handleSelectCode(code)}
                  className="w-full text-left p-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-blue-600">
                          {code.code}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(code.severity)}`}>
                          {code.severity}
                        </span>
                        {code.requires_specialist && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Specialist Required
                          </span>
                        )}
                        {code.is_billable && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                            Billable
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {code.description}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {code.chapter}
                      </div>
                    </div>
                    
                    <div className="ml-2">
                      <Check size={18} className="text-green-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>ICD-10 codes follow WHO International Classification of Diseases, 10th Revision</span>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {showResults && searchTerm.length >= 2 && results.length === 0 && !loading && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="text-center text-gray-500">
              <Search size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No ICD-10 codes found</p>
              <p className="text-sm mt-1">Try searching by code (e.g., 'I10') or description (e.g., 'hypertension')</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Search Tips</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Search by code: <code className="font-mono bg-gray-100 px-1 rounded">I10</code> (Hypertension)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Search by description: <code className="font-mono bg-gray-100 px-1 rounded">diabetes</code></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Severity colors: 🟢 Mild 🟡 Moderate 🟠 Severe 🔴 Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Max {maxSelections} diagnoses per patient</span>
          </div>
        </div>
      </div>

      {/* Quick Search Buttons */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Common Diagnoses</div>
        <div className="flex flex-wrap gap-2">
          {['I10', 'E11', 'J00', 'K29', 'R05'].map((code) => {
            const commonCode = mockICD10Codes.find(c => c.code === code);
            if (!commonCode) return null;
            
            return (
              <button
                key={code}
                onClick={() => handleSelectCode(commonCode)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                disabled={selectedCodes.length >= maxSelections}
              >
                <span className="font-mono font-bold">{code}</span>
                <span>{commonCode.description.split(' ')[0]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(commonCode.severity)}`}>
                  {getSeverityIcon(commonCode.severity)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ICD10Lookup;