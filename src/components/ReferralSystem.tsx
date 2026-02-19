import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjusted path
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
// import { Textarea } from './ui/textarea'; // Not available
// import { Select, ... } from './ui/select'; // Not available
import { Badge } from './ui/Badge';
import { Search, Download, Send, Eye } from 'lucide-react';
import toast from 'react-hot-toast'; // Changed from sonner

// Types
interface Referral {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_uhid: string;
  referring_doctor_id: string;
  referring_doctor_name: string;
  referring_department: string;
  target_doctor_id?: string;
  target_doctor_name?: string;
  target_department: string;
  target_hospital?: string;
  referral_type: 'internal' | 'external';
  referral_date: string;
  referral_reason: string;
  clinical_summary: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'emergency';
  appointment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

const ReferralSystem: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'track'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // New referral form state
  const [newReferral, setNewReferral] = useState({
    patient_id: '',
    patient_name: '',
    patient_uhid: '',
    referral_type: 'internal' as 'internal' | 'external',
    referring_department: '',
    target_department: '',
    target_hospital: '',
    target_doctor_id: '',
    referral_reason: '',
    clinical_summary: '',
    priority: 'routine' as 'routine' | 'urgent' | 'emergency',
    appointment_date: '',
    notes: ''
  });

  // Fetch referrals
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array to prevent crash
        console.error('Error fetching referrals:', error);
        return [];
      }
      return data as Referral[];
    }
  });

  // Fetch doctors
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, department, specialization')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }
      return data as Doctor[];
    }
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description');

      if (error) {
        console.error('Error fetching departments:', error);
        return [];
      }
      return data as Department[];
    }
  });

  // Create referral mutation
  const createReferral = useMutation({
    mutationFn: async (referralData: Partial<Referral>) => {
      const { data, error } = await supabase
        .from('referrals')
        .insert([{
          ...referralData,
          referral_date: new Date().toISOString(),
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast.success('Referral created successfully');
      setActiveTab('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create referral: ${error.message}`);
    }
  });

  // Update referral status
  const updateReferralStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Referral['status'] }) => {
      const { data, error } = await supabase
        .from('referrals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast.success('Referral status updated');
    }
  });

  const resetForm = () => {
    setNewReferral({
      patient_id: '',
      patient_name: '',
      patient_uhid: '',
      referral_type: 'internal',
      referring_department: '',
      target_department: '',
      target_hospital: '',
      target_doctor_id: '',
      referral_reason: '',
      clinical_summary: '',
      priority: 'routine',
      appointment_date: '',
      notes: ''
    });
  };

  const handleCreateReferral = () => {
    if (!newReferral.patient_id || !newReferral.target_department || !newReferral.referral_reason) {
      toast.error('Please fill in required fields');
      return;
    }

    createReferral.mutate({
      ...newReferral,
      referring_doctor_id: 'current-doctor-id',
      referring_doctor_name: 'Current Doctor',
      referring_department: newReferral.referring_department || 'General Medicine'
    });
  };

  const handlePatientSearch = async (uhid: string) => {
    if (!uhid) return;

    const { data, error } = await supabase
      .from('patients')
      .select('id, name, uhid') // Note: 'name' might need to be constructed from first_name + last_name
      .eq('uhid', uhid)
      .single();

    if (data && !error) {
      setNewReferral(prev => ({
        ...prev,
        patient_id: data.id,
        patient_name: data.name, // Adjust if name is split
        patient_uhid: data.uhid
      }));
      toast.success(`Patient found: ${data.name}`);
    } else {
      toast.error('Patient not found');
    }
  };

  const filteredReferrals = referrals?.filter(ref => {
    const matchesSearch = searchTerm === '' ||
      ref.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.patient_uhid.includes(searchTerm) ||
      ref.target_department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    const matchesType = typeFilter === 'all' || ref.referral_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Referral['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    return <Badge className={variants[status]} variant={status === 'pending' ? 'warning' : status === 'accepted' ? 'primary' : 'default'}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: Referral['priority']) => {
    const variants = {
      routine: 'bg-gray-100 text-gray-800',
      urgent: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };

    const labels = {
      routine: 'Routine',
      urgent: 'Urgent',
      emergency: 'Emergency'
    };

    return <Badge className={variants[priority]} variant={priority === 'emergency' ? 'danger' : priority === 'urgent' ? 'warning' : 'default'}>{labels[priority]}</Badge>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Referral Management System</h1>
        <p className="text-gray-600">Manage internal and external patient referrals</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 border-gray-200">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('list')}
        >
          All Referrals
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('create')}
        >
          Create Referral
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'track' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('track')}
        >
          Track & Analytics
        </button>
      </div>

      {activeTab === 'list' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">All Referrals</h3>
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
                <select
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading referrals...</div>
            ) : filteredReferrals?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No referrals found. Create your first referral.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                    {filteredReferrals?.map((referral) => (
                      <tr key={referral.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{referral.patient_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{referral.patient_uhid}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div>{referral.referring_department}</div>
                            <div className="text-gray-500">→ {referral.target_department}</div>
                            {referral.target_hospital && (
                              <div className="text-xs text-gray-400">{referral.target_hospital}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={referral.referral_type === 'internal' ? 'primary' : 'default'}>
                            {referral.referral_type === 'internal' ? 'Internal' : 'External'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(referral.priority)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(referral.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {new Date(referral.referral_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {referral.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => updateReferralStatus.mutate({ id: referral.id, status: 'accepted' })}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => updateReferralStatus.mutate({ id: referral.id, status: 'rejected' })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'create' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-6">Create New Referral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Patient UHID *</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter UHID"
                        value={newReferral.patient_uhid}
                        onChange={(e) => {
                          setNewReferral(prev => ({ ...prev, patient_uhid: e.target.value }));
                          if (e.target.value.length === 13) {
                            handlePatientSearch(e.target.value);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => handlePatientSearch(newReferral.patient_uhid)}
                      >
                        Search
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Patient Name</label>
                    <Input
                      placeholder="Auto-filled from UHID"
                      value={newReferral.patient_name}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Referral Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Referral Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referral Type *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={newReferral.referral_type}
                      onChange={(e) =>
                        setNewReferral(prev => ({ ...prev, referral_type: e.target.value as any }))
                      }
                    >
                      <option value="internal">Internal (Within Hospital)</option>
                      <option value="external">External (To Other Hospital)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={newReferral.priority}
                      onChange={(e) =>
                        setNewReferral(prev => ({ ...prev, priority: e.target.value as any }))
                      }
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Department *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={newReferral.target_department}
                    onChange={(e) => setNewReferral(prev => ({ ...prev, target_department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {departments?.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for Referral *</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    placeholder="Clinical reason..."
                    value={newReferral.referral_reason}
                    onChange={(e) => setNewReferral(prev => ({ ...prev, referral_reason: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleCreateReferral}>
                <Send className="w-4 h-4 mr-2" />
                Create Referral
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'track' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-6">Track & Analytics</h3>
            <div className="text-center py-8 text-gray-500">
              Analytics module coming soon...
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReferralSystem;