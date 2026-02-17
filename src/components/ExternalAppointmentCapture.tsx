import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  RefreshCw, 
  Download, 
  Upload, 
  Link, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Globe,
  Database
} from 'lucide-react';

const ExternalAppointmentCapture: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sync' | 'mapping' | 'logs' | 'settings'>('sync');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('2026-02-17 10:30:45');

  // Mock external systems
  const mockExternalSystems = [
    { id: '1', name: 'Practo', type: 'Doctor Booking', status: 'connected', lastSync: '10 min ago', appointments: 24 },
    { id: '2', name: 'Lybrate', type: 'Healthcare Platform', status: 'connected', lastSync: '15 min ago', appointments: 18 },
    { id: '3', name: '1mg', type: 'Pharmacy + Consult', status: 'disconnected', lastSync: '2 days ago', appointments: 0 },
    { id: '4', name: 'Hospital Website', type: 'Direct Booking', status: 'connected', lastSync: '5 min ago', appointments: 42 },
    { id: '5', name: 'WhatsApp Business', type: 'Messaging', status: 'connected', lastSync: '1 hour ago', appointments: 8 }
  ];

  // Mock pending appointments
  const mockPendingAppointments = [
    {
      id: 'EXT-001',
      source: 'Practo',
      patientName: 'Rajesh Kumar',
      patientPhone: '9876543210',
      doctor: 'Dr. Sharma',
      department: 'Cardiology',
      appointmentDate: '2026-02-18',
      appointmentTime: '10:30',
      status: 'pending',
      externalId: 'PRAC-12345'
    },
    {
      id: 'EXT-002',
      source: 'Lybrate',
      patientName: 'Priya Sharma',
      patientPhone: '9876543211',
      doctor: 'Dr. Patel',
      department: 'Neurology',
      appointmentDate: '2026-02-18',
      appointmentTime: '11:00',
      status: 'pending',
      externalId: 'LYB-67890'
    },
    {
      id: 'EXT-003',
      source: 'Hospital Website',
      patientName: 'Amit Patel',
      patientPhone: '9876543212',
      doctor: 'Dr. Gupta',
      department: 'General Medicine',
      appointmentDate: '2026-02-17',
      appointmentTime: '14:30',
      status: 'duplicate',
      externalId: 'WEB-54321'
    }
  ];

  // Mock sync logs
  const mockSyncLogs = [
    { id: '1', timestamp: '2026-02-17 10:30:45', source: 'Practo', action: 'sync', status: 'success', records: 5 },
    { id: '2', timestamp: '2026-02-17 10:15:30', source: 'Lybrate', action: 'sync', status: 'success', records: 3 },
    { id: '3', timestamp: '2026-02-17 09:45:20', source: '1mg', action: 'sync', status: 'error', records: 0, error: 'API timeout' },
    { id: '4', timestamp: '2026-02-17 09:30:15', source: 'Hospital Website', action: 'sync', status: 'success', records: 8 },
    { id: '5', timestamp: '2026-02-17 09:00:00', source: 'All Systems', action: 'full_sync', status: 'success', records: 16 }
  ];

  const handleSyncNow = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleString());
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 2000);
  };

  const handleApproveAppointment = (appointmentId: string) => {
    alert(`Appointment ${appointmentId} approved and added to system`);
    // In real implementation: Update status, create in main system
  };

  const handleRejectAppointment = (appointmentId: string) => {
    alert(`Appointment ${appointmentId} rejected`);
    // In real implementation: Update status, notify patient
  };

  const handleCheckDuplicate = (appointmentId: string) => {
    alert(`Checking duplicates for ${appointmentId}`);
    // In real implementation: Check against existing appointments
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      duplicate: 'bg-orange-100 text-orange-800'
    };
    
    const labels: Record<string, string> = {
      connected: 'Connected',
      disconnected: 'Disconnected',
      pending: 'Pending',
      success: 'Success',
      error: 'Error',
      duplicate: 'Duplicate'
    };
    
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">External Appointment Capture</h1>
        <p className="text-gray-600">Sync appointments from external booking systems</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Connected Systems</p>
              <p className="text-2xl font-bold">4</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Link className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's External</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Sync</p>
              <p className="text-xl font-bold">{lastSyncTime.split(' ')[1]}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Sync Controls</h2>
            <p className="text-gray-600">Last sync: {lastSyncTime}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleSyncNow}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {syncStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Sync completed successfully</p>
              <p className="text-sm text-green-700">3 new appointments captured</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'sync' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('sync')}
          >
            Sync Status
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'mapping' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('mapping')}
          >
            Pending Approvals
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('logs')}
          >
            Sync Logs
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('settings')}
          >
            System Settings
          </button>
        </div>

        {/* Sync Status Tab */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Connected External Systems</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockExternalSystems.map((system) => (
                <Card key={system.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{system.name}</h4>
                      <p className="text-sm text-gray-600">{system.type}</p>
                    </div>
                    {getStatusBadge(system.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Sync:</span>
                      <span className="font-medium">{system.lastSync}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Appointments:</span>
                      <span className="font-medium">{system.appointments}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Add New External System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                  <Input placeholder="e.g., Google Calendar, Zoho Bookings" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Type</label>
                  <select className="w-full p-2 border rounded">
                    <option>REST API</option>
                    <option>Webhook</option>
                    <option>CSV Import</option>
                    <option>Google Calendar</option>
                    <option>Microsoft Outlook</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <Link className="h-4 w-4 mr-2" />
                    Connect System
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'mapping' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Pending Appointment Approvals</h3>
              <Badge className="bg-yellow-100 text-yellow-800">{mockPendingAppointments.length} pending</Badge>
            </div>

            <div className="space-y-4">
              {mockPendingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg">{appointment.patientName}</h4>
                        <Badge variant="secondary">{appointment.source}</Badge>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <div className="font-medium">{appointment.patientPhone}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Doctor:</span>
                          <div className="font-medium">{appointment.doctor}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Date & Time:</span>
                          <div className="font-medium">{appointment.appointmentDate} at {appointment.appointmentTime}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">External ID:</span>
                          <div className="font-mono text-sm">{appointment.externalId}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      size="sm"
                      onClick={() => handleApproveAppointment(appointment.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Create
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRejectAppointment(appointment.id)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCheckDuplicate(appointment.id)}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Check Duplicate
                    </Button>
                  </div>

                  {appointment.status === 'duplicate' && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Possible duplicate detected</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        Similar appointment found for same patient on same date. Please verify.
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sync Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Sync Activity Logs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockSyncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{log.timestamp}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{log.source}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="secondary">{log.action.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium">{log.records}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.error ? (
                          <span className="text-red-600 text-sm">{log.error}</span>
                        ) : (
                          <span className="text-green-600 text-sm">Success</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800">Integration Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                  <select className="w-full p-2 border rounded">
                    <option>Every 15 minutes</option>
                    <option>Every 30 minutes</option>
                    <option>Every 1 hour</option>
                    <option>Every 2 hours</option>
                    <option>Manual only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto-approve Appointments</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Auto-approve from trusted sources</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-sm">Require manual approval for all</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Send confirmation to patient</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duplicate Check Rules</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Check by phone number</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Check by patient name + date</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-sm">Check by external ID</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Error Handling</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Retry failed syncs (3 attempts)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Send alerts on sync failure</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-sm">Log all API requests</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* API Documentation */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          API Integration Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Webhook Endpoint</h4>
            <code className="block p-2 bg-black text-green-400 rounded text-sm font-mono">
              POST https://api.magnushospital.com/external/appointments
            </code>
            <p className="text-sm text-gray-600 mt-2">
              Send appointment data in JSON format to this endpoint
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">API Key</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-black text-yellow-400 rounded text-sm font-mono">
                mag_apikey_7x9q2w4e8r5t3y1u
              </code>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Include this key in Authorization header
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExternalAppointmentCapture;