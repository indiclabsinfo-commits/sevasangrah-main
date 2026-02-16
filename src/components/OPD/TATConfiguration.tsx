// TAT Configuration Component
// For configuring TAT thresholds and alerts

import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, Clock, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TATConfig {
  maxWaitTime: number;
  maxConsultationTime: number;
  maxTotalTAT: number;
  enableWaitTimeAlerts: boolean;
  enableConsultationAlerts: boolean;
  enableTotalTATAlerts: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  notifyStaff: boolean;
  notifyManagement: boolean;
}

const TATConfiguration: React.FC = () => {
  const [config, setConfig] = useState<TATConfig>({
    maxWaitTime: 30,
    maxConsultationTime: 15,
    maxTotalTAT: 60,
    enableWaitTimeAlerts: true,
    enableConsultationAlerts: true,
    enableTotalTATAlerts: true,
    warningThreshold: 70,
    criticalThreshold: 90,
    notifyStaff: true,
    notifyManagement: false
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load config from localStorage or API
  useEffect(() => {
    const savedConfig = localStorage.getItem('tat_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In production, this would save to backend API
      // For now, save to localStorage
      localStorage.setItem('tat_config', JSON.stringify(config));
      
      toast.success('TAT configuration saved!');
      setSaved(true);
      
      // Reset saved status after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig({
      maxWaitTime: 30,
      maxConsultationTime: 15,
      maxTotalTAT: 60,
      enableWaitTimeAlerts: true,
      enableConsultationAlerts: true,
      enableTotalTATAlerts: true,
      warningThreshold: 70,
      criticalThreshold: 90,
      notifyStaff: true,
      notifyManagement: false
    });
    toast.success('Reset to defaults');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">TAT Configuration</h2>
            <p className="text-sm text-gray-500">Configure Turnaround Time thresholds and alerts</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {saved ? 'Saved!' : 'Save Configuration'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-8">
        {/* TAT Thresholds */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            TAT Thresholds (in minutes)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Max Wait Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Wait Time
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={config.maxWaitTime}
                  onChange={(e) => setConfig({ ...config, maxWaitTime: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500">min</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Time from registration to consultation start</p>
            </div>

            {/* Max Consultation Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Consultation Time
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.maxConsultationTime}
                  onChange={(e) => setConfig({ ...config, maxConsultationTime: parseInt(e.target.value) || 15 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500">min</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Time from consultation start to end</p>
            </div>

            {/* Max Total TAT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Total TAT
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={config.maxTotalTAT}
                  onChange={(e) => setConfig({ ...config, maxTotalTAT: parseInt(e.target.value) || 60 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500">min</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total time from registration to discharge</p>
            </div>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600" />
            Alert Thresholds (% of max)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Warning Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warning Threshold
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={config.warningThreshold}
                  onChange={(e) => setConfig({ ...config, warningThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50%</span>
                  <span className="font-medium text-amber-600">{config.warningThreshold}%</span>
                  <span>95%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Show warning when TAT reaches {config.warningThreshold}% of maximum
              </p>
            </div>

            {/* Critical Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critical Threshold
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="70"
                  max="99"
                  step="5"
                  value={config.criticalThreshold}
                  onChange={(e) => setConfig({ ...config, criticalThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>70%</span>
                  <span className="font-medium text-red-600">{config.criticalThreshold}%</span>
                  <span>99%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Show critical alert when TAT reaches {config.criticalThreshold}% of maximum
              </p>
            </div>
          </div>

          {/* Visual Threshold Indicator */}
          <div className="mt-6">
            <div className="h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative">
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
                style={{ left: `${config.warningThreshold}%` }}
              >
                <div className="absolute -top-6 -ml-2 text-xs font-medium text-gray-700">
                  ⚠️ Warning
                </div>
              </div>
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-gray-900"
                style={{ left: `${config.criticalThreshold}%` }}
              >
                <div className="absolute -top-6 -ml-2 text-xs font-medium text-gray-700">
                  🔴 Critical
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Alert Settings */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Alert Settings
          </h3>
          
          <div className="space-y-4">
            {/* Enable Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="waitTimeAlerts"
                  checked={config.enableWaitTimeAlerts}
                  onChange={(e) => setConfig({ ...config, enableWaitTimeAlerts: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="waitTimeAlerts" className="ml-2 text-sm text-gray-700">
                  Enable Wait Time Alerts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="consultationAlerts"
                  checked={config.enableConsultationAlerts}
                  onChange={(e) => setConfig({ ...config, enableConsultationAlerts: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="consultationAlerts" className="ml-2 text-sm text-gray-700">
                  Enable Consultation Alerts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="totalTATAlerts"
                  checked={config.enableTotalTATAlerts}
                  onChange={(e) => setConfig({ ...config, enableTotalTATAlerts: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="totalTATAlerts" className="ml-2 text-sm text-gray-700">
                  Enable Total TAT Alerts
                </label>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyStaff"
                  checked={config.notifyStaff}
                  onChange={(e) => setConfig({ ...config, notifyStaff: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="notifyStaff" className="ml-2 text-sm text-gray-700">
                  Notify Staff (Doctors/Nurses)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyManagement"
                  checked={config.notifyManagement}
                  onChange={(e) => setConfig({ ...config, notifyManagement: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="notifyManagement" className="ml-2 text-sm text-gray-700">
                  Notify Management
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Configuration Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">Thresholds</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Wait Time: {config.maxWaitTime} minutes</li>
                <li>• Consultation: {config.maxConsultationTime} minutes</li>
                <li>• Total TAT: {config.maxTotalTAT} minutes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">Alerts</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Warning at {config.warningThreshold}% of max</li>
                <li>• Critical at {config.criticalThreshold}% of max</li>
                <li>• Notifications: {config.notifyStaff ? 'Staff' : ''} {config.notifyManagement ? 'Management' : ''}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-blue-500">
            <p>⚠️ Note: This configuration is saved locally. In production, this would be saved to the database.</p>
            <p>To apply database changes, run the SQL migration: <code className="bg-blue-100 px-1 rounded">database_migrations/002_create_tat_system.sql</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TATConfiguration;