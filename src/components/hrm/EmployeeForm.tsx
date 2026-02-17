import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X,
  Save,
  User,
  Briefcase,
  DollarSign,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  AlertCircle,
  Calendar as CalendarIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import hrmService from '../../services/hrmService';
import type { EmployeeMasterFormData } from '../../types/hrm';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  employeeId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 'personal', title: 'Personal', subtitle: 'Basic Info & Contact', icon: User },
  { id: 'professional', title: 'Professional', subtitle: 'Role & Department', icon: Briefcase },
  { id: 'financial', title: 'Financial', subtitle: 'Salary & Statutory', icon: DollarSign },
  { id: 'documents', title: 'Documents', subtitle: 'Uploads & Proofs', icon: FileText },
];

const EmployeeForm: React.FC<Props> = ({ employeeId, onClose, onSuccess }) => {
  const { hasRole, isAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EmployeeMasterFormData>({
    staff_unique_id: '',
    first_name: '',
    last_name: '',
    employment_status: 'Permanent',
    job_title: '',
    department_id: '',
    role_id: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    reporting_manager_id: '',
    date_of_birth: '',
    gender: '',
    work_email: '',
    personal_phone: '',
    residential_address: '',
    basic_salary: 0,
    bank_account_number: '',
    pan_card_number: '',
    aadhaar_number: '',
    hpr_number: '',
    photo_url: '',
    aadhaar_doc_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission checks - Expanded to ensure admins can always edit
  const canEditSensitive = hasRole(['admin', 'hr_manager']) || isAdmin();
  const canEditRole = hasRole(['admin', 'hr_manager']) || isAdmin();

  // Fetch employee data if editing
  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee-master', employeeId],
    queryFn: () => (employeeId ? hrmService.getEmployeeMasterById(employeeId) : null),
    enabled: !!employeeId,
  });

  // Fetch departments and roles
  const { data: departments } = useQuery({
    queryKey: ['employee-departments'],
    queryFn: () => hrmService.getDepartments(),
  });

  const { data: roles } = useQuery({
    queryKey: ['employee-roles'],
    queryFn: () => hrmService.getRoles(),
  });

  const { data: employees } = useQuery({
    queryKey: ['active-employee-masters'],
    queryFn: () => hrmService.getEmployeeMasters({ is_active: true }),
  });

  // Load employee data when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        staff_unique_id: employee.staff_unique_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        employment_status: employee.employment_status,
        job_title: employee.job_title,
        department_id: employee.department_id,
        role_id: employee.role_id,
        date_of_joining: employee.date_of_joining,
        reporting_manager_id: employee.reporting_manager_id || '',
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        work_email: employee.work_email,
        personal_phone: employee.personal_phone,
        residential_address: employee.residential_address,
        basic_salary: employee.basic_salary,
        bank_account_number: employee.bank_account_number,
        pan_card_number: employee.pan_card_number || '',
        aadhaar_number: employee.aadhaar_number || '',
        hpr_number: employee.hpr_number || '',
        photo_url: employee.photo_url || '',
        aadhaar_doc_url: employee.aadhaar_doc_url || '',
      });
    }
  }, [employee]);

  // Generate ID if adding new
  useEffect(() => {
    if (!employeeId && !formData.staff_unique_id) {
      hrmService.generateStaffUniqueId().then((id) => {
        setFormData((prev) => ({ ...prev, staff_unique_id: id }));
      });
    }
  }, [employeeId, formData.staff_unique_id]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (step === 0) { // Personal & Contact
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.work_email) newErrors.work_email = 'Work email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.work_email)) newErrors.work_email = 'Invalid email format';
      if (!formData.personal_phone) newErrors.personal_phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.personal_phone.replace(/\D/g, ''))) newErrors.personal_phone = 'Phone must be 10 digits';
      if (!formData.residential_address) newErrors.residential_address = 'Address is required';
    }

    if (step === 1) { // Professional
      if (!formData.job_title) newErrors.job_title = 'Job title is required';
      if (!formData.department_id) newErrors.department_id = 'Department is required';
      if (!formData.role_id) newErrors.role_id = 'Role is required';
      if (!formData.date_of_joining) newErrors.date_of_joining = 'Joining date is required';
      if (!formData.employment_status) newErrors.employment_status = 'Employment status is required';
    }

    if (step === 2) { // Financial
      if (canEditSensitive) {
        if (formData.basic_salary <= 0) newErrors.basic_salary = 'Basic salary must be greater than 0';
        if (!formData.bank_account_number) newErrors.bank_account_number = 'Bank account is required';
        if (formData.pan_card_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_card_number)) {
          newErrors.pan_card_number = 'Invalid PAN format (e.g., ABCDE1234F)';
        }
        if (formData.aadhaar_number) {
          // Remove spaces and dashes for validation
          const cleanAadhaar = formData.aadhaar_number.replace(/[\s-]/g, '');
          if (!/^\d{12}$/.test(cleanAadhaar)) {
            newErrors.aadhaar_number = 'Aadhaar number must be exactly 12 digits';
          } else {
            // Update with clean version
            formData.aadhaar_number = cleanAadhaar;
          }
        }
      }
      if (formData.job_title.toLowerCase().includes('doctor') || formData.job_title.toLowerCase().includes('nurse')) {
        if (!formData.hpr_number) newErrors.hpr_number = 'HPR Number is required for medical staff';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
      toast.error('Please fix the highlighted errors');
    } else {
      setErrors({});
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      if (employeeId) {
        await hrmService.updateEmployeeMaster(employeeId, formData);
        toast.success('Employee updated successfully');
      } else {
        await hrmService.createEmployeeMaster(formData);
        toast.success('Employee created successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.details) console.error('Supabase Error Details:', error.details);
      if (error.hint) console.error('Supabase Error Hint:', error.hint);

      toast.error(error.message || 'Failed to save employee. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileUpload = (field: 'photo_url' | 'aadhaar_doc_url') => {
    // Mock upload for now
    toast.success('File uploaded successfully (Mock)');
    setFormData(prev => ({ ...prev, [field]: `https://example.com/${field}_${Date.now()}.jpg` }));
  };

  if (loadingEmployee) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {employeeId ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {STEPS[currentStep].title} — {STEPS[currentStep].subtitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-8 py-6 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between relative">
          {/* Progress Bar Background */}
          <div className="absolute left-0 w-full h-1 bg-gray-100 top-5 -z-0 hidden md:block rounded-full" />

          {/* Active Progress Bar */}
          <div
            className="absolute left-0 h-1 bg-primary-600 top-5 -z-0 hidden md:block rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="mt-2 text-center hidden md:block">
                  <p
                    className={`text-sm font-semibold transition-colors ${isActive ? 'text-primary-700' : 'text-gray-500'
                      }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8 bg-gray-50/30 flex-1 custom-scrollbar">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.first_name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all`}
                        placeholder="John"
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.first_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.last_name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all`}
                        placeholder="Doe"
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.date_of_birth ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.date_of_birth && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.date_of_birth}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.gender ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.gender}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MailIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          name="work_email"
                          value={formData.work_email}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.work_email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                          placeholder="john.doe@hospital.com"
                        />
                      </div>
                      {errors.work_email && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.work_email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          name="personal_phone"
                          value={formData.personal_phone}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.personal_phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                          placeholder="9876543210"
                        />
                      </div>
                      {errors.personal_phone && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.personal_phone}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Residential Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                          name="residential_address"
                          value={formData.residential_address}
                          onChange={handleChange}
                          rows={3}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.residential_address ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                          placeholder="Full address with pincode"
                        />
                      </div>
                      {errors.residential_address && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.residential_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Employment Details */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
                    Employment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Staff ID
                      </label>
                      <input
                        type="text"
                        value={formData.staff_unique_id}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Joining <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="date_of_joining"
                          value={formData.date_of_joining}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.date_of_joining ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.date_of_joining && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.date_of_joining}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.department_id ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all`}
                      >
                        <option value="">Select Department</option>
                        {departments?.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      {errors.department_id && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.department_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.job_title ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all`}
                        placeholder="e.g. Senior Nurse"
                      />
                      {errors.job_title && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.job_title}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="role_id"
                        value={formData.role_id}
                        onChange={handleChange}
                        disabled={!canEditRole}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.role_id ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all disabled:bg-gray-100 disabled:text-gray-500`}
                      >
                        <option value="">Select Role</option>
                        {roles?.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.role_name}
                          </option>
                        ))}
                      </select>
                      {errors.role_id && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.role_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employment Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="employment_status"
                        value={formData.employment_status}
                        onChange={handleChange}
                        disabled={!canEditRole}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.employment_status ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                          } focus:border-primary-500 focus:ring-4 transition-all disabled:bg-gray-100 disabled:text-gray-500`}
                      >
                        <option value="">Select Status</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Trainee">Trainee</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      {errors.employment_status && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.employment_status}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reporting Manager
                      </label>
                      <select
                        name="reporting_manager_id"
                        value={formData.reporting_manager_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-primary-100 focus:border-primary-500 focus:ring-4 transition-all"
                      >
                        <option value="">Select Manager (Optional)</option>
                        {employees?.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} ({emp.job_title})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Financial Information */}
            {currentStep === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {canEditSensitive ? (
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                      Financial Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Basic Salary <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            name="basic_salary"
                            value={formData.basic_salary}
                            onChange={handleChange}
                            className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${errors.basic_salary ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                              } focus:border-primary-500 focus:ring-4 transition-all`}
                            placeholder="0.00"
                          />
                        </div>
                        {errors.basic_salary && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.basic_salary}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="bank_account_number"
                          value={formData.bank_account_number}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${errors.bank_account_number ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                          placeholder="Account Number"
                        />
                        {errors.bank_account_number && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.bank_account_number}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN Card Number
                        </label>
                        <input
                          type="text"
                          name="pan_card_number"
                          value={formData.pan_card_number}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${errors.pan_card_number ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all uppercase`}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                        {errors.pan_card_number && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.pan_card_number}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aadhaar Number
                        </label>
                        <input
                          type="text"
                          name="aadhaar_number"
                          value={formData.aadhaar_number}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${errors.aadhaar_number ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                          placeholder="1234 5678 9012"
                          maxLength={12}
                        />
                        {errors.aadhaar_number && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.aadhaar_number}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          HPR Number (Medical Staff)
                        </label>
                        <input
                          type="text"
                          name="hpr_number"
                          value={formData.hpr_number}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${errors.hpr_number ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100'
                            } focus:border-primary-500 focus:ring-4 transition-all`}
                          placeholder="Healthcare Professional ID"
                        />
                        {errors.hpr_number && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.hpr_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-yellow-900">Restricted Access</h3>
                    <p className="text-yellow-700 mt-1">You do not have permission to view or edit financial information.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 3 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary-600" />
                    Document Uploads
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                      onClick={() => handleFileUpload('photo_url')}>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Profile Photo</h4>
                      <p className="text-sm text-gray-500 mt-1">Click to upload or drag and drop</p>
                      {formData.photo_url && (
                        <div className="mt-4 flex items-center justify-center text-green-600 text-sm font-medium">
                          <Check className="w-4 h-4 mr-1" /> Uploaded
                        </div>
                      )}
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                      onClick={() => handleFileUpload('aadhaar_doc_url')}>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                        <FileText className="w-8 h-8 text-gray-400 group-hover:text-primary-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Aadhaar Card</h4>
                      <p className="text-sm text-gray-500 mt-1">Click to upload or drag and drop</p>
                      {formData.aadhaar_doc_url && (
                        <div className="mt-4 flex items-center justify-center text-green-600 text-sm font-medium">
                          <Check className="w-4 h-4 mr-1" /> Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="border-gray-300 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 hover:bg-white"
          >
            Cancel
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Employee
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
