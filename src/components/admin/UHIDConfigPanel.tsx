// UHID Configuration Panel
// Feature: Configure UHID (Unique Health ID) format

import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Eye } from 'lucide-react';
import api from '../../services/apiService';

interface UHIDConfig {
  prefix: string;
  separator: string;
  include_year: boolean;
  year_format: string;
  sequence_digits: number;
  current_sequence: number;
  format_preview: string;
}

const UHIDConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<UHIDConfig>({
    prefix: 'HMS',
    separator: '-',
    include_year: true,
    year_format: 'YYYY',
    sequence_digits: 4,
    current_sequence: 0,
    format_preview: 'HMS-2026-0001',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  // Generate live preview
  useEffect(() => {
    const year = new Date().getFullYear();
    const yearStr = config.year_format === 'YY' ? String(year).slice(-2) : String(year);
    const seq = String(config.current_sequence + 1).padStart(config.sequence_digits, '0');

    let preview = config.prefix;
    if (config.include_year) {
      preview += config.separator + yearStr;
    }
    preview += config.separator + seq;

    setConfig(prev => ({ ...prev, format_preview: preview }));
  }, [config.prefix, config.separator, config.include_year, config.year_format, config.sequence_digits, config.current_sequence]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.uhid.getConfig();
      if (data) {
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Could not load UHID config from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.uhid.updateConfig({
        prefix: config.prefix,
        separator: config.separator,
        include_year: config.include_year,
        year_format: config.year_format,
        sequence_digits: config.sequence_digits,
      });
      setMessage({ type: 'success', text: 'UHID configuration saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const generateTestUHID = async () => {
    try {
      const result = await api.uhid.generateNext();
      setMessage({ type: 'success', text: `Generated UHID: ${result.uhid}` });
      setConfig(prev => ({ ...prev, current_sequence: result.sequence }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate UHID' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">UHID Configuration</h2>
          <p className="text-sm text-gray-600">Configure the format for Unique Health IDs</p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-sm text-blue-700 mb-2">Live Preview</div>
        <div className="text-3xl font-bold font-mono text-blue-900">{config.format_preview}</div>
        <div className="text-xs text-blue-600 mt-2">Next UHID that will be generated</div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
          <input
            type="text"
            value={config.prefix}
            onChange={(e) => setConfig(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
            maxLength={10}
            placeholder="e.g., HMS, SH, MH"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Hospital identifier prefix (max 10 chars)</p>
        </div>

        {/* Separator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Separator</label>
          <div className="flex gap-3">
            {['-', '/', '.', ''].map((sep) => (
              <button
                key={sep || 'none'}
                onClick={() => setConfig(prev => ({ ...prev, separator: sep }))}
                className={`px-4 py-2 rounded-lg border font-mono ${
                  config.separator === sep
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {sep || 'None'}
              </button>
            ))}
          </div>
        </div>

        {/* Year Options */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.include_year}
                onChange={(e) => setConfig(prev => ({ ...prev, include_year: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Include Year</span>
            </label>
          </div>

          {config.include_year && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Format</label>
              <div className="flex gap-3">
                {['YYYY', 'YY'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setConfig(prev => ({ ...prev, year_format: fmt }))}
                    className={`px-4 py-2 rounded-lg border ${
                      config.year_format === fmt
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {fmt} ({fmt === 'YYYY' ? '2026' : '26'})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sequence Digits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Digits</label>
          <div className="flex gap-3">
            {[3, 4, 5, 6].map((digits) => (
              <button
                key={digits}
                onClick={() => setConfig(prev => ({ ...prev, sequence_digits: digits }))}
                className={`px-4 py-2 rounded-lg border ${
                  config.sequence_digits === digits
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {digits} digits ({String(1).padStart(digits, '0')})
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max capacity: {Math.pow(10, config.sequence_digits) - 1} patients per {config.include_year ? 'year' : 'total'}
          </p>
        </div>

        {/* Current Sequence Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Current Sequence</div>
              <div className="text-2xl font-bold font-mono text-gray-900">{config.current_sequence}</div>
            </div>
            <button
              onClick={generateTestUHID}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
            >
              <Eye size={16} />
              Generate Test
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`border rounded-lg p-3 text-sm ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Save size={20} />
          )}
          Save Configuration
        </button>
        <button
          onClick={loadConfig}
          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw size={20} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default UHIDConfigPanel;
