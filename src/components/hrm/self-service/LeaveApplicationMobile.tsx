import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Send,
  ChevronRight,
  Upload,
  X
} from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  onBack?: () => void;
  onSuccess?: () => void;
}

const LeaveApplicationMobile: React.FC<Props> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false,
    documents: [] as File[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch leave types
  const { data: leaveTypes, isLoading: loadingLeaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => hrmService.getLeaveTypes(),
  });

  // Create leave application mutation
  const createLeaveMutation = useMutation({
    mutationFn: (data: any) => hrmService.createLeaveApplication(data),
    onSuccess: () => {
      toast.success('Leave application submitted successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit leave application');
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.leave_type_id) newErrors.leave_type_id = 'Please select leave type';
    if (!formData.start_date) newErrors.start_date = 'Please select start date';
    if (!formData.end_date) newErrors.end_date = 'Please select end date';
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) newErrors.end_date = 'End date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData = {
      employee_id: user?.id,
      ...formData,
      status: 'pending',
    };

    createLeaveMutation.mutate(submitData);
  };

  const getLeaveTypeColor = (typeCode: string) => {
    switch (typeCode) {
      case 'CL': return 'bg-blue-100 text-blue-800';
      case 'SL': return 'bg-green-100 text-green-800';
      case 'EL': return 'bg-purple-100 text-purple-800';
      case 'ML': return 'bg-pink-100 text-pink-800';
      case 'PL': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">Apply for Leave</h1>
            <div className="text-sm text-gray-600">Fill in the details below</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Leave Type Selection */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Leave Type *</h3>
          <div className="grid grid-cols-2 gap-3">
            {leaveTypes?.map((type) => (
              <button
                key={type.id}
                onClick={() => handleInputChange('leave_type_id', type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.leave_type_id === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(type.code)}`}>
                    {type.code}
                  </span>
                </div>
                <div className="font-medium text-gray-900">{type.name}</div>
                <div className="text-sm text-gray-600 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
          {errors.leave_type_id && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.leave_type_id}
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Dates *</h3>
          
          {/* Half Day Toggle */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_half_day}
                onChange={(e) => handleInputChange('is_half_day', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.is_half_day ? 'bg-primary-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.is_half_day ? 'left-7' : 'left-1'
                }`} />
              </div>
              <span className="ml-3 font-medium text-gray-900">Half Day Leave</span>
            </label>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              {errors.start_date && (
                <div className="mt-1 text-sm text-red-600">{errors.start_date}</div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              {errors.end_date && (
                <div className="mt-1 text-sm text-red-600">{errors.end_date}</div>
              )}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Reason for Leave *</h3>
          <textarea
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            rows={4}
            placeholder="Please provide details about why you need leave..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
          {errors.reason && (
            <div className="mt-1 text-sm text-red-600">{errors.reason}</div>
          )}
        </div>

        {/* Documents */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Supporting Documents</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              id="document-upload"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="document-upload" className="cursor-pointer">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-primary-600" />
              </div>
              <div className="font-medium text-gray-900">Upload Documents</div>
              <div className="text-sm text-gray-600 mt-1">
                Medical certificate, travel tickets, etc.
              </div>
            </label>
          </div>

          {/* Uploaded Files */}
          {formData.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.documents.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={createLeaveMutation.isPending}
        >
          {createLeaveMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Leave Application
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Approval Process</div>
              <div className="text-sm text-gray-700 mt-1">
                Your leave application will be sent to your reporting manager for approval.
                You will receive notifications at each stage of the approval process.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationMobile;