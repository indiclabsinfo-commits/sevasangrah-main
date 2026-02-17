import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Download, Eye, Send, Users, BarChart3, FileText } from 'lucide-react';

const ReferralManagementSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'referrals' | 'analytics'>('referrals');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const mockReferrals = [
    {
      id: '1',
      patientName: 'Rajesh Kumar',
      patientUHID: 'MH-2026-000123',
      fromDepartment: 'General Medicine',
      toDepartment: 'Cardiology',
      type: 'internal',
      priority: 'urgent',
      status: 'pending',
      date: '2026-02-17'
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      patientUHID: 'MH-2026-000456',
      fromDepartment: 'Pediatrics',
      toDepartment: 'Neurology',
      type: 'external',
      priority: 'routine',
      status: 'accepted',
      date: '2026-02-16'
    },
    {
      id: '3',
      patientName: 'Amit Patel',
      patientUHID: 'MH-2026-000789',
      fromDepartment: 'Orthopedics',
      toDepartment: 'Physiotherapy',
      type: 'internal',
      priority: 'emergency',
      status: 'completed',
      date: '2026-02-15'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      routine: 'bg-gray-100 text-gray-800',
      urgent: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[priority]}>{priority}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referral Management</h1>
        <p className="text-gray-600">Manage patient referrals within and outside the hospital</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Referrals</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <p className="text-2xl font-bold">4.2h</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'referrals' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('referrals')}
        >
          Referrals
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'referrals' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">All Referrals</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search referrals..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                New Referral
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UHID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From → To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockReferrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{referral.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{referral.patientUHID}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div>{referral.fromDepartment}</div>
                        <div className="text-gray-500">→ {referral.toDepartment}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={referral.type === 'internal' ? 'default' : 'secondary'}>
                        {referral.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(referral.priority)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(referral.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{referral.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Referral Analytics</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Referrals by Department</h3>
              <div className="space-y-3">
                {[
                  { department: 'Cardiology', count: 8, percentage: 33 },
                  { department: 'Neurology', count: 6, percentage: 25 },
                  { department: 'Orthopedics', count: 5, percentage: 21 },
                  { department: 'General Medicine', count: 3, percentage: 13 },
                  { department: 'Pediatrics', count: 2, percentage: 8 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-32 text-sm">{item.department}</div>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-medium">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Monthly Trends</h3>
              <div className="flex items-end h-32 gap-2">
                {[
                  { month: 'Jan', internal: 4, external: 2 },
                  { month: 'Feb', internal: 6, external: 3 },
                  { month: 'Mar', internal: 5, external: 4 },
                  { month: 'Apr', internal: 7, external: 2 },
                  { month: 'May', internal: 8, external: 3 },
                  { month: 'Jun', internal: 6, external: 5 }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="flex items-end gap-1 w-full justify-center">
                      <div 
                        className="w-4 bg-blue-500 rounded-t"
                        style={{ height: `${item.internal * 10}px` }}
                      />
                      <div 
                        className="w-4 bg-green-500 rounded-t"
                        style={{ height: `${item.external * 10}px` }}
                      />
                    </div>
                    <span className="text-xs mt-2">{item.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-sm">Internal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm">External</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReferralManagementSimple;