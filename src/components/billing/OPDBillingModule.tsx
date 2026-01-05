import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import { Plus, Search, Edit, Printer, Download, X, Calendar, User, Stethoscope, Trash2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import DoctorService, { type DoctorInfo } from '../../services/doctorService';
import BillingService, { type OPDBill } from '../../services/billingService';
import type { PatientWithRelations } from '../../config/supabaseNew';
import ReceiptTemplate from '../receipts/ReceiptTemplate';
import { logger } from '../../utils/logger';

interface OPDBillFormData {
  patientId: string;
  doctorId: string;
  consultationFee: number;
  investigationCharges: number;
  medicineCharges: number;
  otherCharges: number;
  discount: number;
  discountReason: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  services: string[];
  notes: string;
}

const OPDBillingModule: React.FC = () => {
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [opdBills, setOpdBills] = useState<OPDBill[]>([]);
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<OPDBillFormData>({
    patientId: '',
    doctorId: '',
    consultationFee: 500,
    investigationCharges: 0,
    medicineCharges: 0,
    otherCharges: 0,
    discount: 0,
    discountReason: '',
    paymentMode: 'CASH',
    services: [],
    notes: ''
  });

  const [currentService, setCurrentService] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const commonServices = [
    'General Consultation',
    'Follow-up Consultation',
    'Blood Pressure Check',
    'Blood Sugar Test',
    'ECG',
    'X-Ray',
    'Ultrasound',
    'Blood Test',
    'Urine Test',
    'Prescription',
    'Dressing',
    'Injection',
    'Vaccination',
    'Health Checkup'
  ];

  useEffect(() => {
    loadData();

    // Subscribe to billing service updates
    const unsubscribe = BillingService.subscribe(async () => {
      const updatedBills = await BillingService.getOPDBills();
      setOpdBills(updatedBills);
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load actual patients from HospitalService
      const actualPatients = await HospitalService.getPatients(1000, true, true); // Limit to 1000 for performance
      logger.log('📋 Loaded patients for OPD billing:', actualPatients.length);

      // Load actual doctors from DoctorService
      const actualDoctors = DoctorService.getAllDoctors();
      logger.log('👨‍⚕️ Loaded doctors for OPD billing:', actualDoctors.length);

      // Load existing bills from BillingService
      const existingBills = await BillingService.getOPDBills();
      logger.log('💰 Loaded existing OPD bills:', existingBills.length);

      setPatients(actualPatients);
      setDoctors(actualDoctors);
      setOpdBills(existingBills);

    } catch (error: any) {
      logger.error('Failed to load OPD billing data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal =
      Number(formData.consultationFee) +
      Number(formData.investigationCharges) +
      Number(formData.medicineCharges) +
      Number(formData.otherCharges);
    return Math.max(0, subtotal - Number(formData.discount));
  };

  const handleAddService = () => {
    if (currentService.trim()) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, currentService.trim()]
      }));
      setCurrentService('');
    }
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      toast.error('Please select patient and doctor');
      return;
    }

    try {
      setSubmitting(true);
      const selectedPatient = patients.find(p => p.patient_id === formData.patientId);
      const selectedDoctor = doctors.find(d => d.id === formData.doctorId);

      const billId = await BillingService.generateOPDBillId();

      const newBill: OPDBill = {
        id: crypto.randomUUID(), // Or let backend handle if needed, but interface requires it
        billId: billId,
        patientId: formData.patientId,
        patientName: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Unknown',
        doctorId: formData.doctorId,
        doctorName: selectedDoctor ? selectedDoctor.name : 'Unknown',
        services: formData.services,
        consultationFee: Number(formData.consultationFee),
        investigationCharges: Number(formData.investigationCharges),
        medicineCharges: Number(formData.medicineCharges),
        otherCharges: Number(formData.otherCharges),
        discount: Number(formData.discount),
        totalAmount: calculateTotal(),
        status: 'PAID', // Default to PAID for now as usually OPD is prepaid/immediate
        billDate: new Date().toISOString(),
        paymentMode: formData.paymentMode
      };

      await BillingService.saveOPDBill(newBill);
      toast.success(`Bill ${billId} created successfully`);
      setShowCreateBill(false);

      // Reset form
      setFormData({
        patientId: '',
        doctorId: '',
        consultationFee: 500,
        investigationCharges: 0,
        medicineCharges: 0,
        otherCharges: 0,
        discount: 0,
        discountReason: '',
        paymentMode: 'CASH',
        services: [],
        notes: ''
      });
      setPatientSearchTerm('');

    } catch (error: any) {
      logger.error('Failed to create bill:', error);
      toast.error('Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBill = (bill: OPDBill) => {
    try {
      const receiptData = {
        receiptNumber: bill.billId,
        date: new Date(bill.billDate).toLocaleDateString(),
        patientName: bill.patientName,
        patientId: bill.patientId,
        doctorName: bill.doctorName,
        items: [
          ...(bill.consultationFee > 0 ? [{ description: 'Consultation Fee', amount: bill.consultationFee }] : []),
          ...(bill.investigationCharges > 0 ? [{ description: 'Investigation Charges', amount: bill.investigationCharges }] : []),
          ...(bill.medicineCharges > 0 ? [{ description: 'Medicine Charges', amount: bill.medicineCharges }] : []),
          ...bill.services.map(s => ({ description: s, amount: 0 })), // Services often bundled or explicit price needed. For now treating charges separately.
          ...(bill.otherCharges > 0 ? [{ description: 'Other Charges', amount: bill.otherCharges }] : [])
        ],
        totalAmount: bill.totalAmount,
        paymentMode: bill.paymentMode || 'CASH'
      };

      // Create a hidden iframe for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Render receipt template to string (simplified for now as we can't easily SSR React component here without setup)
        // Ideally we mount ReceiptTemplate to a hidden div and print.
        // For quick implementation, we'll assume a basic HTML structure.
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${bill.billId}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
                .total { text-align: right; font-weight: bold; font-size: 1.2em; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Seva Sangraha Hospital</h2>
                <p>OPD Receipt</p>
                <h3>${bill.billId}</h3>
              </div>
              <div class="details">
                <div>
                  <p><strong>Patient:</strong> ${bill.patientName}</p>
                  <p><strong>ID:</strong> ${bill.patientId}</p>
                </div>
                <div>
                  <p><strong>Doctor:</strong> ${bill.doctorName}</p>
                  <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleString()}</p>
                  <p><strong>Mode:</strong> ${bill.paymentMode}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${receiptData.items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td style="text-align: right">₹${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">
                <p>Total: ₹${bill.totalAmount.toFixed(2)}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Failed to print receipt');
    }
  };

  const filteredBills = opdBills.filter(bill => {
    const matchesSearch =
      bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.phone?.includes(patientSearchTerm) ||
    p.patient_id.includes(patientSearchTerm)
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">OPD Billing</h2>
          <p className="text-gray-600">Create and manage OPD bills</p>
        </div>
        <button
          onClick={() => setShowCreateBill(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Bill
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by patient name or bill ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Status Filters could be added here */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    Loading bills...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No bills found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {bill.billId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.billDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{bill.patientName}</div>
                      <div className="text-xs text-gray-500">{bill.patientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.doctorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        bill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handlePrintBill(bill)}
                        className="text-gray-600 hover:text-blue-600 mr-3"
                        title="Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-red-600" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Bill Modal */}
      {showCreateBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-900">New OPD Bill</h3>
              <button
                onClick={() => setShowCreateBill(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search patient name or ID..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientDropdown(true);
                        if (!e.target.value && formData.patientId) {
                          setFormData(prev => ({ ...prev, patientId: '' }));
                        }
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${formData.patientId ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                    />
                    {formData.patientId && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                    )}
                  </div>

                  {showPatientDropdown && patientSearchTerm && !formData.patientId && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map(patient => (
                          <div
                            key={patient.patient_id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, patientId: patient.patient_id }));
                              setPatientSearchTerm(`${patient.first_name} ${patient.last_name}`);
                              setShowPatientDropdown(false);
                            }}
                          >
                            <div className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</div>
                            <div className="text-xs text-gray-500">ID: {patient.patient_id} | Phone: {patient.phone}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No patients found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor *</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} ({doctor.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date is auto-set to today */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                  <div className="flex items-center text-gray-700 bg-gray-50 px-4 py-2 border border-gray-300 rounded-md">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {new Date().toLocaleDateString()}
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Services & Charges
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fixed Charges */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={formData.consultationFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: Number(e.target.value) }))}
                          className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Charges</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={formData.investigationCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, investigationCharges: Number(e.target.value) }))}
                          className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Charges</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={formData.medicineCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, medicineCharges: Number(e.target.value) }))}
                          className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Services & Extra Charges */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Add Services (Optional)</label>
                      <div className="flex gap-2">
                        <select
                          value={currentService}
                          onChange={(e) => setCurrentService(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Service</option>
                          {commonServices.map(fee => (
                            <option key={fee} value={fee}>{fee}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddService}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>

                      {/* Selected Services List */}
                      {formData.services.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.services.map((service, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {service}
                              <button
                                type="button"
                                onClick={() => handleRemoveService(index)}
                                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Charges</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={formData.otherCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: Number(e.target.value) }))}
                          className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={formData.discount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                          className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-red-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="border-t pt-4 bg-gray-50 -mx-6 px-6 py-4 mt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 text-sm">Total Amount</span>
                    <div className="text-3xl font-bold text-gray-900">₹{calculateTotal().toLocaleString()}</div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateBill(false)}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {submitting ? 'Generating...' : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Bill
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OPDBillingModule;