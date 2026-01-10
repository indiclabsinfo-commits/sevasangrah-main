import { useState, useMemo, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Users,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Phone,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SimplePatientForm } from '@/components/forms/SimplePatientForm';
import type { Patient } from '@/types';
import { formatDate, getInitials, formatPhone } from '@/utils';
import dataService from '@/services/dataService';

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Load patients from backend on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading patients from backend API...');
      const data = await dataService.getPatients();
      console.log('✅ Patients loaded:', data?.length || 0);
      setPatients(data || []);
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // Get patient date - prefer date_of_entry, fallback to created_at
      const patientDateStr = patient.date_of_entry || patient.created_at || patient.createdAt;
      if (!patientDateStr) return true; // No date, include patient

      // Parse date and convert to local YYYY-MM-DD string for comparison
      const patientDate = new Date(patientDateStr);
      const patientDateOnly = patientDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format

      if (startDate) {
        const startDateOnly = startDate.toLocaleDateString('en-CA');
        if (patientDateOnly < startDateOnly) {
          return false;
        }
      }
      if (endDate) {
        const endDateOnly = endDate.toLocaleDateString('en-CA');
        if (patientDateOnly > endDateOnly) {
          return false;
        }
      }
      return true;
    });
  }, [patients, startDate, endDate]);

  const columns: Column<Patient>[] = [
    {
      key: 'first_name',
      header: 'Patient',
      render: (_, patient) => {
        const firstName = patient.first_name || patient.firstName || '';
        const lastName = patient.last_name || patient.lastName || '';
        return (
          <div className="flex items-center">
            <Avatar
              fallback={getInitials(firstName, lastName)}
              size="md"
              className="bg-primary-100 text-primary-700"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-gray-500">{patient.email || 'N/A'}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (_, patient) => (
        <div>
          <p className="text-sm text-gray-900">{formatPhone(patient.phone)}</p>
          <p className="text-sm text-gray-500">{patient.email}</p>
        </div>
      ),
    },
    {
      key: 'age',
      header: 'Age/Gender',
      render: (_, patient) => {
        const age = patient.age || (patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A');
        return (
          <div>
            <p className="text-sm text-gray-900">{age} {typeof age === 'number' ? 'years' : ''}</p>
            <Badge variant="neutral" size="sm">
              {patient.gender || 'N/A'}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (bloodGroup) => (
        <Badge variant="error" size="sm">
          {bloodGroup || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'date_of_entry',
      header: 'Entry Date',
      render: (_, patient) => (
        <span className="text-sm text-gray-500">
          {formatDate(patient.date_of_entry || patient.created_at || patient.createdAt)}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_, patient) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewPatient(patient)}
            className="!p-2"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditPatient(patient)}
            className="!p-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeletePatient(patient.id)}
            className="!p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleAddPatient = async (data: any) => {
    setIsLoading(true);
    try {
      // Convert form data to backend format
      const patientData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || '',
        phone: data.phone,
        address: data.address,
        gender: data.gender?.toUpperCase() || 'M',
        blood_group: data.bloodGroup || '',
        date_of_entry: new Date().toISOString(),
        // Calculate age from dateOfBirth if provided
        age: data.dateOfBirth ?
          Math.floor((new Date().getTime() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) :
          null,
        is_active: true,
      };

      console.log('📡 Creating patient via backend API:', patientData);

      // Create patient in backend database
      const newPatient = await dataService.createPatient(patientData);
      console.log('✅ Patient created successfully:', newPatient);

      // Reload all patients from backend to ensure list is in sync
      await loadPatients();

      setIsAddModalOpen(false);
      toast.success('Patient added successfully!');
    } catch (error) {
      console.error('❌ Error creating patient:', error);
      toast.error('Failed to add patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async (data: any) => {
    if (!selectedPatient) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedPatient: Patient = {
        ...selectedPatient,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        updatedAt: new Date(),
      };

      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setIsEditModalOpen(false);
      setSelectedPatient(null);
      toast.success('Patient updated successfully!');
    } catch (error) {
      toast.error('Failed to update patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setPatients(prev => prev.filter(p => p.id !== patientId));
      toast.success('Patient deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const handleExport = () => {
    // Simulate export functionality
    toast.success('Patients exported successfully!');
  };

  const handleImport = () => {
    // Simulate import functionality
    toast.success('Import feature coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">
            Manage your patients and their medical information
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center space-x-2 border border-gray-300 rounded-md p-2">
            <span className="text-sm font-medium text-gray-700">Filter by date:</span>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="From"
              className="w-28 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="To"
              className="w-28 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={handleImport}>
            Import
          </Button>
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Export
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsAddModalOpen(true)}>
            Add Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
              <p className="text-sm text-gray-500">Total Patients</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {filteredPatients.filter(p => {
                  const today = new Date().toLocaleDateString('en-CA');
                  const patientDate = new Date(p.date_of_entry || p.created_at || p.createdAt).toLocaleDateString('en-CA');
                  return patientDate === today;
                }).length}
              </p>
              <p className="text-sm text-gray-500">New Today</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter(p => p.emergencyContact || p.emergency_contact_phone).length}
              </p>
              <p className="text-sm text-gray-500">With Emergency Contact</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Patients Table */}
      <Table
        data={filteredPatients}
        columns={columns}
        searchable
        searchPlaceholder="Search patients..."
        emptyState={
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No patients found</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add your first patient
            </Button>
          </div>
        }
      />

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Patient"
        size="xl"
        showFooter={false}
      >
        <SimplePatientForm
          onSubmit={handleAddPatient}
          onCancel={() => setIsAddModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient"
        size="xl"
        showFooter={false}
      >
        <SimplePatientForm
          onSubmit={handleUpdatePatient}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>

      {/* View Patient Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Patient Details"
        size="lg"
        showFooter={false}
      >
        {selectedPatient && (() => {
          const firstName = selectedPatient.first_name || selectedPatient.firstName || '';
          const lastName = selectedPatient.last_name || selectedPatient.lastName || '';
          const emergencyContactName = selectedPatient.emergency_contact_name || selectedPatient.emergencyContact?.name;
          const emergencyContactPhone = selectedPatient.emergency_contact_phone || selectedPatient.emergencyContact?.phone;

          return (
            <div className="space-y-6">
              <div className="text-center">
                <Avatar
                  fallback={getInitials(firstName, lastName)}
                  size="xl"
                  className="mx-auto bg-primary-100 text-primary-700"
                />
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {firstName} {lastName}
                </h3>
                <p className="text-gray-500">{selectedPatient.email || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Phone:</strong> {formatPhone(selectedPatient.phone)}</p>
                    <p><strong>Email:</strong> {selectedPatient.email || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedPatient.address || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Age:</strong> {selectedPatient.age || 'N/A'} {typeof selectedPatient.age === 'number' ? 'years' : ''}</p>
                    <p><strong>Gender:</strong> {selectedPatient.gender || 'N/A'}</p>
                    <p><strong>Blood Group:</strong> {selectedPatient.bloodGroup || selectedPatient.blood_group || 'N/A'}</p>
                  </div>
                </div>

                {(emergencyContactName || emergencyContactPhone) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {emergencyContactName || 'N/A'}</p>
                      <p><strong>Phone:</strong> {emergencyContactPhone ? formatPhone(emergencyContactPhone) : 'N/A'}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Medical History:</strong> {selectedPatient.medicalHistory?.join(', ') || selectedPatient.medical_history || 'None'}</p>
                    <p><strong>Allergies:</strong> {selectedPatient.allergies?.join(', ') || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};