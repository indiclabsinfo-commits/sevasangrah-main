import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Filter, Download, Send, Eye, Edit, Trash2, Calendar, User, Building } from 'lucide-react';
import { toast } from 'sonner';

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
      
      if (error) throw error;
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
      
      if (error) throw error;
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
      
      if (error) throw error;
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
    onError: (error) => {
      toast.error(`Failed to create referral: ${error.message}`);
    }
  });

  // Update referral status
  const updateReferralStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Referral['status'] }) => {
      const { data, error } = await supabase
        .from('referrals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id, status)
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
      .select('id, name, uhid')
      .eq('uhid', uhid)
      .single();
    
    if (data && !error) {
      setNewReferral(prev => ({
        ...prev,
        patient_id: data.id,
        patient_name: data.name,
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
    
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
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
    
    return <Badge className={variants[priority]}>{labels[priority]}</Badge>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Referral Management System</h1>
        <p className="text-gray-600">Manage internal and external patient referrals</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('list')}
        >
          All Referrals
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'create' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('create')}
        >
          Create Referral
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'track' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('track')}
        >
          Track & Analytics
        </button>
      </div>

      {activeTab === 'list' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Referrals</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by patient name, UHID, department..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading referrals...</div>
            ) : filteredReferrals?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No referrals found. Create your first referral.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>UHID</TableHead>
                      <TableHead>From → To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals?.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.patient_name}</TableCell>
                        <TableCell className="font-mono text-sm">{referral.patient_uhid}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{referral.referring_department}</div>
                            <div className="text-gray-500">→ {referral.target_department}</div>
                            {referral.target_hospital && (
                              <div className="text-xs text-gray-400">{referral.target_hospital}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={referral.referral_type === 'internal' ? 'default' : 'secondary'}>
                            {referral.referral_type === 'internal' ? 'Internal' : 'External'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(referral.priority)}</TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(referral.referral_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {referral.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateReferralStatus.mutate({ id: referral.id, status: 'accepted' })}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateReferralStatus.mutate({ id: referral.id, status: 'rejected' })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Referral</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <Select
                      value={newReferral.referral_type}
                      onValueChange={(value: 'internal' | 'external') => 
                        setNewReferral(prev => ({ ...prev, referral_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal (Within Hospital)</SelectItem>
                        <SelectItem value="external">External (To Other Hospital)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority *</label>
                    <Select
                      value={newReferral.priority}
                      onValueChange={(value: 'routine' | 'urgent' | 'emergency') => 
                        setNewReferral(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </