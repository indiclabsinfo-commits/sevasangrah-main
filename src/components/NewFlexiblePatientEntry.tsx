import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HospitalService from '../services/hospitalService';
import SMSService from '../services/smsService';
import { PatientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import DoctorService from '../services/doctorService';
import type { CreatePatientData, CreateTransactionData, AssignedDoctor } from '../config/supabaseNew';
import {
  User,
  Stethoscope,
  CreditCard,
  Calendar,
  ChevronRight,
  Check,
  UserPlus,
  Building2
} from 'lucide-react';
import { logger } from '../utils/logger';
import { parseLocalDate } from '../utils';
import { PatientPhotoUpload } from './forms/PatientPhotoUpload';

// Doctors and Departments data
const DOCTORS_DATA = [
  { name: 'DR. HEMANT KHAJJA', department: 'ORTHOPAEDIC' },
  { name: 'DR. HEMANT', department: 'ORTHO' },
  { name: 'DR. LALITA SUWALKA', department: 'DIETICIAN' },
  { name: 'DR. MILIND KIRIT AKHANI', department: 'GASTRO' },
  { name: 'DR MEETU BABLE', department: 'GYN.' },
  { name: 'DR. AMIT PATANVADIYA', department: 'NEUROLOGY' },
  { name: 'DR. KISHAN PATEL', department: 'UROLOGY' },
  { name: 'DR. PARTH SHAH', department: 'SURGICAL ONCOLOGY' },
  { name: 'DR.RAJEEDP GUPTA', department: 'MEDICAL ONCOLOGY' },
  { name: 'DR. KULDDEP VALA', department: 'NEUROSURGERY' },
  { name: 'DR. KURNAL PATEL', department: 'UROLOGY' },
  { name: 'DR. SAURABH GUPTA', department: 'ENDOCRINOLOGY' },
  { name: 'DR. BATUL PEEPAWALA', department: 'GENERAL PHYSICIAN' },
  { name: 'DR. POONAM JAIN', department: 'PHYSIOTHERAPY' }
];

// Get unique departments
const DEPARTMENTS = [...new Set(DOCTORS_DATA.map(doc => doc.department))].sort();

// Aadhaar Verhoeff validation
const validateAadhaarFormat = (aadhaar: string): boolean => {
  if (!aadhaar || aadhaar.length !== 12 || !/^\d{12}$/.test(aadhaar)) {
    return false;
  }

  // First digit should not be 0 or 1
  if (aadhaar[0] === '0' || aadhaar[0] === '1') {
    return false;
  }

  // Verhoeff algorithm tables
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  let c = 0;
  const reversed = aadhaar.split('').reverse();

  for (let i = 0; i < reversed.length; i++) {
    const digit = parseInt(reversed[i], 10);
    c = d[c][p[i % 8][digit]];
  }

  return c === 0;
};

const NewFlexiblePatientEntry: React.FC = () => {
  // Helper functions for date format conversion
  const formatDateToDD_MM_YYYY = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const formatDateToYYYY_MM_DD = (dateString: string): string => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const getTodayInDD_MM_YYYY = (): string => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isValidDateFormat = (dateString: string): boolean => {
    // Check if format is DD-MM-YYYY
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(dateString)) return false;

    const [day, month, year] = dateString.split('-').map(Number);

    // Check if date values are valid
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    // Check days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;

    return true;
  };

  const [formData, setFormData] = useState({
    prefix: 'Mr',
    full_name: '', // UI field
    first_name: '', // Backend field (hidden)
    last_name: '', // Backend field (hidden)
    phone: '',
    email: '',
    date_of_birth: '',
    date_of_entry: new Date(), // Default to today
    age: '',
    gender: 'MALE',

    // Appointment
    schedule_appointment: false,
    appointment_mode: 'none', // 'none', 'new_patient', 'existing_patient'
    existing_patient_search: '',
    selected_existing_patient: null as any,
    appointment_date: new Date(),
    appointment_time: '10:00',
    appointment_doctor_name: '', // For existing patient manual entry
    appointment_department: '', // For existing patient manual entry
    appointment_type: 'consultation',
    appointment_notes: '',

    // Payment
    payment_mode: 'CASH', // 'CASH', 'UPI', 'CARD', 'NET_BANKING'
    address: '',
    blood_group: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    patient_tag: '',
    photo_url: null as string | null,
    abha_id: '',
    aadhaar_number: '',
    has_reference: 'NO',
    reference_details: '',
    // Doctor and Department (single selection for backward compatibility)
    selected_department: '',
    selected_doctor: '',
    doctor_id: '', // Added for queue integration
    custom_doctor_name: '',
    custom_department_name: '',
    // Multiple doctors selection
    consultation_mode: 'single', // 'single' or 'multiple'
    // Transaction data
    consultation_fee: 0,
    discount_type: 'PERCENTAGE',
    discount_value: 0,
    discount_reason: '',
    online_payment_method: 'UPI',
    // SMS notification option
    send_sms: false,
  });

  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [dbDoctors, setDbDoctors] = useState<any[]>([]); // New state for DB doctors
  const [nextUhid, setNextUhid] = useState<string>(''); // UHID preview for new patients
  const [uhidLoading, setUhidLoading] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState(DOCTORS_DATA);
  const [selectedDoctors, setSelectedDoctors] = useState<any[]>([]);
  const [tempDepartment, setTempDepartment] = useState('');
  const [tempDoctor, setTempDoctor] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [showCustomDoctor, setShowCustomDoctor] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');
  const [customDoctor, setCustomDoctor] = useState('');
  const [existingPatients, setExistingPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<any>(null);
  const [isNewVisit, setIsNewVisit] = useState(false);
  const [patientsLastLoaded, setPatientsLastLoaded] = useState<number>(0);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);

  // Check connection status on mount
  // Check connection status and fetch doctors on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await HospitalService.getConnectionStatus();
        setConnectionStatus(status);

        // Fetch doctors
        const docs = await HospitalService.getDoctors();
        if (docs && docs.length > 0) {
          setDbDoctors(docs);
          // Map DB doctors to compatible format for dropdown if needed, 
          // but we will prioritize matching DB doctors by name/department
          const formattedDocs = docs.map(d => ({
            id: d.id,
            name: `DR. ${d.first_name} ${d.last_name}`.toUpperCase(),
            department: d.department?.toUpperCase() || 'GENERAL',
            consultationFee: d.consultation_fee
          }));

          // Merge legacy and DB doctors for display, prioritizing DB info if needed
          // or just use DB doctors entirely if possible.
          // For safety, we keep legacy list but know that real functionality (Queue) needs DB ID.
          setDbDoctors(formattedDocs);
        }

        // Fetch next UHID for display
        setUhidLoading(true);
        const uhidResult = await PatientService.getNextUHID();
        setNextUhid(uhidResult.next_uhid);
        setUhidLoading(false);
      } catch (e) {
        console.error('Init error:', e);
        setUhidLoading(false);
      }
    };
    checkConnection();
  }, []);

  // Function to handle patient search and auto-fill
  const handlePatientNameChange = (name: string) => {
    setFormData({ ...formData, full_name: name });

    if (name.length >= 1) { // Show results from first character
      const searchTerm = name.toLowerCase().trim();
      logger.log(`🔍 Searching for: "${searchTerm}" in ${existingPatients.length} patients`);

      const filtered = existingPatients.filter(patient => {
        // Handle null/undefined values more robustly
        const firstName = (patient.first_name || '').toString().toLowerCase().trim();
        const lastName = (patient.last_name || '').toString().toLowerCase().trim();
        const fullName = `${firstName} ${lastName}`.trim();
        const patientId = (patient.patient_id || '').toString().toLowerCase().trim();
        const phone = (patient.phone || '').toString().trim();

        // More comprehensive matching - including partial matches
        const matches = [
          firstName.includes(searchTerm),
          lastName.includes(searchTerm),
          fullName.includes(searchTerm),
          patientId.includes(searchTerm),
          phone.includes(searchTerm),
          firstName.startsWith(searchTerm),
          lastName.startsWith(searchTerm),
          fullName.startsWith(searchTerm),
          // Also try searching without spaces
          firstName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, '')),
          lastName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, '')),
          fullName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))
        ];

        return matches.some(match => match);
      });

      // Sort filtered results by relevance (exact matches first, then starts with, then contains)
      filtered.sort((a, b) => {
        const aFullName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
        const bFullName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();

        const aFirstName = a.first_name?.toLowerCase() || '';
        const bFirstName = b.first_name?.toLowerCase() || '';

        // Exact matches first
        if (aFullName === searchTerm && bFullName !== searchTerm) return -1;
        if (bFullName === searchTerm && aFullName !== searchTerm) return 1;

        // Starts with first name
        if (aFirstName.startsWith(searchTerm) && !bFirstName.startsWith(searchTerm)) return -1;
        if (bFirstName.startsWith(searchTerm) && !aFirstName.startsWith(searchTerm)) return 1;

        // Starts with full name
        if (aFullName.startsWith(searchTerm) && !bFullName.startsWith(searchTerm)) return -1;
        if (bFullName.startsWith(searchTerm) && !aFullName.startsWith(searchTerm)) return 1;

        // Alphabetical order for the rest
        return aFullName.localeCompare(bFullName);
      });

      logger.log(`🎯 Found ${filtered.length} patients matching "${searchTerm}"`);
      if (filtered.length > 0) {
        logger.log(`📋 First few results:`, filtered.slice(0, 3).map(p => `${p.first_name} ${p.last_name} (${p.patient_id})`));
      }

      setFilteredPatients(filtered);
      setShowPatientDropdown(filtered.length > 0);
    } else {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
    }
  };

  // Function to auto-fill patient details
  const selectExistingPatient = (patient: any) => {
    logger.log('🔍 selectExistingPatient called with:', patient);

    setSelectedExistingPatient(patient);
    setIsNewVisit(true);
    setShowPatientDropdown(false);

    // Auto-fill all patient details
    const newFormData = {
      ...formData,
      prefix: patient.prefix || 'Mr',
      full_name: `${patient.first_name} ${patient.last_name}`,
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone || '',
      email: patient.email || '',
      date_of_birth: patient.date_of_birth || '',
      age: patient.age || '',
      gender: patient.gender || 'MALE',
      address: patient.address || '',
      blood_group: patient.blood_group || '',
      medical_history: patient.medical_history || '',
      allergies: patient.allergies || '',
      current_medications: patient.current_medications || '',
      patient_tag: patient.patient_tag || '',
      has_reference: patient.has_reference || 'NO',
      reference_details: patient.reference_details || '',
      // Keep current date of entry as the new visit date
      date_of_entry: new Date()
    };

    logger.log('📝 Setting new form data:', newFormData);
    setFormData(newFormData);

    toast.success(`Auto-filled details for ${patient.first_name} ${patient.last_name} - This will be counted as a new visit`);
  };

  // Function to clear patient selection and start fresh
  const clearPatientSelection = () => {
    setSelectedExistingPatient(null);
    setIsNewVisit(false);
    setShowPatientDropdown(false);
    setFilteredPatients([]);

    setFormData({
      ...formData,
      prefix: 'Mr',
      full_name: '',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      age: '',
      gender: 'MALE',
      address: '',
      blood_group: '',
      medical_history: '',
      allergies: '',
      current_medications: '',
      patient_tag: '',
      has_reference: 'NO',
      reference_details: ''
    });

    toast.success('Cleared form for new patient entry');
  };

  // Function to load/refresh existing patients
  const loadExistingPatients = async (forceRefresh = false) => {
    try {
      const now = Date.now();

      // Only load if we haven't loaded in the last 30 seconds, or if forced refresh
      if (!forceRefresh && existingPatients.length > 0 && (now - patientsLastLoaded) < 30000) {
        logger.log('🔄 Using cached patient data (loaded', Math.round((now - patientsLastLoaded) / 1000), 'seconds ago)');
        return;
      }

      logger.log('🔍 Loading existing patients for search...');
      // Get ALL patients including inactive ones for comprehensive search
      // Using even higher limit to ensure we get ALL patients
      const patients = await HospitalService.getPatients(50000, true, true); // limit=50000, skipOrthoFilter=TRUE, includeInactive=true
      logger.log('✅ Loaded patients for search:', patients?.length || 0);
      logger.log('🏥 First few patient hospital_ids:', patients?.slice(0, 5).map(p => `${p.first_name} ${p.last_name} - Hospital ID: ${p.hospital_id} - Active: ${p.is_active}`));

      // Log first few patients to verify they're newest
      if (patients && patients.length > 0) {
        logger.log('📅 Latest patients:', patients.slice(0, 3).map(p =>
          `${p.first_name} ${p.last_name} (Created: ${p.created_at || 'Unknown'})`
        ));
      }

      setExistingPatients(patients || []);
      setPatientsLastLoaded(now);
    } catch (error) {
      logger.error('❌ Error loading existing patients:', error);
      // Set empty array on error to prevent crashes
      setExistingPatients([]);
    }
  };

  // Load existing patients on mount and set up periodic refresh
  useEffect(() => {
    loadExistingPatients();

    // Refresh patient list every 2 minutes to catch new patients
    const refreshInterval = setInterval(() => {
      loadExistingPatients(true);
    }, 120000); // 2 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter existing patients based on search
  useEffect(() => {
    if (formData.existing_patient_search && formData.existing_patient_search.trim().length > 0) {
      const searchTerm = formData.existing_patient_search.toLowerCase().trim();
      const filtered = existingPatients.filter(patient => {
        // Handle null/undefined values more robustly
        const firstName = (patient.first_name || '').toString().toLowerCase().trim();
        const lastName = (patient.last_name || '').toString().toLowerCase().trim();
        const fullName = `${firstName} ${lastName}`.trim();
        const patientId = (patient.patient_id || '').toString().toLowerCase().trim();
        const phone = (patient.phone || '').toString().trim();

        // More comprehensive matching
        const matches = [
          firstName.includes(searchTerm),
          lastName.includes(searchTerm),
          fullName.includes(searchTerm),
          patientId.includes(searchTerm),
          phone.includes(searchTerm),
          // Also try searching without spaces
          firstName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, '')),
          lastName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, '')),
          fullName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))
        ];

        return matches.some(match => match);
      });

      // Sort by relevance - exact matches first, then starts with, then contains
      filtered.sort((a, b) => {
        const aFirstName = a.first_name?.toLowerCase() || '';
        const bFirstName = b.first_name?.toLowerCase() || '';
        const aFullName = `${aFirstName} ${a.last_name?.toLowerCase() || ''}`.trim();
        const bFullName = `${bFirstName} ${b.last_name?.toLowerCase() || ''}`.trim();

        // Exact matches first
        if (aFullName === searchTerm && bFullName !== searchTerm) return -1;
        if (bFullName === searchTerm && aFullName !== searchTerm) return 1;

        // First name starts with search term
        if (aFirstName.startsWith(searchTerm) && !bFirstName.startsWith(searchTerm)) return -1;
        if (bFirstName.startsWith(searchTerm) && !aFirstName.startsWith(searchTerm)) return 1;

        // Full name starts with search term
        if (aFullName.startsWith(searchTerm) && !bFullName.startsWith(searchTerm)) return -1;
        if (bFullName.startsWith(searchTerm) && !aFullName.startsWith(searchTerm)) return 1;

        return aFullName.localeCompare(bFullName);
      });

      setFilteredPatients(filtered);
    } else {
      // Show all patients if search is empty (but limit to first 50 for performance)
      setFilteredPatients(existingPatients.slice(0, 50));
    }
  }, [formData.existing_patient_search, existingPatients]);

  // Filter doctors when department changes
  useEffect(() => {
    if (formData.selected_department) {
      const filtered = DOCTORS_DATA.filter(doc =>
        doc.department === formData.selected_department
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [formData.selected_department]);

  // Filter temp doctors for multiple selection
  useEffect(() => {
    if (tempDepartment) {
      const filtered = DOCTORS_DATA.filter(doc =>
        doc.department === tempDepartment
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [tempDepartment]);

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      // Validate required fields
      if (formData.appointment_mode !== 'existing_patient' && !formData.full_name) {
        toast.error('Please enter patient full name');
        setLoading(false);
        return;
      }

      if (formData.appointment_mode === 'existing_patient' && !selectedExistingPatient) {
        toast.error('Please select an existing patient');
        setLoading(false);
        return;
      }

      // Validate custom fields if selected
      if (formData.selected_department === 'CUSTOM' && !formData.custom_department_name.trim()) {
        toast.error('Please enter custom department name');
        setLoading(false);
        return;
      }

      if (formData.selected_doctor === 'CUSTOM' && !formData.custom_doctor_name.trim()) {
        toast.error('Please enter custom doctor name');
        setLoading(false);
        return;
      }

      logger.log('💾 Preparing patient data for submission...');

      // Handle "Schedule Appointment Only" for existing patient
      if (formData.appointment_mode === 'existing_patient' && formData.schedule_appointment && !saveAsDraft) {
        if (!selectedExistingPatient) {
          toast.error('Please select an existing patient');
          setLoading(false);
          return;
        }

        try {
          // Prepare appointment data
          // Determine doctor and department
          let doctorId = '';
          const doctorName = formData.appointment_doctor_name;
          const departmentName = formData.appointment_department;

          if (doctorName) {
            // Try to find doctor in dbDoctors first (contains UUIDs)
            const dbDoc = dbDoctors.find(d =>
              d.name === doctorName ||
              `DR. ${d.first_name} ${d.last_name}`.toUpperCase() === doctorName
            );

            if (dbDoc) {
              doctorId = dbDoc.id;
            } else {
              // Fallback to searching in static DOCTORS_DATA to get context, but we need a UUID for the backend potentially
              // If we can't find a UUID, we might have trouble. 
              // However, for this demo/legacy mode, we'll try to use what we have or a placeholder ensuring it doesn't break if FKs are loose.
              doctorId = 'doc-1';
            }
          }

          const appointmentData = {
            patient_id: selectedExistingPatient.id, // Use UUID from patient record
            doctor_id: doctorId || 'doc-1',
            department_id: departmentName,
            appointment_date: formatDateToYYYY_MM_DD(formData.appointment_date.toLocaleDateString('en-GB').replace(/\//g, '-')),
            appointment_time: formData.appointment_time,
            type: formData.appointment_type,
            status: 'scheduled',
            reason: formData.appointment_notes || 'Consultation',
            notes: `Payment Mode: ${formData.payment_mode}`
          };

          logger.log('📅 Scheduling appointment for existing patient...', appointmentData);
          await appointmentService.createAppointment(appointmentData);

          toast.success('Appointment scheduled successfully!');
          // Reset form or redirect
          setFormData({
            ...formData,
            appointment_mode: 'none',
            schedule_appointment: false,
            selected_existing_patient: null,
            existing_patient_search: ''
          });
          setLoading(false);
          return;

        } catch (error: any) {
          logger.error('❌ Error scheduling appointment:', error);
          toast.error(`Failed to schedule appointment: ${error.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      let newPatient: any;

      // Check if this is a new visit for an existing patient
      if (isNewVisit && selectedExistingPatient) {
        logger.log('🔄 Processing new visit for existing patient:', selectedExistingPatient.patient_id);

        // Update existing patient's date_of_entry and doctor information to new visit date
        const updateData: any = {
          date_of_entry: `${formData.date_of_entry.getFullYear()}-${String(formData.date_of_entry.getMonth() + 1).padStart(2, '0')}-${String(formData.date_of_entry.getDate()).padStart(2, '0')}` // Format as YYYY-MM-DD in local timezone
        };

        // Update doctor information if provided
        if (formData.consultation_mode === 'single') {
          const finalDoctorName = formData.selected_doctor === 'CUSTOM' ? formData.custom_doctor_name : formData.selected_doctor;
          const finalDepartmentName = formData.selected_department === 'CUSTOM' ? formData.custom_department_name : formData.selected_department;

          if (finalDoctorName) {
            updateData.assigned_doctor = finalDoctorName;
          }
          if (finalDepartmentName) {
            updateData.assigned_department = finalDepartmentName;
          }
        }

        try {
          const updatedPatient = await HospitalService.updatePatient(selectedExistingPatient.id, updateData);
          if (updatedPatient) {
            newPatient = { ...selectedExistingPatient, ...updateData };
            logger.log('✅ Updated patient date_of_entry and doctor info for new visit');
            toast.success(`New visit recorded for ${selectedExistingPatient.first_name} ${selectedExistingPatient.last_name}`);
            // Refresh patient list to update last visit info
            loadExistingPatients(true);
          } else {
            throw new Error('Failed to update patient for new visit');
          }
        } catch (error) {
          logger.error('❌ Error updating patient for new visit:', error);
          toast.error('Failed to record new visit. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        // Create new patient
        logger.log('👤 Creating new patient...');

        // Prepare patient data - properly mapped to database schema
        const patientData: CreatePatientData = {
          // Required fields
          prefix: formData.prefix as 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof',
          first_name: formData.first_name || formData.full_name.split(' ')[0],
          last_name: formData.last_name || formData.full_name.split(' ').slice(1).join(' ') || '',
          gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
          hospital_id: '550e8400-e29b-41d4-a716-446655440000', // Default hospital ID

          // Optional personal information
          phone: formData.phone || '',
          email: formData.email || undefined,
          address: formData.address || '',
          date_of_birth: formData.date_of_birth || undefined,
          age: formData.age || undefined,

          // Emergency contact (using patient info as fallback since UI removed these fields)
          emergency_contact_name: formData.first_name + ' ' + formData.last_name,
          emergency_contact_phone: formData.phone || '',

          // Medical information
          blood_group: formData.blood_group || undefined,
          medical_history: formData.medical_history || undefined,
          allergies: formData.allergies || undefined,
          current_medications: formData.current_medications || undefined,

          // Reference information
          has_reference: formData.has_reference === 'YES',
          reference_details: formData.has_reference === 'YES' ? formData.reference_details || undefined : undefined,

          // Patient tag
          patient_tag: formData.patient_tag || undefined,

          // Patient photo
          photo_url: formData.photo_url || undefined,

          // ABHA ID
          abha_id: formData.abha_id || undefined,

          // Aadhaar Number
          aadhaar_number: formData.aadhaar_number || undefined,

          // Notes - only include reference details
          notes: formData.has_reference === 'YES' && formData.reference_details ? `REF: ${formData.reference_details}` : undefined,

          // Date tracking - use local date to avoid timezone issues
          date_of_entry: formData.date_of_entry ?
            `${formData.date_of_entry.getFullYear()}-${String(formData.date_of_entry.getMonth() + 1).padStart(2, '0')}-${String(formData.date_of_entry.getDate()).padStart(2, '0')}` :
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,

          // Doctor assignment for backward compatibility
          assigned_doctor: formData.consultation_mode === 'single' ?
            (formData.selected_doctor === 'CUSTOM' ?
              (formData.custom_doctor_name || undefined) :
              (formData.selected_doctor || undefined)) : undefined,
          assigned_department: formData.consultation_mode === 'single' ?
            (formData.selected_department === 'CUSTOM' ?
              (formData.custom_department_name || undefined) :
              (formData.selected_department || undefined)) : undefined,

          // Hide patient from list if they have a scheduled appointment
          // They will appear in Dashboard's Upcoming Appointments instead
          has_pending_appointment: formData.schedule_appointment && formData.appointment_date && formData.appointment_time ? true : false,
        };

        // Note: Patient will be hidden from patient list automatically if they have an appointment

        logger.log('📤 Creating patient with data:', patientData);
        logger.log('👨‍⚕️ Doctor info being saved:', {
          doctor: patientData.assigned_doctor,
          department: patientData.assigned_department,
          mode: formData.consultation_mode,
          selected_doctor: formData.selected_doctor,
          selected_department: formData.selected_department
        });

        // Use backend API for patient creation
        newPatient = await HospitalService.createPatient(patientData);
        logger.log('✅ Patient created successfully (Direct Mode):', newPatient);
      }

      // Handle doctors assignment based on consultation mode
      let assignedDoctorsData: AssignedDoctor[] = [];

      if (formData.consultation_mode === 'single') {
        // Single doctor mode (backward compatibility)
        const finalDoctorName = formData.selected_doctor === 'CUSTOM' ? formData.custom_doctor_name : formData.selected_doctor;
        const finalDepartmentName = formData.selected_department === 'CUSTOM' ? formData.custom_department_name : formData.selected_department;

        if (finalDoctorName && finalDepartmentName) {
          assignedDoctorsData.push({
            doctor_name: finalDoctorName,
            department: finalDepartmentName,
            consultation_fee: formData.consultation_fee
          });
        }
      } else {
        // Multiple doctors mode
        assignedDoctorsData = selectedDoctors.map(doc => ({
          doctor_name: doc.doctorName,
          name: doc.doctorName, // Fix for AssignedDoctor type
          department: doc.department,
          consultation_fee: doc.consultationFee || 0
        }));
      }

      // Create transactions for each assigned doctor (wrapped in try-catch to not break patient creation)
      if (!saveAsDraft && assignedDoctorsData.length > 0) {
        try {
          for (const doctor of assignedDoctorsData) {
            // Calculate discounted amount
            const originalAmount = doctor.consultation_fee || 0;
            let discountAmount = 0;
            if (formData.discount_type === 'PERCENTAGE') {
              discountAmount = originalAmount * (formData.discount_value / 100);
            } else {
              discountAmount = formData.discount_value;
            }
            const finalAmount = originalAmount - discountAmount;

            // Build description with discount info if applicable
            let description = `Consultation with ${doctor.doctor_name} - ${doctor.department}`;

            // Add discount information to description for backward compatibility
            if (formData.discount_value > 0) {
              const discountText = formData.discount_type === 'PERCENTAGE'
                ? `${formData.discount_value}% discount (₹${discountAmount.toFixed(2)})`
                : `₹${formData.discount_value} discount`;
              description += ` | Original Fee: ₹${originalAmount.toFixed(2)} | Discount: ${discountText}`;

              if (formData.discount_reason) {
                description += ` | Reason: ${formData.discount_reason}`;
              }
            }

            const transactionData: CreateTransactionData = {
              patient_id: newPatient.id,  // Use UUID id, not patient_id string
              amount: finalAmount, // Use discounted amount
              description: description,
              discount_type: formData.discount_type as 'PERCENTAGE' | 'AMOUNT',
              discount_value: formData.discount_value,
              discount_reason: formData.discount_reason || undefined,
              payment_mode: formData.payment_mode as 'CASH' | 'ONLINE' | 'CARD' | 'UPI' | 'INSURANCE',
              online_payment_method: formData.payment_mode === 'ONLINE' ? formData.online_payment_method : undefined,
              transaction_type: 'CONSULTATION',
              doctor_name: doctor.doctor_name,
              department: doctor.department,
              status: 'COMPLETED',
              transaction_date: formData.date_of_entry
                ? `${formData.date_of_entry.getFullYear()}-${String(formData.date_of_entry.getMonth() + 1).padStart(2, '0')}-${String(formData.date_of_entry.getDate()).padStart(2, '0')}`
                : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
            };

            logger.log('💳 Creating transaction:', transactionData);
            await HospitalService.createTransaction(transactionData);
          }
        } catch (transactionError: any) {
          // Log the error but don't fail the whole patient creation
          logger.error('⚠️ Transaction creation failed:', transactionError);
          console.warn('Transaction creation failed but patient was saved:', transactionError.message);
          // Don't throw - patient is already created successfully
        }
      }

      // Create assigned doctors records
      // TODO: Implement assignDoctorsToPatient method in HospitalService
      // if (!saveAsDraft && assignedDoctorsData.length > 0) {
      //   await HospitalService.assignDoctorsToPatient(newPatient.id, assignedDoctorsData);  // Use UUID id here too
      // }

      // Handle appointment scheduling if enabled
      if (formData.schedule_appointment && formData.appointment_mode === 'new_patient' &&
        formData.appointment_date && formData.appointment_time) {

        // Get doctor name and department from consultation settings
        const appointmentDoctorName = formData.consultation_mode === 'single'
          ? (formData.selected_doctor === 'CUSTOM' ? formData.custom_doctor_name : formData.selected_doctor)
          : (selectedDoctors.length > 0 ? selectedDoctors[0].doctorName : '');

        const appointmentDepartment = formData.consultation_mode === 'single'
          ? (formData.selected_department === 'CUSTOM' ? formData.custom_department_name : formData.selected_department)
          : (selectedDoctors.length > 0 ? selectedDoctors[0].department : 'General');

        if (!appointmentDoctorName) {
          toast.error('Please select a doctor above to schedule appointment');
          setLoading(false);
          return;
        }

        const appointmentData = {
          id: Date.now().toString(),
          patient_id: newPatient.patient_id,
          patient_uuid: newPatient.id, // Add UUID for database operations
          patient_name: `${newPatient.first_name} ${newPatient.last_name}`,
          doctor_name: appointmentDoctorName,
          department: appointmentDepartment,
          appointment_date: formData.appointment_date ? formData.appointment_date.toISOString().split('T')[0] : '',
          appointment_time: formData.appointment_time,
          // Add scheduled_at field that dashboard expects
          scheduled_at: formData.appointment_date && formData.appointment_time
            ? `${formData.appointment_date.toISOString().split('T')[0]}T${formData.appointment_time}:00`
            : new Date().toISOString(),
          appointment_type: formData.appointment_type as 'consultation' | 'follow-up' | 'procedure' | 'emergency',
          status: 'scheduled' as const,
          estimated_duration: formData.appointment_duration || 30,
          estimated_cost: formData.appointment_cost || 500,
          notes: formData.appointment_notes || '',
          created_at: new Date().toISOString(),
          requires_confirmation: true, // Flag to indicate this needs confirmation
        };

        try {
          const existingAppointments = localStorage.getItem('hospital_appointments');
          const appointments = existingAppointments ? JSON.parse(existingAppointments) : [];
          appointments.push(appointmentData);
          localStorage.setItem('hospital_appointments', JSON.stringify(appointments));

          logger.log('📅 New appointment created:', appointmentData);
          logger.log('📅 Total appointments in localStorage:', appointments.length);

          // Dispatch event to notify Dashboard of the new appointment
          window.dispatchEvent(new Event('appointmentUpdated'));

          toast.success(`Appointment scheduled for ${formData.appointment_date ? formData.appointment_date.toLocaleDateString('en-IN') : 'selected date'} at ${formData.appointment_time}`);
        } catch (error) {
          logger.error('Error scheduling appointment:', error);
        }
      }

      // Auto-add to OPD Queue if doctor is selected
      if (formData.consultation_mode === 'single' && (formData.doctor_id || formData.selected_doctor)) {
        try {
          logger.log('🚶‍♂️ Auto-adding to OPD Queue...');
          let doctorId = formData.doctor_id;

          // Fallback: If no ID but name exists, try one last lookup
          if (!doctorId && formData.selected_doctor && dbDoctors.length > 0) {
            const foundDoc = dbDoctors.find(d => d.name === formData.selected_doctor);
            doctorId = foundDoc?.id;
          }

          if (doctorId) {
            const queuePayload = {
              patient_id: newPatient.id,
              doctor_id: doctorId,
              priority: false,
              notes: 'New Registration'
            };
            console.log('🚀 Auto-Queue Payload:', queuePayload);

            await HospitalService.addToOPDQueue(queuePayload);
            toast.success('Added to OPD Queue automatically');
          } else {
            console.warn('Skipping queue: No valid Doctor ID found for', formData.selected_doctor);
          }
        } catch (queueError: any) {
          console.error('❌ Auto-queue failed:', queueError);
          if (queueError.response) {
            console.error('❌ Server Error Details:', queueError.response.data);
          }
          // Don't block registration success
        }
      }

      // Calculate total amount
      const totalAmount = (() => {
        const total = formData.consultation_mode === 'single'
          ? formData.consultation_fee
          : selectedDoctors.reduce((sum, doctor) => sum + (doctor.consultationFee || 0), 0);

        const discount = formData.discount_value > 0
          ? (formData.discount_type === 'PERCENTAGE'
            ? total * (formData.discount_value / 100)
            : formData.discount_value)
          : 0;

        return Math.max(0, total - discount);
      })();

      if (saveAsDraft) {
        toast.success(`Patient draft saved! ${newPatient.first_name} ${newPatient.last_name}`);
      } else {
        // Show queue number in toast if available
        const queueMessage = newPatient.queue_no
          ? `Queue No: ${newPatient.queue_no} | `
          : '';
        toast.success(`${queueMessage}Patient registered! ${newPatient.first_name} ${newPatient.last_name} - Total: ₹${totalAmount.toFixed(2)}`);

        // Show queue modal for new registrations (not new visits)
        if (!isNewVisit && newPatient.queue_no) {
          setRegisteredPatient(newPatient);
          setShowQueueModal(true);
        }

        // Send SMS if enabled
        if (formData.send_sms && formData.phone) {
          try {
            const patientFullName = `${formData.prefix} ${formData.first_name} ${formData.last_name}`;
            const formattedDate = formData.date_of_entry
              ? formData.date_of_entry.toLocaleDateString('en-IN')
              : new Date().toLocaleDateString('en-IN');
            const doctorName = formData.consultation_mode === 'single'
              ? (formData.selected_doctor === 'CUSTOM' ? formData.custom_doctor_name : formData.selected_doctor)
              : (selectedDoctors.length > 0 ? selectedDoctors[0].doctorName : 'Doctor');
            const departmentName = formData.consultation_mode === 'single'
              ? (formData.selected_department === 'CUSTOM' ? formData.custom_department_name : formData.selected_department)
              : (selectedDoctors.length > 0 ? selectedDoctors[0].department : 'General');

            const smsResult = await SMSService.sendRegistrationConfirmation(
              newPatient.id,
              patientFullName,
              formData.phone,
              newPatient.patient_id,
              formattedDate,
              doctorName,
              departmentName
            );

            if (smsResult.success) {
              toast.success('SMS confirmation sent successfully!');
            } else if (smsResult.error && smsResult.error !== 'SMS service not configured') {
              toast.error('Failed to send SMS confirmation');
            }
          } catch (smsError) {
            console.error('SMS sending error:', smsError);
          }
        }
      }

      // Refresh patient list to include the new patient in search results
      loadExistingPatients(true);

      // Reset form and states
      setSelectedExistingPatient(null);
      setIsNewVisit(false);
      setShowPatientDropdown(false);
      setFilteredPatients([]);

      setFormData({
        prefix: 'Mr',
        full_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        date_of_entry: new Date(),
        age: '',
        gender: 'MALE',
        address: '',
        blood_group: '',
        medical_history: '',
        allergies: '',
        current_medications: '',
        patient_tag: '',
        photo_url: null as string | null,
        abha_id: '',
        aadhaar_number: '',
        has_reference: 'NO',
        reference_details: '',
        selected_department: '',
        selected_doctor: '',
        custom_doctor_name: '',
        custom_department_name: '',
        consultation_mode: 'single',
        consultation_fee: 0,
        discount_type: 'PERCENTAGE',
        discount_value: 0,
        discount_reason: '',
        payment_mode: 'CASH',
        online_payment_method: 'UPI',
        schedule_appointment: false,
        appointment_mode: 'none',
        existing_patient_search: '',
        selected_existing_patient: null,
        appointment_doctor_name: '',
        appointment_department: '',
        appointment_date: null,
        appointment_time: '',
        appointment_type: '',
        appointment_duration: 30,
        appointment_cost: 500,
        appointment_notes: '',
        send_sms: false,
      });

      setSelectedDoctors([]);
      setTempDepartment('');
      setTempDoctor('');
      setShowCustomDepartment(false);
      setShowCustomDoctor(false);
      setCustomDepartment('');
      setCustomDoctor('');

    } catch (error: any) {
      logger.error('Patient creation failed:', error);
      toast.error(`Failed to save patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addDoctorToList = () => {
    if (!tempDepartment || !tempDoctor) {
      toast.error('Please select both department and doctor');
      return;
    }

    const consultationFee = parseInt(prompt('Enter consultation fee for this doctor:') || '500');

    const newDoctor = {
      id: Date.now().toString(),
      department: tempDepartment,
      doctorName: tempDoctor,
      consultationFee: consultationFee
    };

    setSelectedDoctors([...selectedDoctors, newDoctor]);
    setTempDepartment('');
    setTempDoctor('');
    toast.success(`Added ${tempDoctor} to consultation list`);
  };

  const removeDoctorFromList = (doctorId: string) => {
    setSelectedDoctors(selectedDoctors.filter(doc => doc.id !== doctorId));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Modern DatePicker Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-datepicker-modern {
            border: none !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }

          .react-datepicker-calendar-modern {
            border: none !important;
            border-radius: 12px !important;
          }

          .react-datepicker__header {
            background-color: #0056B3 !important;
            border-bottom: none !important;
            border-radius: 12px 12px 0 0 !important;
            padding: 20px 0 !important;
          }

          .react-datepicker__current-month {
            color: white !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }

          .react-datepicker__day-names {
            background-color: #0056B3 !important;
            margin-bottom: 0 !important;
          }

          .react-datepicker__day-name {
            color: white !important;
            font-weight: 500 !important;
            width: 2.5rem !important;
            line-height: 2.5rem !important;
          }

          .react-datepicker__day {
            width: 2.5rem !important;
            line-height: 2.5rem !important;
            margin: 2px !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
            font-weight: 500 !important;
            cursor: pointer !important;
          }

          .react-datepicker__day--today-custom {
            background-color: #FEF3C7 !important;
            color: #92400E !important;
            font-weight: 600 !important;
            border: 2px solid #F59E0B !important;
          }

          .react-datepicker__day--weekend {
            color: #EF4444 !important;
            background-color: #FEF2F2 !important;
          }

          .react-datepicker__day--normal:hover {
            background-color: #EBF5FF !important;
            color: #0056B3 !important;
          }

          .react-datepicker__day--selected {
            background-color: #0056B3 !important;
            color: white !important;
            font-weight: 600 !important;
          }

          .react-datepicker__day--selected:hover {
            background-color: #004494 !important;
          }

          .react-datepicker__day--outside-month {
            color: #D1D5DB !important;
          }

          .react-datepicker__navigation {
            top: 22px !important;
            width: 0 !important;
            height: 0 !important;
            border: 6px solid transparent !important;
          }

          .react-datepicker__navigation--previous {
            border-right-color: white !important;
            left: 20px !important;
          }

          .react-datepicker__navigation--next {
            border-left-color: white !important;
            right: 20px !important;
          }

          .react-datepicker__navigation:hover {
            opacity: 0.7 !important;
          }

          .react-datepicker__month-dropdown,
          .react-datepicker__year-dropdown {
            background-color: white !important;
            border: none !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
            max-height: 200px !important;
            overflow-y: auto !important;
          }

          .react-datepicker__month-option,
          .react-datepicker__year-option {
            padding: 8px 12px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
          }

          .react-datepicker__month-option:hover,
          .react-datepicker__year-option:hover {
            background-color: #EBF5FF !important;
            color: #0056B3 !important;
          }

          .react-datepicker__month-option--selected,
          .react-datepicker__year-option--selected {
            background-color: #0056B3 !important;
            color: white !important;
          }

          .react-datepicker__today-button {
            background-color: #0056B3 !important;
            color: white !important;
            border: none !important;
            padding: 8px 16px !important;
            margin: 10px !important;
            border-radius: 6px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }

          .react-datepicker__today-button:hover {
            background-color: #004494 !important;
          }

          .react-datepicker__triangle {
            display: none !important;
          }
        `
      }} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0056B3', marginBottom: '8px' }}>
            New Patient Entry
          </h1>
          <p style={{ color: '#999999', fontSize: '16px' }}>
            Register new patients with comprehensive information
          </p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Patient Information */}
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" style={{ color: '#0056B3' }} />
                    <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Patient Information</h2>
                  </div>
                  {/* UHID Display */}
                  <div style={{
                    backgroundColor: '#E8F4FD',
                    border: '2px solid #0056B3',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>UHID:</span>
                    <span style={{
                      fontSize: '16px',
                      color: '#0056B3',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px'
                    }}>
                      {uhidLoading ? 'Loading...' : (nextUhid || 'MH-2026-000001')}
                    </span>
                  </div>
                </div>

                {/* Patient Photo Upload */}
                <div className="mb-6">
                  <PatientPhotoUpload
                    value={formData.photo_url}
                    onChange={(photoUrl) => setFormData({ ...formData, photo_url: photoUrl })}
                    disabled={loading}
                  />
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Prefix <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={formData.prefix}
                      onChange={(e) => {
                        const newPrefix = e.target.value;
                        const updates: any = { prefix: newPrefix };

                        // Auto-select gender based on prefix
                        if (newPrefix === 'Mr') {
                          updates.gender = 'MALE';
                        } else if (newPrefix === 'Mrs' || newPrefix === 'Ms') {
                          updates.gender = 'FEMALE';
                        }
                        // Dr and Prof don't auto-set gender

                        setFormData({ ...formData, ...updates });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      required
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Full Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          logger.log('🔄 Manually refreshing patient list...');
                          loadExistingPatients(true);
                          toast.success('Patient list refreshed!');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0056B3',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'underline',
                          padding: '0',
                          marginBottom: '6px'
                        }}
                        title="Refresh patient list to show latest patients"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => {
                          const fullName = e.target.value;
                          handlePatientNameChange(fullName);

                          // Update first_name and last_name for new patients
                          if (!selectedExistingPatient) {
                            const nameParts = fullName.trim().split(' ');
                            const firstName = nameParts[0] || '';
                            const lastName = nameParts.slice(1).join(' ') || '';

                            setFormData({
                              ...formData,
                              full_name: fullName,
                              first_name: firstName,
                              last_name: lastName
                            });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          outline: 'none'
                        }}
                        placeholder="Start typing patient name to search existing patients..."
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#0056B3';
                          // Refresh patient list when focusing to get latest patients
                          loadExistingPatients();
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#CCCCCC';
                          // Hide dropdown with delay to allow click
                          setTimeout(() => setShowPatientDropdown(false), 300);
                        }}
                        required
                      />

                      {/* Patient Search Dropdown */}
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CCCCCC',
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            maxHeight: '350px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                        >
                          {filteredPatients.slice(0, 15).map((patient, index) => (
                            <div
                              key={patient.id || index}
                              style={{
                                padding: '12px 16px',
                                borderBottom: index < filteredPatients.slice(0, 15).length - 1 ? '1px solid #F0F0F0' : 'none',
                                cursor: 'pointer',
                                backgroundColor: '#FFFFFF',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => {
                                logger.log('Patient selected:', patient);
                                selectExistingPatient(patient);
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                            >
                              <div style={{ fontSize: '14px', fontWeight: '500', color: '#333333' }}>
                                {patient.first_name} {patient.last_name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666666' }}>
                                ID: {patient.patient_id} | Phone: {patient.phone}
                              </div>
                              <div style={{ fontSize: '11px', color: '#999999' }}>
                                Last visit: {patient.date_of_entry ? parseLocalDate(patient.date_of_entry).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          ))}

                          {/* Show more results indicator */}
                          {filteredPatients.length > 15 && (
                            <div
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#F8F9FA',
                                borderTop: '1px solid #E9ECEF',
                                fontSize: '12px',
                                color: '#6C757D',
                                textAlign: 'center'
                              }}
                            >
                              Showing 15 of {filteredPatients.length} results. Type more to narrow down search.
                            </div>
                          )}
                        </div>
                      )}

                      {/* New Visit Indicator */}
                      {isNewVisit && selectedExistingPatient && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          NEW VISIT
                        </div>
                      )}
                    </div>

                    {/* Clear/New Patient Button */}
                    {isNewVisit && selectedExistingPatient && (
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={clearPatientSelection}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Clear & Enter New Patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Age
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="e.g., 25, 30 years"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => {
                        const newGender = e.target.value;
                        const updates: any = { gender: newGender };

                        // Auto-select prefix based on gender
                        if (newGender === 'MALE') {
                          updates.prefix = 'Mr';
                        } else if (newGender === 'FEMALE') {
                          updates.prefix = 'Ms';
                        }
                        // OTHER gender doesn't auto-set prefix

                        setFormData({ ...formData, ...updates });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="10-digit phone number"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="email@example.com"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                </div>

                {/* ABHA ID Field */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    ABHA ID (Ayushman Bharat Health Account)
                  </label>
                  <input
                    type="text"
                    value={formData.abha_id}
                    onChange={(e) => setFormData({ ...formData, abha_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CCCCCC',
                      fontSize: '16px',
                      color: '#333333',
                      outline: 'none'
                    }}
                    placeholder="Enter 14-digit ABHA ID (optional)"
                    maxLength={14}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                  />
                  <span style={{ fontSize: '12px', color: '#666666', marginTop: '4px', display: 'block' }}>
                    Example: 12-3456-7890-1234
                  </span>
                </div>

                {/* Aadhaar Number Field */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Aadhaar Number <span style={{ fontSize: '12px', color: '#666', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.aadhaar_number}
                    onChange={(e) => {
                      // Only allow digits, max 12 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setFormData({ ...formData, aadhaar_number: value });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${formData.aadhaar_number.length === 12
                        ? (validateAadhaarFormat(formData.aadhaar_number) ? '#22C55E' : '#EF4444')
                        : '#CCCCCC'}`,
                      fontSize: '16px',
                      color: '#333333',
                      outline: 'none',
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                    onBlur={(e) => {
                      if (formData.aadhaar_number.length === 12) {
                        e.currentTarget.style.borderColor = validateAadhaarFormat(formData.aadhaar_number) ? '#22C55E' : '#EF4444';
                      } else {
                        e.currentTarget.style.borderColor = '#CCCCCC';
                      }
                    }}
                  />
                  {/* Display masked Aadhaar after entry */}
                  {formData.aadhaar_number.length === 12 && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '14px',
                        color: validateAadhaarFormat(formData.aadhaar_number) ? '#22C55E' : '#EF4444',
                        fontWeight: '500'
                      }}>
                        {validateAadhaarFormat(formData.aadhaar_number) ? '✓ Valid format' : '✗ Invalid Aadhaar number'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
                        Display: XXXX-XXXX-{formData.aadhaar_number.slice(-4)}
                      </span>
                    </div>
                  )}
                  {formData.aadhaar_number.length > 0 && formData.aadhaar_number.length < 12 && (
                    <span style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px', display: 'block' }}>
                      {12 - formData.aadhaar_number.length} more digits required
                    </span>
                  )}
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="DD-MM-YYYY"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Date of Entry
                    </label>
                    <DatePicker
                      selected={formData.date_of_entry}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setFormData({ ...formData, date_of_entry: date });
                        }
                      }}
                      dateFormat="dd-MM-yyyy"
                      maxDate={new Date()}
                      className="w-full"
                      customInput={
                        <input
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        />
                      }
                      placeholderText="DD-MM-YYYY"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CCCCCC',
                      fontSize: '16px',
                      color: '#333333',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    rows={2}
                    placeholder="Complete address"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                  />
                </div>

                {/* Medical Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="e.g., A+, B-, O+"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Patient Tag
                    </label>
                    <input
                      type="text"
                      value={formData.patient_tag}
                      onChange={(e) => setFormData({ ...formData, patient_tag: e.target.value })}
                      list="patient-tags-suggestions"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Enter custom tag (e.g., Jain Community, Corporate Camp)"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                    <datalist id="patient-tags-suggestions">
                      <option value="Jain Community" />
                      <option value="Bohara Community" />
                      <option value="Corporate Camp" />
                      <option value="Medical Camp" />
                      <option value="School Camp" />
                      <option value="Senior Citizen" />
                      <option value="Insurance" />
                      <option value="Government Scheme" />
                      <option value="VIP" />
                      <option value="Regular" />
                    </datalist>
                    <div style={{ fontSize: '12px', color: '#999999', marginTop: '4px' }}>
                      💡 Start typing for suggestions or enter your own custom tag
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Medical History
                    </label>
                    <textarea
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      rows={2}
                      placeholder="Previous medical conditions"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Allergies
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Known allergies"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Current Medications
                    </label>
                    <input
                      type="text"
                      value={formData.current_medications}
                      onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Current medicines"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                </div>

                {/* Reference Section */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Has Reference?
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reference"
                        value="NO"
                        checked={formData.has_reference === 'NO'}
                        onChange={(e) => setFormData({ ...formData, has_reference: e.target.value })}
                        style={{ accentColor: '#0056B3' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333333' }}>No</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reference"
                        value="YES"
                        checked={formData.has_reference === 'YES'}
                        onChange={(e) => setFormData({ ...formData, has_reference: e.target.value })}
                        style={{ accentColor: '#0056B3' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333333' }}>Yes</span>
                    </label>
                  </div>
                  {formData.has_reference === 'YES' && (
                    <input
                      type="text"
                      value={formData.reference_details}
                      onChange={(e) => setFormData({ ...formData, reference_details: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Reference details (name, contact, etc.)"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Doctor, Payment, and Appointment */}
            <div className="space-y-6">
              {/* Doctor & Department Assignment */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <Stethoscope className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Doctor & Department Assignment</h2>
                </div>

                {/* Consultation Mode Selection */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Consultation Mode
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="single"
                        checked={formData.consultation_mode === 'single'}
                        onChange={(e) => setFormData({ ...formData, consultation_mode: e.target.value })}
                        style={{ accentColor: '#0056B3' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333333' }}>Single Doctor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="multiple"
                        checked={formData.consultation_mode === 'multiple'}
                        onChange={(e) => setFormData({ ...formData, consultation_mode: e.target.value })}
                        style={{ accentColor: '#0056B3' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333333' }}>Multiple Doctors</span>
                    </label>
                  </div>
                </div>

                {formData.consultation_mode === 'single' ? (
                  // Single Doctor Mode
                  <div className="space-y-4">
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Department
                      </label>
                      <select
                        value={formData.selected_department}
                        onChange={(e) => setFormData({ ...formData, selected_department: e.target.value, selected_doctor: '' })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          backgroundColor: '#FFFFFF',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="CUSTOM">Custom Department</option>
                      </select>

                      {/* Custom Department Input */}
                      {formData.selected_department === 'CUSTOM' && (
                        <div style={{ marginTop: '8px' }}>
                          <input
                            value={formData.custom_department_name}
                            onChange={(e) => setFormData({ ...formData, custom_department_name: e.target.value })}
                            placeholder="Enter custom department name"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CCCCCC',
                              fontSize: '16px',
                              color: '#333333',
                              backgroundColor: '#FFFFFF',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                            onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Doctor
                      </label>
                      <select
                        value={formData.selected_doctor}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          // Attempt to find the doctor in DB list to get ID
                          const doc = dbDoctors.find(d => d.name === selectedName);
                          setFormData({
                            ...formData,
                            selected_doctor: selectedName,
                            doctor_id: doc?.id || ''
                          });
                        }}
                        disabled={!formData.selected_department}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          backgroundColor: formData.selected_department ? '#FFFFFF' : '#F5F5F5',
                          outline: 'none',
                          cursor: formData.selected_department ? 'pointer' : 'not-allowed'
                        }}
                        onFocus={(e) => formData.selected_department && (e.currentTarget.style.borderColor = '#0056B3')}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      >
                        <option value="">Select Doctor</option>
                        {/* Show DB doctors if available, falling back to legacy list if needed, filtered by department */
                          (dbDoctors.length > 0 ? dbDoctors : filteredDoctors)
                            .filter(doc => !formData.selected_department || doc.department === formData.selected_department)
                            .map(doc => (
                              <option key={doc.name} value={doc.name}>{doc.name}</option>
                            ))
                        }
                        <option value="CUSTOM">Custom Doctor</option>
                      </select>

                      {/* Custom Doctor Input */}
                      {formData.selected_doctor === 'CUSTOM' && (
                        <div style={{ marginTop: '8px' }}>
                          <input
                            value={formData.custom_doctor_name}
                            onChange={(e) => setFormData({ ...formData, custom_doctor_name: e.target.value })}
                            placeholder="Enter custom doctor name"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CCCCCC',
                              fontSize: '16px',
                              color: '#333333',
                              backgroundColor: '#FFFFFF',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                            onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Multiple Doctors Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Department
                        </label>
                        <select
                          value={tempDepartment}
                          onChange={(e) => {
                            setTempDepartment(e.target.value);
                            setTempDoctor('');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            backgroundColor: '#FFFFFF',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Doctor
                        </label>
                        <select
                          value={tempDoctor}
                          onChange={(e) => setTempDoctor(e.target.value)}
                          disabled={!tempDepartment}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            backgroundColor: tempDepartment ? '#FFFFFF' : '#F5F5F5',
                            outline: 'none',
                            cursor: tempDepartment ? 'pointer' : 'not-allowed'
                          }}
                          onFocus={(e) => tempDepartment && (e.currentTarget.style.borderColor = '#0056B3')}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        >
                          <option value="">Select Doctor</option>
                          {filteredDoctors.map(doc => (
                            <option key={doc.name} value={doc.name}>{doc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addDoctorToList}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#0056B3',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004494'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0056B3'}
                    >
                      Add Doctor
                    </button>

                    {/* Selected Doctors List */}
                    {selectedDoctors.length > 0 && (
                      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F5F7FA', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#333333', marginBottom: '8px' }}>
                          Selected Doctors ({selectedDoctors.length})
                        </h4>
                        {selectedDoctors.map((doc) => (
                          <div key={doc.id} className="flex justify-between items-center mb-2" style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
                            <span style={{ fontSize: '14px', color: '#333333' }}>
                              {doc.doctorName} - {doc.department} (₹{doc.consultationFee})
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDoctorFromList(doc.id)}
                              style={{ color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Payment Details</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.consultation_mode === 'single' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.consultation_fee}
                        onChange={(e) => setFormData({ ...formData, consultation_fee: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          outline: 'none'
                        }}
                        placeholder="Enter fee"
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Discount Type
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="AMOUNT">Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Enter discount"
                      min="0"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Payment Mode
                    </label>
                    <select
                      value={formData.payment_mode}
                      onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="NET_BANKING">Net Banking</option>
                    </select>
                  </div>
                  {formData.payment_mode === 'ONLINE' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Online Method
                      </label>
                      <select
                        value={formData.online_payment_method}
                        onChange={(e) => setFormData({ ...formData, online_payment_method: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          backgroundColor: '#FFFFFF',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      >
                        <option value="UPI">UPI</option>
                        <option value="NET_BANKING">Net Banking</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Show Discount Reason when a discount value is provided */}
                {formData.discount_value > 0 && (
                  <div className="mt-4">
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Discount Reason
                    </label>
                    <input
                      type="text"
                      value={formData.discount_reason}
                      onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Reason for discount"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                )}
              </div>

              {/* Appointment Management */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Appointment Management</h2>
                </div>

                <div className="mb-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.schedule_appointment}
                      onChange={(e) => setFormData({ ...formData, schedule_appointment: e.target.checked })}
                      style={{ accentColor: '#0056B3' }}
                      className="w-5 h-5"
                    />
                    <span style={{ fontSize: '14px', color: '#333333', fontWeight: '500' }}>
                      Schedule an appointment
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.send_sms}
                      onChange={(e) => setFormData({ ...formData, send_sms: e.target.checked })}
                      style={{ accentColor: '#0056B3' }}
                      className="w-5 h-5"
                    />
                    <span style={{ fontSize: '14px', color: '#333333', fontWeight: '500' }}>
                      Send SMS confirmation to patient
                    </span>
                  </label>
                </div>

                {formData.schedule_appointment && (
                  <div className="space-y-4">
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Appointment Mode
                      </label>
                      <select
                        value={formData.appointment_mode}
                        onChange={(e) => setFormData({ ...formData, appointment_mode: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          backgroundColor: '#FFFFFF',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      >
                        <option value="none">Select Mode</option>
                        <option value="new_patient">For This New Patient</option>
                        <option value="existing_patient">For Existing Patient</option>
                      </select>
                    </div>

                    {formData.appointment_mode === 'existing_patient' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Search Existing Patient
                        </label>
                        <input
                          type="text"
                          value={formData.existing_patient_search}
                          onChange={(e) => setFormData({ ...formData, existing_patient_search: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            outline: 'none'
                          }}
                          placeholder="Search by name, ID, or phone"
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        />
                        {filteredPatients.length > 0 && (
                          <div style={{ marginTop: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #CCCCCC', borderRadius: '8px' }}>
                            {filteredPatients.map((patient) => (
                              <div
                                key={patient.patient_id}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    selected_existing_patient: patient,
                                    existing_patient_search: `${patient.first_name} ${patient.last_name} (${patient.patient_id})`
                                  });
                                  setFilteredPatients([]);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #E5E7EB'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F7FA'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                              >
                                <div style={{ fontSize: '14px', color: '#333333' }}>
                                  {patient.first_name} {patient.last_name} - {patient.patient_id}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999999' }}>
                                  {patient.phone}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(formData.appointment_mode === 'new_patient' || formData.appointment_mode === 'existing_patient') && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                              Appointment Date
                            </label>
                            <DatePicker
                              selected={formData.appointment_date}
                              onChange={(date: Date | null) => {
                                setFormData({ ...formData, appointment_date: date });
                              }}
                              dateFormat="dd-MM-yyyy"
                              minDate={new Date()}
                              maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
                              className="w-full"
                              customInput={
                                <input
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #CCCCCC',
                                    fontSize: '16px',
                                    color: '#333333',
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                                  onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                                />
                              }
                              placeholderText="Select appointment date"
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                              todayButton="Today"
                              popperClassName="react-datepicker-modern"
                              calendarClassName="react-datepicker-calendar-modern"
                              dayClassName={(date) => {
                                const today = new Date();
                                const isToday = date.toDateString() === today.toDateString();
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                if (isToday) return 'react-datepicker__day--today-custom';
                                if (isWeekend) return 'react-datepicker__day--weekend';
                                return 'react-datepicker__day--normal';
                              }}
                              showPopperArrow={false}
                              fixedHeight
                              scrollableMonthDropdown
                              scrollableYearDropdown
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                              Appointment Time
                            </label>
                            <input
                              type="time"
                              value={formData.appointment_time}
                              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #CCCCCC',
                                fontSize: '16px',
                                color: '#333333',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                            />
                          </div>
                        </div>

                        {formData.appointment_mode === 'new_patient' ? (
                          // For new patient - auto-populate from doctor/department selection above
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                                Doctor Name <span style={{ fontSize: '12px', color: '#0056B3' }}>(Auto from above selection)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.consultation_mode === 'single' ? formData.selected_doctor : ''}
                                onChange={(e) => setFormData({ ...formData, appointment_doctor_name: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #CCCCCC',
                                  fontSize: '16px',
                                  color: '#333333',
                                  backgroundColor: formData.consultation_mode === 'single' && formData.selected_doctor ? '#F5F7FA' : '#FFFFFF',
                                  outline: 'none'
                                }}
                                placeholder={formData.consultation_mode === 'single'
                                  ? (formData.selected_doctor || "Select doctor above first")
                                  : "Multiple doctors selected above"}
                                readOnly={formData.consultation_mode === 'single' && formData.selected_doctor}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                              />
                              {formData.consultation_mode === 'multiple' && selectedDoctors.length > 0 && (
                                <div style={{ fontSize: '12px', color: '#999999', marginTop: '4px' }}>
                                  💡 Multiple doctors: {selectedDoctors.map(doc => doc.doctorName).join(', ')}
                                </div>
                              )}
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                                Department <span style={{ fontSize: '12px', color: '#0056B3' }}>(Auto from above)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.consultation_mode === 'single' ? formData.selected_department : ''}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #CCCCCC',
                                  fontSize: '16px',
                                  color: '#333333',
                                  backgroundColor: '#F5F7FA',
                                  outline: 'none'
                                }}
                                placeholder={formData.consultation_mode === 'single'
                                  ? (formData.selected_department || "Select department above first")
                                  : "Multiple departments"}
                                readOnly
                              />
                            </div>
                          </div>
                        ) : (
                          // For existing patient - manual entry
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                                Department
                              </label>
                              <select
                                value={formData.appointment_department}
                                onChange={(e) => setFormData({ ...formData, appointment_department: e.target.value, appointment_doctor_name: '' })}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #CCCCCC',
                                  fontSize: '16px',
                                  color: '#333333',
                                  backgroundColor: '#FFFFFF',
                                  outline: 'none'
                                }}
                              >
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                                Doctor Name
                              </label>
                              <select
                                value={formData.appointment_doctor_name}
                                onChange={(e) => setFormData({ ...formData, appointment_doctor_name: e.target.value })}
                                disabled={!formData.appointment_department}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #CCCCCC',
                                  fontSize: '16px',
                                  color: '#333333',
                                  backgroundColor: formData.appointment_department ? '#FFFFFF' : '#F5F5F5',
                                  outline: 'none',
                                  cursor: formData.appointment_department ? 'pointer' : 'not-allowed'
                                }}
                              >
                                <option value="">Select Doctor</option>
                                {DOCTORS_DATA
                                  .filter(doc => !formData.appointment_department || doc.department === formData.appointment_department)
                                  .map(doc => (
                                    <option key={doc.name} value={doc.name}>{doc.name}</option>
                                  ))
                                }
                              </select>
                            </div>
                          </div>
                        )}

                        <div>
                          <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                            Appointment Type
                          </label>
                          <select
                            value={formData.appointment_type}
                            onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CCCCCC',
                              fontSize: '16px',
                              color: '#333333',
                              backgroundColor: '#FFFFFF',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                          >
                            <option value="">Select Type</option>
                            <option value="consultation">Consultation</option>
                            <option value="follow-up">Follow-up</option>
                            <option value="procedure">Procedure</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                            Appointment Notes
                          </label>
                          <textarea
                            value={formData.appointment_notes}
                            onChange={(e) => setFormData({ ...formData, appointment_notes: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CCCCCC',
                              fontSize: '16px',
                              color: '#333333',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                            rows={2}
                            placeholder="Additional notes for appointment"
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total Summary and Actions */}
          <div className="mt-6" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333333', marginBottom: '4px' }}>
                  Registration Summary
                </h3>
                <p style={{ fontSize: '14px', color: '#999999' }}>
                  {formData.consultation_mode === 'single'
                    ? `Consultation Fee: ₹${formData.consultation_fee || 0}`
                    : `Multiple Doctors: ${selectedDoctors.length} selected`
                  }
                  {/* Display discount info correctly */}
                  {formData.discount_value > 0 && (formData.discount_type === 'PERCENTAGE'
                    ? ` (${formData.discount_value}% discount)`
                    : ` (₹${formData.discount_value} discount)`)}
                </p>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0056B3' }}>
                ₹{(() => {
                  const total = formData.consultation_mode === 'single'
                    ? formData.consultation_fee
                    : selectedDoctors.reduce((total, doc) => total + (doc.consultationFee || 0), 0);

                  // compute discount based on type
                  const discount = formData.discount_value > 0
                    ? (formData.discount_type === 'PERCENTAGE'
                      ? (total * (formData.discount_value / 100))
                      : formData.discount_value)
                    : 0;

                  return (total - discount).toFixed(2);
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#E0E0E0',
                  color: '#333333',
                  border: '1px solid #CCCCCC',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D0D0D0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  borderRadius: '8px',
                  backgroundColor: loading ? '#999999' : '#0056B3',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#004494')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056B3')}
              >
                {loading ? 'Processing...' : (formData.appointment_mode === 'existing_patient' ? 'Schedule Appointment' : 'Register Patient')}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Queue Number Modal */}
      {showQueueModal && registeredPatient && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowQueueModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#E8F5E9',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check style={{ width: '48px', height: '48px', color: '#4CAF50' }} />
            </div>

            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#333333',
                marginBottom: '8px',
              }}
            >
              Patient Registered Successfully!
            </h2>

            <p
              style={{
                fontSize: '16px',
                color: '#666666',
                marginBottom: '32px',
              }}
            >
              {registeredPatient.first_name} {registeredPatient.last_name}
            </p>

            <div
              style={{
                backgroundColor: '#F0F7FF',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '24px',
                border: '2px solid #0056B3',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: '#666666',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: '600',
                }}
              >
                Your Queue Number
              </p>
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: '900',
                  color: '#0056B3',
                  lineHeight: '1',
                }}
              >
                {registeredPatient.queue_no}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F5F7FA',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>Patient ID:</span>
                <span style={{ color: '#333333', fontSize: '14px', fontWeight: '600' }}>
                  {registeredPatient.patient_id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>Status:</span>
                <span
                  style={{
                    color: '#4CAF50',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {registeredPatient.queue_status || 'Waiting'}
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: '#666666',
                marginBottom: '24px',
              }}
            >
              Please keep this queue number for reference. You will be called when your turn arrives.
            </p>

            <button
              onClick={() => setShowQueueModal(false)}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '8px',
                backgroundColor: '#0056B3',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#004494')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0056B3')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewFlexiblePatientEntry;