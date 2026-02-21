// Notification System Component
// Features #10, #11, #32: WhatsApp/SMS notifications
// Connected to Express.js backend API

import React, { useState, useEffect } from 'react';
import { MessageSquare, Smartphone, Mail, Bell, Clock, Check, X, Send, Settings, BarChart, Calendar, User, AlertCircle } from 'lucide-react';
import api from '../services/apiService';

interface NotificationTemplate {
  id: string;
  template_name: string;
  template_type: 'sms' | 'whatsapp' | 'email' | 'push';
  category: 'appointment' | 'followup' | 'payment' | 'lab' | 'general' | 'emergency';
  language: string;
  content: string;
  variables: string[];
  character_count: number;
  is_active: boolean;
}

interface Notification {
  id: string;
  notification_number: string;
  recipient_name?: string;
  recipient_phone: string;
  message_type: 'sms' | 'whatsapp' | 'email' | 'push';
  message_category: string;
  message_content: string;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';
  scheduled_for?: string;
  sent_at?: string;
  estimated_cost: number;
}

interface NotificationSystemProps {
  patientId?: string;
  appointmentId?: string;
  onSendNotification?: (notification: any) => void;
}

// Default templates used as fallback when backend has none
const defaultTemplates: NotificationTemplate[] = [
  {
    id: 'default-1',
    template_name: 'Appointment Reminder - 24 Hours',
    template_type: 'sms',
    category: 'appointment',
    language: 'en',
    content: 'Dear {patient_name}, your appointment with Dr. {doctor_name} is scheduled for {appointment_date} at {appointment_time}. Please arrive 15 minutes early. Magnus Hospital',
    variables: ['patient_name', 'doctor_name', 'appointment_date', 'appointment_time'],
    character_count: 145,
    is_active: true
  },
  {
    id: 'default-2',
    template_name: 'Appointment Reminder - WhatsApp',
    template_type: 'whatsapp',
    category: 'appointment',
    language: 'en',
    content: '*Appointment Reminder*\n\nDear {patient_name},\n\nYour appointment details:\n- Doctor: Dr. {doctor_name}\n- Date: {appointment_date}\n- Time: {appointment_time}\n\nPlease arrive 15 minutes early.\n\n_Magnus Hospital_',
    variables: ['patient_name', 'doctor_name', 'appointment_date', 'appointment_time'],
    character_count: 280,
    is_active: true
  },
  {
    id: 'default-3',
    template_name: 'Follow-up Reminder',
    template_type: 'sms',
    category: 'followup',
    language: 'en',
    content: 'Dear {patient_name}, this is a follow-up reminder from Magnus Hospital. Please contact us if you need any assistance.',
    variables: ['patient_name'],
    character_count: 115,
    is_active: true
  },
  {
    id: 'default-4',
    template_name: 'Lab Report Ready',
    template_type: 'sms',
    category: 'lab',
    language: 'en',
    content: 'Dear {patient_name}, your lab reports are ready. You can collect them from hospital or view online. Magnus Hospital',
    variables: ['patient_name'],
    character_count: 95,
    is_active: true
  },
  {
    id: 'default-5',
    template_name: 'Payment Due Reminder',
    template_type: 'sms',
    category: 'payment',
    language: 'en',
    content: 'Dear {patient_name}, your payment of Rs.{amount} is due. Please settle at earliest. Magnus Hospital',
    variables: ['patient_name', 'amount'],
    character_count: 85,
    is_active: true
  }
];

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  patientId,
  appointmentId,
  onSendNotification
}) => {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [messagePreview, setMessagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history' | 'settings'>('send');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates);
  const [backendConnected, setBackendConnected] = useState(false);

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Try to load templates from backend
    try {
      const backendTemplates = await api.notifications.getTemplates();
      if (Array.isArray(backendTemplates) && backendTemplates.length > 0) {
        setTemplates(backendTemplates);
      }
      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend not available for templates, using defaults');
      setBackendConnected(false);
    }

    // Try to load notification history
    try {
      const logsData = await api.notifications.getLogs(1, 50);
      if (logsData?.logs && Array.isArray(logsData.logs)) {
        setNotifications(logsData.logs.map((log: any) => ({
          id: log.id,
          notification_number: log.notification_number || log.id?.substring(0, 8),
          recipient_name: log.recipient_name,
          recipient_phone: log.recipient_phone || log.recipient_email,
          message_type: log.channel || 'sms',
          message_category: log.category || 'general',
          message_content: log.message_content || '',
          status: log.status || 'sent',
          sent_at: log.sent_at || log.created_at,
          estimated_cost: log.cost_estimate || 0,
        })));
      }
    } catch (err) {
      console.warn('Backend not available for logs');
    }

    // Try to load stats
    try {
      const statsData = await api.notifications.getStats();
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Backend not available for stats');
      setStats({
        total: 0, sent: 0, delivered: 0, failed: 0, total_cost: 0,
        by_type: { sms: { count: 0, cost: 0 }, whatsapp: { count: 0, cost: 0 }, email: { count: 0, cost: 0 } },
        by_category: { appointment: 0, followup: 0, payment: 0, lab: 0 }
      });
    }

    // Set default variables
    setVariables({
      patient_name: 'Patient Name',
      doctor_name: 'Dr. Doctor Name',
      appointment_date: new Date().toLocaleDateString(),
      appointment_time: '10:00 AM',
      clinic_location: 'Main OPD, Ground Floor',
      hospital_name: 'Magnus Hospital',
      hospital_phone: '+91-XXXXXXXXXX',
      amount: '1,500'
    });
  };

  // Update preview when template or variables change
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        let preview = template.content;
        Object.entries(variables).forEach(([key, value]) => {
          preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
        setMessagePreview(preview);
      }
    }
  }, [selectedTemplate, variables, templates]);

  // Handle variable change
  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Send notification via backend
  const sendNotification = async () => {
    if (!selectedTemplate || !recipientPhone) {
      alert('Please select a template and enter recipient phone number');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setLoading(true);

    // Generate message content
    let messageContent = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      messageContent = messageContent.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    try {
      const result = await api.notifications.send({
        channel: template.template_type,
        recipientName: recipientName || 'Unknown',
        recipientPhone,
        message: messageContent,
        category: template.category,
        patientId,
      });

      // Create notification entry for UI
      const newNotification: Notification = {
        id: result?.id || Date.now().toString(),
        notification_number: result?.notification_number || `NOTIF-${Date.now()}`,
        recipient_name: recipientName || 'Unknown',
        recipient_phone: recipientPhone,
        message_type: template.template_type,
        message_category: template.category,
        message_content: messageContent,
        status: result?.status || 'sent',
        sent_at: new Date().toISOString(),
        estimated_cost: template.template_type === 'sms' ? 0.15 : 0.05
      };

      setNotifications(prev => [newNotification, ...prev]);

      // Refresh stats
      try {
        const newStats = await api.notifications.getStats();
        if (newStats) setStats(newStats);
      } catch {}

      if (onSendNotification) {
        onSendNotification(newNotification);
      }

      // Reset form
      setRecipientPhone('');
      setRecipientName('');
      setScheduleTime('');

      alert(`Notification sent!\n\nRecipient: ${recipientPhone}\nType: ${template.template_type}\n${!backendConnected ? '\nNote: Backend not connected — running in mock mode.' : ''}`);
    } catch (error: any) {
      alert(`Failed to send notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <Check size={14} className="text-green-600" />;
      case 'sent': return <Send size={14} className="text-blue-600" />;
      case 'failed': return <X size={14} className="text-red-600" />;
      case 'pending': return <Clock size={14} className="text-yellow-600" />;
      default: return <Bell size={14} className="text-gray-600" />;
    }
  };

  // Get message type icon
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <Smartphone size={16} />;
      case 'whatsapp': return <MessageSquare size={16} />;
      case 'email': return <Mail size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Notification System</h2>
            <p className="text-sm text-gray-600">WhatsApp/SMS notifications</p>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${backendConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {backendConnected ? 'Backend Connected' : 'Mock Mode'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['send', 'templates', 'history', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'send' && <Send size={16} className="inline mr-2" />}
              {tab === 'templates' && <Settings size={16} className="inline mr-2" />}
              {tab === 'history' && <BarChart size={16} className="inline mr-2" />}
              {tab === 'settings' && <Settings size={16} className="inline mr-2" />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Send Notification Tab */}
        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selection */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">Select Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedTemplate === template.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMessageTypeIcon(template.template_type)}
                          <span className="font-medium">{template.template_name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.category === 'appointment' ? 'bg-blue-100 text-blue-800' :
                          template.category === 'followup' ? 'bg-green-100 text-green-800' :
                          template.category === 'payment' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {template.content.substring(0, 80)}...
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{template.language.toUpperCase()}</span>
                        <span>{template.character_count} chars</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">Recipient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Enter recipient name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="9876543210"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Option */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      or send immediately
                    </div>
                  </div>
                </div>
              </div>

              {/* Variables Editor */}
              {selectedTemplate && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-3">Template Variables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates
                      .find(t => t.id === selectedTemplate)
                      ?.variables.map((variable) => (
                        <div key={variable}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.replace('_', ' ')}
                          </label>
                          <input
                            type="text"
                            value={variables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            placeholder={`Enter ${variable}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Message Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">Message Preview</h3>
                {messagePreview ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 border border-gray-300 rounded p-3 max-h-60 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {messagePreview}
                      </pre>
                    </div>
                    <div className="text-xs text-gray-500">
                      Characters: {messagePreview.length} | SMS Parts: {Math.ceil(messagePreview.length / 160)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <MessageSquare size={24} className="mx-auto mb-2" />
                    <p>Select a template to see preview</p>
                  </div>
                )}
              </div>

              {/* Cost Estimate */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-3">Cost Estimate</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Message Type:</span>
                    <span className="font-medium">
                      {selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.template_type.toUpperCase() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Estimated Cost:</span>
                    <span className="font-medium">
                      Rs.{selectedTemplate ?
                        (templates.find(t => t.id === selectedTemplate)?.template_type === 'sms' ? '0.15' : '0.05')
                        : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Mode:</span>
                    <span className={`font-medium ${backendConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                      {backendConnected ? 'Live (Backend)' : 'Mock (No backend)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <button
                  onClick={sendNotification}
                  disabled={loading || !selectedTemplate || !recipientPhone}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-800">Notification Templates</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                + Add Template
              </button>
            </div>

            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getMessageTypeIcon(template.template_type)}
                        <h4 className="font-medium text-gray-800">{template.template_name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.category === 'appointment' ? 'bg-blue-100 text-blue-800' :
                          template.category === 'followup' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {template.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {template.language.toUpperCase()}
                        </span>
                        {template.is_active ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                          {template.content}
                        </pre>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Variables:</span>{' '}
                          {template.variables.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Characters:</span>{' '}
                          {template.character_count}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                        Edit
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-800">{stats?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Notifications</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">Rs.{stats?.total_cost?.toFixed?.(2) || '0.00'}</div>
                <div className="text-sm text-gray-600">Estimated Cost</div>
              </div>
            </div>

            {/* Notification History */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Recent Notifications</h3>
                <button onClick={loadData} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                  Refresh
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No notifications yet</p>
                  <p className="text-sm mt-1">Send your first notification from the Send tab</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {notifications.map((notification) => (
                        <tr key={notification.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">
                            {notification.notification_number}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">{notification.recipient_name}</div>
                            <div className="text-gray-500">{notification.recipient_phone}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {getMessageTypeIcon(notification.message_type)}
                              <span className="capitalize">{notification.message_type}</span>
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {notification.message_category}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="max-w-xs truncate" title={notification.message_content}>
                              {notification.message_content.substring(0, 50)}...
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                              {getStatusIcon(notification.status)} {notification.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            Rs.{notification.estimated_cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {notification.sent_at ? new Date(notification.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-6">Notification Settings</h3>

            <div className="space-y-6">
              {/* Provider Configuration */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Provider Configuration</h4>
                <div className={`${backendConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4 mb-4`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={backendConnected ? 'text-green-600' : 'text-yellow-600'} size={18} />
                    <div>
                      <p className={`font-medium ${backendConnected ? 'text-green-800' : 'text-yellow-800'}`}>
                        {backendConnected ? 'Backend Connected' : 'Backend Not Connected'}
                      </p>
                      <p className={`text-sm mt-1 ${backendConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                        {backendConnected
                          ? 'Notifications are routed through the backend server. Configure SMS/WhatsApp API keys in server/.env for real message delivery.'
                          : 'Backend server is not running. Start it with: cd server && npm run dev'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Smartphone size={18} className="text-gray-600" />
                        <span className="font-medium">SMS Provider</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Twilio (via Backend)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      SMS is handled by the backend server using Twilio. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in server/.env
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-gray-600" />
                        <span className="font-medium">WhatsApp Provider</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Meta API (via Backend)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      WhatsApp is handled by the backend server using Meta WhatsApp Business API. Configure WHATSAPP_API_TOKEN and WHATSAPP_PHONE_ID in server/.env
                    </p>
                  </div>
                </div>
              </div>

              {/* DLT Registration */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-700 mb-3">DLT Registration (India)</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                    <div>
                      <p className="font-medium text-blue-800">DLT Registration Required</p>
                      <p className="text-sm text-blue-700 mt-1">
                        For sending real SMS in India, you need to register templates with DLT.
                        This is required by TRAI regulations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;
