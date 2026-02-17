import React from 'react';
import ReferralSystemComplete from '../components/ReferralSystemComplete';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart3, FileText, Send, Users } from 'lucide-react';

const ReferralManagement: React.FC = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referral Management</h1>
        <p className="text-gray-600">Comprehensive system for managing patient referrals within and outside the hospital</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Response Time</p>
                <p className="text-2xl font-bold">4.2h</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">Referral System</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="referrals">
          <ReferralSystemComplete />
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Referral Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Referrals by Department</h3>
                    <div className="space-y-2">
                      {[
                        { department: 'Cardiology', count: 8, color: 'bg-blue-500' },
                        { department: 'Neurology', count: 6, color: 'bg-green-500' },
                        { department: 'Orthopedics', count: 5, color: 'bg-yellow-500' },
                        { department: 'General Medicine', count: 3, color: 'bg-purple-500' },
                        { department: 'Pediatrics', count: 2, color: 'bg-pink-500' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{item.department}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${item.color} rounded-full`}
                                style={{ width: `${(item.count / 24) * 100}%` }}
                              />
                            </div>
                            <span className="font-medium">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Status Distribution</h3>
                    <div className="space-y-2">
                      {[
                        { status: 'Pending', count: 8, color: 'bg-yellow-500' },
                        { status: 'Accepted', count: 6, color: 'bg-blue-500' },
                        { status: 'Completed', count: 7, color: 'bg-green-500' },
                        { status: 'Rejected', count: 2, color: 'bg-red-500' },
                        { status: 'Cancelled', count: 1, color: 'bg-gray-500' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span>{item.status}</span>
                          </div>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Monthly Trends</h3>
                  <div className="flex items-end h-32 gap-1">
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
                            title={`Internal: ${item.internal}`}
                          />
                          <div 
                            className="w-4 bg-green-500 rounded-t"
                            style={{ height: `${item.external * 10}px` }}
                            title={`External: ${item.external}`}
                          />
                        </div>
                        <span className="text-xs mt-1">{item.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-sm">Internal Referrals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-sm">External Referrals</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Referral System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Default Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Priority</label>
                      <select className="w-full p-2 border rounded">
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Response Time (hours)</label>
                      <input type="number" className="w-full p-2 border rounded" defaultValue="24" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Notification Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span>Email notifications for new referrals</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span>SMS alerts for urgent referrals</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span>WhatsApp notifications</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">External Hospital Directory</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Hospital name" 
                        className="flex-1 p-2 border rounded"
                      />
                      <input 
                        type="text" 
                        placeholder="Specialization" 
                        className="flex-1 p-2 border rounded"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Add
                      </button>
                    </div>
                    <div className="border rounded divide-y">
                      {[
                        { name: 'City Neuro Center', specialization: 'Neurology' },
                        { name: 'Heart Care Hospital', specialization: 'Cardiology' },
                        { name: 'Bone & Joint Clinic', specialization: 'Orthopedics' }
                      ].map((hospital, index) => (
                        <div key={index} className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{hospital.name}</p>
                            <p className="text-sm text-gray-500">{hospital.specialization}</p>
                          </div>
                          <button className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Save Settings
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralManagement;