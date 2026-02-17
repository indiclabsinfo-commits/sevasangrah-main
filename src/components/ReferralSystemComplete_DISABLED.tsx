import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Download, Eye, Calendar, User, Building, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';

const ReferralSystemComplete: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'track'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock data for demonstration
  const mockReferrals = [
    {
      id: '1',
      patient_name: 'Rajesh Kumar',
      patient_uhid: 'MH-2026-000123',
      referring_department: 'General Medicine',
      target_department: 'Cardiology',
      target_hospital: '',
      referral_type: 'internal',
      priority: 'urgent',
      status: 'pending',
      referral_date: '2026-02-17',
      referral_reason: 'Chest pain evaluation'
    },
    {
      id: '2',
      patient_name: 'Priya Sharma',
      patient_uhid: 'MH-2026-000456',
      referring_department: 'Pediatrics',
      target_department: 'Neurology',
      target_hospital: 'City Neuro Center',
      referral_type: 'external',
      priority: 'routine',
      status: 'accepted',
      referral_date: '2026-02-16',
      referral_reason: 'Headache evaluation'
    },
    {
      id: '3',
      patient_name: 'Amit Patel',
      patient_uhid: 'MH-2026-000789',
      referring_department: 'Orthopedics',
      target_department: 'Physiotherapy',
      target_hospital: '',
      referral_type: 'internal',
      priority: 'emergency',
      status: 'completed',
      referral_date: '2026-02-15',
      referral_reason: 'Post-fracture rehabilitation'
    }
  ];

  const mockDepartments = [
    { id: '1', name: 'General Medicine' },
    { id: '2', name: 'Cardiology' },
    { id: '3', name: 'Neurology' },
    { id: '4', name: 'Orthopedics' },
    { id: '5', name: 'Pediatrics' },
    { id: '6', name: 'Gynecology' },
    { id: '7', name: 'Dermatology' },
    { id: '8', name: 'ENT' },
    { id: '9', name: 'Ophthalmology' },
    { id: '10', name: 'Dentistry' }
  ];

  const [newReferral, setNewReferral] = useState({
    patient_uhid: '',
    patient_name: '',
    referral_type: 'internal',
    referring_department: 'General Medicine',
    target_department: '',
    target_hospital: '',
    referral_reason: '',
    clinical_summary: '',
    priority: 'routine',
    appointment_date: ''
  });

  const filteredReferrals = mockReferrals.filter(ref => {
    const matchesSearch = searchTerm === '' || 
      ref.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.patient_uhid.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    const matchesType = typeFilter === 'all' || ref.referral_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    const labels: Record<string, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      routine: 'bg-gray-100 text-gray-800',
      urgent: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    
    const labels: Record<string, string> = {
      routine: 'Routine',
      urgent: 'Urgent',
      emergency: 'Emergency'
    };
    
    return <Badge className={variants[priority]}>{labels[priority]}</Badge>;
  };

  const handleCreateReferral = () => {
    if (!newReferral.patient_uhid || !newReferral.target_department || !newReferral.referral_reason) {
      toast.error('Please fill in required fields');
      return;
    }

    toast.success('Referral created successfully (mock)');
    setActiveTab('list');
    setNewReferral({
      patient_uhid: '',
      patient_name: '',
      referral_type: 'internal',
      referring_department: 'General Medicine',
      target_department: '',
      target_hospital: '',
      referral_reason: '',
      clinical_summary: '',
      priority: 'routine',
      appointment_date: ''
    });
  };

  const handlePatientSearch = () => {
    if (newReferral.patient_uhid) {
      // Mock patient search
      const mockPatients: Record<string, string> = {
        'MH-2026-000123': 'Rajesh Kumar',
        'MH-2026-000456': 'Priya Sharma',
        'MH-2026-000789': 'Amit Patel'
      };
      
      const patientName = mockPatients[newReferral.patient_uhid];
      if (patientName) {
        setNewReferral(prev => ({ ...prev, patient_name: patientName }));
        toast.success(`Patient found: ${patientName}`);
      } else {
        toast.error('Patient not found. Please check UHID.');
      }
    }
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
                    placeholder="Search by patient name, UHID..."
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
            {filteredReferrals.length === 0 ? (
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
                    {filteredReferrals.map((referral) => (
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
                            {referral.referral_date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <FileText className="h-4 w-4" />
                            </Button>
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Patient UHID *</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter UHID (e.g., MH-2026-000123)"
                        value={newReferral.patient_uhid}
                        onChange={(e) => setNewReferral(prev => ({ ...prev, patient_uhid: e.target.value }))}
                      />
                      <Button 
                        type="button" 
                        onClick={handlePatientSearch}
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Referral Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referral Type *</label>
                    <Select
                      value={newReferral.referral_type}
                      onValueChange={(value) => 
                        setNewReferral(prev => ({ ...prev, referral_type: value as 'internal' | 'external' }))
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
                      onValueChange={(value) => 
                        setNewReferral(prev => ({ ...prev, priority: value as 'routine' | 'urgent' | 'emergency' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referring Department *</label>
                    <Select
                      value={newReferral.referring_department}
                      onValueChange={(value) => 
                        setNewReferral(prev => ({ ...prev, referring_department: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Department *</label>
                    <Select
                      value={newReferral.target_department}
                      onValueChange={(value) => 
                        setNewReferral(prev => ({ ...prev, target_department: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newReferral.referral_type === 'external' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Target Hospital
                    </label>
                    <Input
                      placeholder="Enter hospital name"
                      value={newReferral.target_hospital}
                      onChange={(e) => setNewReferral(prev => ({ ...prev, target_hospital: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Appointment Date (Optional)</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={newReferral.appointment_date}
                      onChange={(e) => setNewReferral(prev => ({ ...prev, appointment_date: e.target.value }))}
                    />
                    <Calendar className