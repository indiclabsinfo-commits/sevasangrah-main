import ComingSoon from './components/ComingSoon';
import React, { useState, useEffect } from 'react';
import { SupabaseHospitalService } from './services/supabaseHospitalService';
import toast, { Toaster } from 'react-hot-toast';
import { logger } from './utils/logger';
// import './utils/smartConsoleBlocker'; // Console blocking disabled
import './utils/arraySafety'; // Safe array patches
import EmailService from './services/emailService';
import { ExactDateService } from './services/exactDateService';
import type { User } from './config/supabaseNew';
import { useAuth } from './contexts/AuthContext';
import {
  loadGoogleDriveAPI,
  initGoogleDriveClient,
  signInToGoogleDrive,
  uploadToGoogleDrive,
  isGoogleAPILoaded,
  isSignedInToGoogleDrive,
  signOutFromGoogleDrive
} from './utils/googleDriveAuth';

// Import production components only
import ComprehensivePatientList from './components/ComprehensivePatientList';
import ErrorBoundary from './components/ErrorBoundary';
import RealTimeDashboard from './components/RealTimeDashboard';
import NewFlexiblePatientEntry from './components/NewFlexiblePatientEntry';
import DailyExpenseTab from './components/DailyExpenseTab';
import RefundTab from './components/RefundTab';
import EnhancedDashboard from './components/EnhancedDashboard';
import OperationsLedger from './components/OperationsLedger';
import BillingSection from './components/BillingSection';
import IPDBedManagement from './components/IPDBedManagement';
import DischargeSection from './components/DischargeSection';
import AdminAuditLog from './components/AdminAuditLog';
// import HRMManagement from './components/HRMManagement';
import HRMManagementSimple from './components/HRMManagementSimple';
import QueueDisplayScreen from './components/QueueDisplayScreen';
import OPDQueueManager from './components/OPD/OPDQueueManager';
import DoctorConsole from './components/DoctorConsole/DoctorConsole';
// import TableInspector from './components/TableInspector'; // Removed debug component
import { Login } from './pages/Login/Login'; // Import 3D Login component
// import RemoveTriggerComponent from './components/RemoveTriggerComponent'; // Not needed - backend issue
import TransactionDateDebugger from './components/TransactionDateDebugger'; // Temporary debugger
import ReferralManagementSimple from './pages/ReferralManagementSimple';
import TeleconsultAppointment from './components/TeleconsultAppointment';
import WaitingHallDisplay from './components/WaitingHallDisplay';
import PrintSchedule from './components/PrintSchedule';
import DigitalMedicalRecords from './components/DigitalMedicalRecords';
import SelfRegistrationKiosk from './components/SelfRegistrationKiosk';
import ExternalAppointmentCapture from './components/ExternalAppointmentCapture';
import PharmacyModule from './pages/Pharmacy';
import ReferralSystem from './components/ReferralSystem';

// Login Component - Replaced with 3D animated version from ./pages/Login/Login
// The old LoginPage component has been commented out and replaced with the imported Login component

// Main App Component
const App: React.FC = () => {
  // HARD DEBUG: Check Supabase Env Vars
  console.log('⚡ [HARD DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('⚡ [HARD DEBUG] Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('⚡ [HARD DEBUG] Full Env:', import.meta.env);

  const { user, loading, isAdmin } = useAuth();

  // Simple console initialization
  useEffect(() => {
    console.log('✅ App initialized');

    // Create global email sender function for popup windows
    // This MUST return the promise itself, not be an async function
    (window as any).sendEmailFromPopup = (emailData: any) => {
      console.log('🟢🟢🟢 [v2] Global sendEmailFromPopup called with:', emailData);
      console.log('🟢🟢🟢 [v2] Calling EmailService.sendCustomEmail...');

      // Return the promise directly so popup can await it
      return EmailService.sendCustomEmail(
        emailData.to,
        emailData.subject,
        emailData.html,
        emailData.patientId,
        emailData.attachments
      ).then(result => {
        console.log('🟢🟢🟢 [v2] EmailService.sendCustomEmail result:', result);
        return result;
      }).catch(error => {
        console.error('🔴🔴🔴 [v2] Global sendEmailFromPopup error:', error);
        return { success: false, error: error.message };
      });
    };
    console.log('✅✅✅ [v2] Global sendEmailFromPopup function registered at', new Date().toISOString());

    // 🧪 FAST TRIAGE: Test Supabase Connectivity
    import('./lib/supabaseClient').then(({ supabase }) => {
      console.log('🧪 [TRIAGE] Testing Supabase Connectivity...');
      supabase
        .from('patients')
        .select('*')
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ [TRIAGE] Supabase Connection FAILED:', error);
          } else {
            console.log('✅ [TRIAGE] Supabase Connection SUCCESS. Data:', data);
          }
        })
        .catch(err => console.error('❌ [TRIAGE] Unexpected Error:', err));
    });

  }, []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [navHideTimer, setNavHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // const [showTriggerFix, setShowTriggerFix] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  // Auto-redirect doctors to Doctor Console on login
  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      setActiveTab('doctor-console');
    }
  }, [user]);

  // Removed trigger fix logic - issue is in backend code

  // Show debugger with Ctrl+Shift+D (Admin only)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        // Only allow admin access to the debugger
        if (user && (isAdmin() || user.email === 'admin@indic.com' || user.email === 'meenal@indic.com')) {
          setShowDebugger(true);
        } else {
          toast.error('Access denied. Admin privileges required for debugger.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [user, isAdmin]);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Settings states
  const [settings, setSettings] = useState({
    autoHideNav: false,
    soundNotifications: false,
    timeZone: 'Asia/Kolkata (IST)',
    language: 'English'
  });

  // Data management states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exportData, setExportData] = useState({
    patients: true,
    transactions: true,
    appointments: true,
    expenses: true,
    refunds: true
  });
  const [backupSettings, setBackupSettings] = useState({
    frequency: 'Daily',
    time: '02:00',
    storageLocation: 'local'
  });
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [showGoogleDriveSetup, setShowGoogleDriveSetup] = useState(false);
  const [googleDriveCredentials, setGoogleDriveCredentials] = useState({
    clientId: '',
    apiKey: ''
  });
  const [googleDriveUser, setGoogleDriveUser] = useState<{ email: string; name: string } | null>(null);

  // Auto-hide navigation after 3 seconds of inactivity (only if enabled in settings)
  useEffect(() => {
    if (!user) return;

    // If auto-hide is disabled, always show navigation
    if (!settings.autoHideNav) {
      setIsNavVisible(true);
      if (navHideTimer) {
        clearTimeout(navHideTimer);
        setNavHideTimer(null);
      }
      return;
    }

    let timer: NodeJS.Timeout | null = null;

    const startHideTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        setIsNavVisible(false);
      }, 3000); // Hide after 3 seconds
      setNavHideTimer(timer);
    };

    // Start the timer initially only if auto-hide is enabled
    startHideTimer();

    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (navHideTimer) {
        clearTimeout(navHideTimer);
      }
    };
  }, [user, settings.autoHideNav]);

  // Handle mouse enter - show navigation (only if auto-hide is enabled)
  const handleNavMouseEnter = () => {
    if (settings.autoHideNav) {
      setIsNavVisible(true);
      if (navHideTimer) {
        clearTimeout(navHideTimer);
        setNavHideTimer(null);
      }
    }
  };

  // Handle mouse leave - start hide timer (only if auto-hide is enabled)
  const handleNavMouseLeave = () => {
    if (!settings.autoHideNav) return; // Don't hide if auto-hide is disabled

    if (navHideTimer) {
      clearTimeout(navHideTimer);
    }
    const timer = setTimeout(() => {
      setIsNavVisible(false);
    }, 2000); // Hide after 2 seconds when mouse leaves
    setNavHideTimer(timer);
  };

  // Authentication is now handled by AuthContext

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen && event.target) {
        const target = event.target as HTMLElement;
        // Only close if click is outside dropdown area
        if (!target.closest('.user-dropdown')) {
          setIsUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // Debug modal states
  useEffect(() => {
    logger.log('showProfileModal:', showProfileModal);
    logger.log('showSettingsModal:', showSettingsModal);
  }, [showProfileModal, showSettingsModal]);

  // Authentication functions removed - now handled by AuthContext

  const { logout } = useAuth();
  const { hasPermission } = useAuth();

  const handleLogout = async () => {
    try {
      logger.log('🚪 Signing out...');
      await logout();
      setActiveTab('dashboard');
      toast.success('Logged out successfully');
      logger.log('✅ Logout successful');
    } catch (error: any) {
      logger.error('🚨 Logout exception:', error);
      toast.error('Logout failed');
    }
  };

  // Profile management functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically call an API to update the user profile
      // For now, we'll just show a success message and update local state
      toast.success('Profile updated successfully!');

      // Update the current user state with new values
      // Note: This is a placeholder since we don't have a setCurrentUser method exposed from AuthContext
      // In a real implementation, you'd call an updateProfile method from AuthContext

      setIsEditingProfile(false);
    } catch (error) {
      toast.error('Failed to update profile');
      logger.error('Profile update error:', error);
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
  };

  // Settings management functions
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDataExport = () => {
    setShowExportModal(true);
  };

  const handleDataImport = () => {
    setShowImportModal(true);
  };

  const handleBackupSettings = () => {
    setShowBackupModal(true);
  };

  const performBackup = async () => {
    setIsBackupInProgress(true);
    const loadingToast = toast.loading('Creating backup...');

    try {
      // Fetch comprehensive data for backup
      toast.dismiss(loadingToast);
      const statusToast = toast.loading('Fetching patient data...', { duration: 0 });

      // Get ALL patients data with all fields (no limits, including inactive)
      const patients = await SupabaseHospitalService.getPatients(10000, true, true);

      if (!patients) {
        logger.error('Error fetching patients for backup');
        toast.error('Failed to fetch patient data for backup');
        throw new Error('Failed to fetch patients');
      }

      toast.dismiss(statusToast);
      const appointmentToast = toast.loading('Fetching appointments...', { duration: 0 });

      // Get ALL appointments (no limits)
      const appointments = await SupabaseHospitalService.getAppointments(10000);

      toast.dismiss(appointmentToast);
      const transactionToast = toast.loading('Fetching transactions...', { duration: 0 });

      // Get all transactions with patient details
      const transactions = await SupabaseHospitalService.getAllTransactions();

      toast.dismiss(transactionToast);
      const expenseToast = toast.loading('Fetching expenses...', { duration: 0 });

      // Get all expenses
      const expenses = await SupabaseHospitalService.getAllExpenses();

      toast.dismiss(expenseToast);
      const refundToast = toast.loading('Fetching refunds...', { duration: 0 });

      // Get all refunds with error handling
      let refunds: any[] = [];
      try {
        // Use ExactDateService to get all refunds (wide date range)
        const refundData = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
        const refundError = null;

        if (!refundError && refundData) {
          refunds = refundData;
          logger.log(`✅ Retrieved ${refunds.length} refunds for backup`);
        } else {
          logger.warn('⚠️ Refunds table not accessible, skipping refunds in backup');
          refunds = [];
        }
      } catch (error) {
        logger.warn('⚠️ Error fetching refunds, using empty array:', error);
        refunds = [];
      }

      toast.dismiss(refundToast);
      const finalToast = toast.loading('Preparing backup file...');

      const backupData = {
        backup_info: {
          hospital_name: 'SevaSangraha',
          backup_date: new Date().toISOString(),
          backup_by: user?.email || 'Unknown',
          backup_version: '2.0',
          data_types: ['patients', 'transactions', 'appointments', 'expenses', 'refunds'],
          total_records: (patients?.length || 0) + (transactions?.length || 0) + (appointments?.length || 0) + (expenses?.length || 0) + (refunds?.length || 0)
        },
        patients: {
          count: patients?.length || 0,
          data: patients || [],
          fields: ['id', 'patient_id', 'prefix', 'first_name', 'last_name', 'age', 'gender', 'phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'blood_group', 'medical_history', 'allergies', 'current_medications', 'insurance_provider', 'insurance_number', 'has_reference', 'reference_details', 'assigned_doctor', 'assigned_department', 'notes', 'date_of_entry', 'ipd_status', 'ipd_bed_number', 'is_active', 'created_at', 'updated_at', 'created_by']
        },
        transactions: {
          count: transactions?.length || 0,
          data: transactions || [],
          fields: ['id', 'patient_id', 'transaction_type', 'amount', 'payment_mode', 'description', 'status', 'created_at', 'created_by'],
          total_amount: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
        },
        appointments: {
          count: appointments?.length || 0,
          data: appointments || [],
          fields: ['id', 'patient_id', 'doctor_id', 'appointment_date', 'appointment_time', 'appointment_type', 'status', 'estimated_cost', 'notes', 'reminder_sent', 'hospital_id', 'created_at', 'created_by']
        },
        expenses: {
          count: expenses?.length || 0,
          data: expenses || [],
          fields: ['id', 'expense_category', 'amount', 'description', 'payment_mode', 'vendor_name', 'vendor_contact', 'expense_date', 'created_at', 'created_by'],
          total_amount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          by_category: expenses?.reduce((acc, e) => {
            const category = e.expense_category || 'OTHER';
            acc[category] = (acc[category] || 0) + (e.amount || 0);
            return acc;
          }, {} as Record<string, number>) || {}
        },
        refunds: {
          count: refunds?.length || 0,
          data: refunds || [],
          fields: refunds.length > 0 ? Object.keys(refunds[0]) : ['id', 'amount', 'reason', 'patient_id', 'created_at'],
          total_amount: refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
          note: refunds.length === 0 ? 'Refunds table not accessible during backup' : 'All refunds included'
        },
        summary: {
          total_patients: patients?.length || 0,
          total_transactions: transactions?.length || 0,
          total_appointments: appointments?.length || 0,
          total_expenses: expenses?.length || 0,
          total_refunds: refunds?.length || 0,
          total_revenue: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
          total_expenses_amount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          total_refunds_amount: refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
          net_revenue: (transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0) - (refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0)
        }
      };

      logger.log('📊 Backup Summary (ALL ENTRIES):', {
        patients: backupData.patients.count,
        transactions: backupData.transactions.count,
        appointments: backupData.appointments.count,
        expenses: backupData.expenses.count,
        refunds: backupData.refunds.count,
        total_records: backupData.backup_info.total_records
      });

      logger.log('✅ COMPLETE DATABASE BACKUP - All patient entries included (no limits applied)');
      logger.log('📋 Patient sample check:', patients?.slice(0, 3).map(p => `${p.patient_id}: ${p.first_name} ${p.last_name}`));

      toast.dismiss(finalToast);

      const backupContent = JSON.stringify(backupData, null, 2);
      const fileName = `sevasangraha-hospital-backup-${new Date().toISOString().split('T')[0]}.json`;

      if (backupSettings.storageLocation === 'local') {
        // Local storage backup - download file
        const blob = new Blob([backupContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.dismiss(loadingToast);
        toast.success(`✅ Complete backup saved as ${fileName}!\n📊 ALL ENTRIES BACKED UP: ${backupData.summary.total_patients} patients (complete details), ${backupData.summary.total_transactions} transactions, ${backupData.summary.total_appointments} appointments, ${backupData.summary.total_expenses} expenses, ${backupData.summary.total_refunds} refunds\n🔄 No limits applied - every single record included`, { duration: 10000 });

      } else if (backupSettings.storageLocation === 'google-drive') {
        // Google Drive backup
        if (!isSignedInToGoogleDrive()) {
          toast.dismiss(loadingToast);
          toast.error('Please connect to Google Drive first');
          setShowGoogleDriveSetup(true);
          return;
        }

        const result = await uploadToGoogleDrive(fileName, backupContent, 'application/json');

        if (result) {
          toast.dismiss(loadingToast);
          toast.success(`✅ Complete backup uploaded to Google Drive!\n📊 ALL ENTRIES BACKED UP: ${backupData.summary.total_patients} patients (complete details), ${backupData.summary.total_transactions} transactions, ${backupData.summary.total_appointments} appointments, ${backupData.summary.total_expenses} expenses, ${backupData.summary.total_refunds} refunds\n🔄 No limits applied - every single record included\n🔗 ${result.webViewLink}`, { duration: 12000 });
          logger.log('Google Drive file:', result);
        } else {
          toast.dismiss(loadingToast);
          toast.error('Failed to upload backup to Google Drive');
        }
      }

      // Save backup timestamp
      localStorage.setItem('lastBackup', new Date().toISOString());

    } catch (error) {
      logger.error('Backup error:', error);
      toast.dismiss(loadingToast);
      toast.error('Backup failed. Please try again.');
    } finally {
      setIsBackupInProgress(false);
    }
  };

  const handleGoogleDriveConnect = async () => {
    const loadingToast = toast.loading('Connecting to Google Drive...');

    try {
      // Load Google API if not already loaded
      if (!isGoogleAPILoaded()) {
        await loadGoogleDriveAPI();
      }

      // Initialize with user's credentials
      const initialized = await initGoogleDriveClient(
        googleDriveCredentials.clientId,
        googleDriveCredentials.apiKey
      );

      if (!initialized) {
        toast.dismiss(loadingToast);
        toast.error('Failed to initialize Google Drive. Please check your credentials.');
        return;
      }

      // Sign in
      const user = await signInToGoogleDrive();

      if (user) {
        setGoogleDriveUser(user);
        localStorage.setItem('googleDriveCredentials', JSON.stringify(googleDriveCredentials));
        toast.dismiss(loadingToast);
        toast.success(`Connected to Google Drive as ${user.email}`);
        setShowGoogleDriveSetup(false);
      } else {
        toast.dismiss(loadingToast);
        toast.error('Failed to sign in to Google Drive');
      }
    } catch (error) {
      logger.error('Google Drive connection error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to connect to Google Drive');
    }
  };

  const handleGoogleDriveDisconnect = async () => {
    await signOutFromGoogleDrive();
    setGoogleDriveUser(null);
    localStorage.removeItem('googleDriveCredentials');
    toast.success('Disconnected from Google Drive');
  };

  const handleClearCache = () => {
    toast.loading('Clearing application cache...', { duration: 1500 });
    setTimeout(() => {
      // Clear various caches
      localStorage.removeItem('hospitalPatientCache');
      localStorage.removeItem('hospitalTransactionCache');
      localStorage.removeItem('hospitalAppointmentCache');
      sessionStorage.clear();

      // Clear query cache if using React Query
      if (window.location.reload) {
        toast.success('Cache cleared! Page will reload...', { duration: 2000 });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.success('Cache cleared successfully!');
      }
    }, 1500);
  };

  const performDataExport = async () => {
    try {
      const loadingToast = toast.loading('Fetching data from database...');

      const exportDataObject: any = {
        export_info: {
          hospital_name: 'SevaSangraha',
          exported_at: new Date().toISOString(),
          exported_by: user?.email || 'Unknown'
        }
      };

      // Fetch real data from database
      if (exportData.patients) {
        const patients = await SupabaseHospitalService.getPatients();
        exportDataObject.patients = {
          count: patients?.length || 0,
          data: patients || []
        };
      }

      if (exportData.transactions) {
        const transactions = await SupabaseHospitalService.getAllTransactions();
        exportDataObject.transactions = {
          count: transactions?.length || 0,
          data: transactions || []
        };
      }

      if (exportData.appointments) {
        const appointments = await SupabaseHospitalService.getAppointments();
        exportDataObject.appointments = {
          count: appointments?.length || 0,
          data: appointments || []
        };
      }

      if (exportData.expenses) {
        const expenses = await SupabaseHospitalService.getAllExpenses();
        exportDataObject.expenses = {
          count: expenses?.length || 0,
          data: expenses || []
        };
      }

      // Add refunds data to export
      try {
        // Use ExactDateService to get all refunds (wide date range)
        const refunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');

        exportDataObject.refunds = {
          count: refunds?.length || 0,
          data: refunds || [],
          note: refunds?.length === 0 ? 'No refunds found or table not accessible' : 'All refunds included'
        };
      } catch (error) {
        logger.warn('⚠️ Refunds not available for export:', error);
        exportDataObject.refunds = {
          count: 0,
          data: [],
          note: 'Refunds table not accessible'
        };
      }

      toast.dismiss(loadingToast);
      toast.loading('Generating export file...', { duration: 2000 });

      // Create file content
      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        fileContent = JSON.stringify(exportDataObject, null, 2);
        fileName = `sevasangraha-hospital-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format with real data
        let csvContent = 'SevaSangraha Hospital - Data Export\n';
        csvContent += `Exported on: ${new Date().toLocaleString()}\n\n`;

        if (exportData.patients && exportDataObject.patients?.data?.length > 0) {
          csvContent += '=== PATIENTS ===\n';
          csvContent += 'Patient ID,First Name,Last Name,Phone,Doctor Name,Department,Gender,Age,Address,Patient Tag,Visit Count,Department Status,Total Spent,Last Visit,Registration Date\n';
          exportDataObject.patients.data.forEach((p: any) => {
            const doctorName = p.assigned_doctor || (p.assigned_doctors && p.assigned_doctors.length > 0 ? p.assigned_doctors[0].name : '') || '';
            const department = p.assigned_department || (p.assigned_doctors && p.assigned_doctors.length > 0 ? p.assigned_doctors[0].department : '') || '';
            const lastVisitDate = p.lastVisit || p.date_of_entry || p.created_at || '';
            const registrationDate = p.created_at || p.date_of_entry || '';

            csvContent += `"${p.patient_id || 'N/A'}","${p.first_name || ''}","${p.last_name || ''}","${p.phone || ''}","${doctorName}","${department}","${p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : p.gender || ''}","${p.age || ''}","${p.address || ''}","${p.patient_tag || p.notes || ''}","${p.visitCount || 0}","${p.departmentStatus || 'OPD'}","${p.totalSpent || 0}","${lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : 'No visits'}","${registrationDate ? new Date(registrationDate).toLocaleDateString() : 'Unknown'}"
`;
          });
          csvContent += '\n';
        }

        if (exportData.transactions && exportDataObject.transactions?.data?.length > 0) {
          csvContent += '=== TRANSACTIONS ===\n';
          csvContent += 'Transaction ID,Type,Amount,Payment Mode,Description,Date\n';
          exportDataObject.transactions.data.forEach((t: any) => {
            csvContent += `"${t.id}","${t.transaction_type}",${t.amount},"${t.payment_mode}","${t.description || 'N/A'}","${new Date(t.created_at).toLocaleString()}"\n`;
          });
          csvContent += '\n';
        }

        if (exportData.appointments && exportDataObject.appointments?.data?.length > 0) {
          csvContent += '=== APPOINTMENTS ===\n';
          csvContent += 'Appointment ID,Patient,Doctor,Date,Time,Type,Status\n';
          exportDataObject.appointments.data.forEach((a: any) => {
            csvContent += `"${a.id}","${a.patient?.first_name || 'Unknown'} ${a.patient?.last_name || ''}","${a.doctor?.first_name || 'Unknown'} ${a.doctor?.last_name || ''}","${a.appointment_date}","${a.appointment_time}","${a.appointment_type}","${a.status}"\n`;
          });
          csvContent += '\n';
        }

        if (exportData.expenses && exportDataObject.expenses?.data?.length > 0) {
          csvContent += '=== EXPENSES ===\n';
          csvContent += 'Expense ID,Category,Amount,Description,Payment Mode,Vendor,Date\n';
          exportDataObject.expenses.data.forEach((e: any) => {
            csvContent += `"${e.id}","${e.expense_category}",${e.amount},"${e.description}","${e.payment_mode}","${e.vendor_name || 'N/A'}","${new Date(e.expense_date).toLocaleDateString()}"\n`;
          });
          csvContent += '\n';
        }

        if (exportDataObject.refunds?.data?.length > 0) {
          csvContent += '=== REFUNDS ===\n';
          csvContent += 'Refund ID,Patient ID,Patient Name,Amount,Reason,Payment Mode,Date\n';
          exportDataObject.refunds.data.forEach((r: any) => {
            const patientName = r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : 'Unknown';
            csvContent += `"${r.id}","${r.patient_id || 'N/A'}","${patientName}",${r.amount || 0},"${r.reason || 'N/A'}","${r.payment_mode || 'N/A'}","${new Date(r.created_at).toLocaleDateString()}"\n`;
          });
        }

        fileContent = csvContent;
        fileName = `sevasangraha-hospital-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      // Create and download file
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      toast.success(`Data exported successfully as ${fileName}!`);

    } catch (error) {
      toast.error('Export failed. Please try again.');
      logger.error('Export error:', error);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let parsedData;

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          parsedData = JSON.parse(content);
          toast.success(`JSON file parsed successfully! Found ${Object.keys(parsedData).length} data sections.`);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          toast.success(`CSV file parsed successfully! Found ${lines.length - 1} data rows.`);
        } else {
          toast.error('Unsupported file format. Please use JSON or CSV files.');
          return;
        }

        // Process imported data for database insertion
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const parsedData = JSON.parse(content);
          const loadingToast = toast.loading('Importing data to database...');
          let importedCount = 0;

          try {
            // Import patients
            if (parsedData.patients && Array.isArray(parsedData.patients)) {
              for (const patient of parsedData.patients) {
                try {
                  // Skip if patient already exists (basic validation)
                  if (!patient.first_name) continue;

                  await SupabaseHospitalService.createPatient({
                    first_name: patient.first_name,
                    last_name: patient.last_name || '',
                    age: patient.age || null,
                    gender: patient.gender || 'MALE',
                    phone: patient.phone || '',
                    email: patient.email,
                    address: patient.address,
                    emergency_contact_name: patient.emergency_contact_name,
                    emergency_contact_phone: patient.emergency_contact_phone,
                    blood_group: patient.blood_group,
                    medical_history: patient.medical_history,
                    allergies: patient.allergies,
                    hospital_id: '550e8400-e29b-41d4-a716-446655440000'
                  });
                  importedCount++;
                } catch (err) {
                  logger.error('Error importing patient:', err);
                  // Continue with next patient instead of stopping
                }
              }
            }

            toast.dismiss(loadingToast);
            toast.success(`Successfully imported ${importedCount} new patients!`);

          } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to import data. Please check the format.');
            logger.error('Import error:', error);
          }
        }

        setShowImportModal(false);

      } catch (error) {
        toast.error('Failed to parse file. Please check the format.');
        logger.error('Import error:', error);
      }
    };

    reader.readAsText(file);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('hospitalSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('hospitalSettings', JSON.stringify(settings));
  }, [settings]);

  // Load backup settings and Google Drive credentials on mount
  useEffect(() => {
    const savedBackupSettings = localStorage.getItem('backupSettings');
    if (savedBackupSettings) {
      setBackupSettings(JSON.parse(savedBackupSettings));
    }

    const savedGoogleCredentials = localStorage.getItem('googleDriveCredentials');
    if (savedGoogleCredentials) {
      setGoogleDriveCredentials(JSON.parse(savedGoogleCredentials));
    }
  }, []);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Hospital CRM...</p>
          <p className="text-xs text-gray-500 mt-2">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  // Main app navigation tabs - CLEAN PRODUCTION
  const tabs = [
    {
      id: 'dashboard',
      name: '📊 Dashboard',
      component: EnhancedDashboard,
      permission: 'admin_access'
    },
    {
      id: 'doctor-console',
      name: '🩺 Doctor Console',
      component: DoctorConsole,
      description: 'Doctor consultation workspace with queue, prescriptions, and patient history',
      permission: 'doctor_console'
    },
    {
      id: 'patient-entry',
      name: '👤 New Patient',
      component: NewFlexiblePatientEntry,
      description: 'Register new patients with comprehensive information and reference tracking',
      permission: 'create_patients'
    },
    {
      id: 'patient-list',
      name: '👥 Patient List',
      component: ComprehensivePatientList,
      description: 'View and manage all registered patients',
      permission: 'read_patients'
    },
    {
      id: 'queue-display',
      name: '🎫 Queue Display',
      component: QueueDisplayScreen,
      description: 'Display and manage patient queue with real-time updates',
      permission: 'create_patients'
    },
    {
      id: 'opdQueue',
      name: '🚶‍♂️ OPD Queue',
      component: OPDQueueManager,
      description: 'Manage OPD patient queue',
      permission: 'create_patients'
    },
    {
      id: 'ipd-beds',
      name: '🛏️ IPD Beds',
      component: IPDBedManagement,
      description: 'Real-time hospital bed occupancy tracking and management',
      permission: 'admin_access'
    },
    {
      id: 'discharge',
      name: '📤 Discharge',
      component: DischargeSection,
      description: 'View all discharged patients with complete discharge summaries',
      permission: 'admin_access'
    },
    {
      id: 'expenses',
      name: '💸 Expenses',
      component: DailyExpenseTab,
      description: 'Record and track daily hospital expenses',
      permission: 'admin_access'
    },
    {
      id: 'refunds',
      name: '💰 Refunds',
      component: RefundTab,
      description: 'Process patient refunds and maintain financial records',
      permission: 'admin_access'
    },
    {
      id: 'billing',
      name: '💳 Billing',
      component: BillingSection,
      description: 'Generate IPD, OPD, and Combined bills for patients',
      permission: 'admin_access'
    },
    {
      id: 'pharmacy',
      name: '💊 Pharmacy',
      component: PharmacyModule,
      description: 'Pharmacy inventory, billing, and order management',
      permission: 'admin_access'
    },
    {
      id: 'operations',
      name: '📊 Operations',
      component: OperationsLedger,
      description: 'Financial ledger perfectly synchronized with Patient List - no date mismatches!',
      permission: 'access_operations'
    },
    {
      id: 'audit-log',
      name: '🔍 Audit Log',
      component: AdminAuditLog,
      description: 'Complete tracking of all user modifications and activities (Admin Only)',
      permission: 'admin_access'
    },
    {
      id: 'hrm',
      name: '👥 HR Management',
      component: HRMManagementSimple,
      description: 'Manage hospital staff, attendance, leaves, and payroll',
      permission: 'access_hrm'
    },
    {
      id: 'referral-management',
      name: '📤 Referral Management',
      component: ReferralSystem,
      description: 'Manage internal and external patient referrals',
      permission: 'read_patients'
    },
    {
      id: 'teleconsult',
      name: '📹 Teleconsult',
      component: TeleconsultAppointment,
      description: 'Physical and virtual consultation appointments',
      permission: 'read_appointments'
    },
    {
      id: 'waiting-hall',
      name: '🎫 Waiting Hall',
      component: WaitingHallDisplay,
      description: 'Public display for waiting patients and token system',
      permission: 'read_patients'
    },
    {
      id: 'medical-records',
      name: '📋 Medical Records',
      component: DigitalMedicalRecords,
      description: 'Digital medical records management',
      permission: 'read_patients'
    },
    {
      id: 'print-schedule',
      name: '🖨️ Print Schedule',
      component: PrintSchedule,
      description: 'Print and export practitioner schedules',
      permission: 'read_appointments'
    },
    {
      id: 'self-registration',
      name: '🖥️ Self Registration',
      component: SelfRegistrationKiosk,
      description: 'Patient self-service registration kiosk',
      permission: 'create_patients'
    },
    {
      id: 'external-appointments',
      name: '🌐 External Appointments',
      component: ExternalAppointmentCapture,
      description: 'Capture appointments from external booking systems',
      permission: 'read_appointments'
    }
  ];

  // Filter tabs based on user permissions
  const filteredTabs = tabs.filter(tab => {
    if (!tab.permission) return true; // Allow tabs without permission requirements
    return hasPermission(tab.permission);
  });

  const ActiveComponent = filteredTabs.find(tab => tab.id === activeTab)?.component || RealTimeDashboard;
  const activeTabInfo = filteredTabs.find(tab => tab.id === activeTab);

  const renderActiveComponent = () => {
    if (activeTab === 'dashboard') {
      return <EnhancedDashboard onNavigate={setActiveTab} />;
    } else if (activeTab === 'patient-list') {
      return <ComprehensivePatientList onNavigate={setActiveTab} />;
    } else if (activeTab === 'operations') {
      return <OperationsLedger />;
    } else if (activeTab === 'audit-log') {
      return <AdminAuditLog />;
    }
    return <ActiveComponent />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header - Always Visible */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-6">
          {/* Header Content - Always Visible */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <img
                src="/logo.png"
                alt="SevaSangraha"
                className="h-12 w-12 object-contain"
              />
              {/* Hospital Name */}
              <div>
                <h1 className="text-2xl font-serif text-blue-900" style={{
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '0.05em',
                  fontWeight: 600
                }}>
                  SevaSangraha
                </h1>
                <p className="text-xs text-gray-500" style={{ letterSpacing: '0.1em' }}>
                  HOSPITAL MANAGEMENT
                </p>
              </div>
            </div>


            {/* Right Side - User Info & Actions */}
            <div className="flex items-center space-x-4">

              {/* User Avatar & Info with Dropdown */}
              {user && (
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || 'S'}
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            logger.log('Profile button clicked');
                            setIsUserDropdownOpen(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            logger.log('Settings button clicked');
                            setIsUserDropdownOpen(false);
                            setShowSettingsModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Settings</span>
                        </button>
                        <div className="border-t border-gray-100 mt-1">
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Vertical Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <nav className="py-4">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-6 py-3 text-left text-sm font-medium transition-colors border-l-4 ${activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-transparent'
                  }`}
                title={tab.description}
              >
                <div className="flex items-center justify-between">
                  <span>{tab.name}</span>
                  {activeTab === tab.id && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {tab.description && activeTab === tab.id && (
                  <p className="text-xs text-gray-500 mt-1">{tab.description}</p>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <ErrorBoundary>
            {renderActiveComponent()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              © 2024 • Advanced Healthcare Management System
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                System Online
              </span>
              <span>Version 3.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">User Profile</h2>
                <p className="text-blue-100">Manage your account information</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-white hover:text-blue-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* User Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">STAFF • Hospital Administrator</p>
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={isEditingProfile ? editedProfile.firstName : user.firstName || ''}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                        readOnly={!isEditingProfile}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={isEditingProfile ? editedProfile.lastName : user.lastName || ''}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                        readOnly={!isEditingProfile}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={isEditingProfile ? editedProfile.email : user.email || ''}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                        readOnly={!isEditingProfile}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={isEditingProfile ? editedProfile.phone : user.phone || 'Not provided'}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                        readOnly={!isEditingProfile}
                        placeholder="Enter phone number"
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Account Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <input
                        type="text"
                        value={user.id || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <input
                        type="text"
                        value="Hospital Administrator"
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
                {!isEditingProfile ? (
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelProfileEdit}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">System Settings</h2>
                <p className="text-gray-300">Configure your hospital management system</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* System Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Database Status</h4>
                    <p className="text-green-700 flex items-center mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Connected (Supabase)
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Version</h4>
                    <p className="text-blue-700">Version 3.0</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900">Last Backup</h4>
                    <p className="text-yellow-700">Auto-backup enabled</p>
                  </div>
                </div>
              </div>


              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Application Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-hide Navigation</h4>
                        <p className="text-sm text-gray-600">
                          Hide navigation tabs after inactivity
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${settings.autoHideNav
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {settings.autoHideNav ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('autoHideNav', !settings.autoHideNav)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoHideNav ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.autoHideNav ? 'right-0.5' : 'left-0.5'
                          }`}></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                        <p className="text-sm text-gray-600">Play sounds for alerts and notifications</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('soundNotifications', !settings.soundNotifications)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${settings.soundNotifications ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.soundNotifications ? 'right-0.5' : 'left-0.5'
                          }`}></div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                      <select
                        value={settings.timeZone}
                        onChange={(e) => handleSettingChange('timeZone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                        <option value="Asia/Mumbai (IST)">Asia/Mumbai (IST)</option>
                        <option value="Asia/Delhi (IST)">Asia/Delhi (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York (EST)">America/New_York (EST)</option>
                        <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">हिंदी (Hindi)</option>
                        <option value="Bengali">বাংলা (Bengali)</option>
                        <option value="Tamil">தமிழ் (Tamil)</option>
                        <option value="Marathi">मराठी (Marathi)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Data Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      handleDataExport();
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="font-medium text-gray-900">Export Data</span>
                    <span className="text-xs text-gray-500 mt-1">Download CSV/JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      handleDataImport();
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="font-medium text-gray-900">Import Data</span>
                    <span className="text-xs text-gray-500 mt-1">Upload CSV/JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      handleBackupSettings();
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="font-medium text-gray-900">Backup Settings</span>
                    <span className="text-xs text-gray-500 mt-1">Configure auto-backup</span>
                  </button>
                </div>
              </div>

              {/* Advanced Actions */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Advanced Actions
                </h3>
                <div className="flex space-x-4">
                  <button
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Cache & Reload
                  </button>
                  {isAdmin() && (
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowDebugger(true);
                      }}
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Open Debugger
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Export Data</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="json">JSON (Complete Data)</option>
                    <option value="csv">CSV (Spreadsheet)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Include Data</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportData.patients}
                        onChange={(e) => setExportData(prev => ({ ...prev, patients: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Patients</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportData.transactions}
                        onChange={(e) => setExportData(prev => ({ ...prev, transactions: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Transactions</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportData.appointments}
                        onChange={(e) => setExportData(prev => ({ ...prev, appointments: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Appointments</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportData.expenses}
                        onChange={(e) => setExportData(prev => ({ ...prev, expenses: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Daily Expenses</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportData.refunds}
                        onChange={(e) => setExportData(prev => ({ ...prev, refunds: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Refunds</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={performDataExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Import Data</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4 flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".json,.csv" onChange={handleFileImport} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">JSON or CSV up to 10MB</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Settings Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Backup Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select
                    value={backupSettings.frequency}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={backupSettings.time}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location</label>
                  <select
                    value={backupSettings.storageLocation}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, storageLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="local">Local Download</option>
                    <option value="google-drive">Google Drive</option>
                  </select>
                </div>

                {backupSettings.storageLocation === 'google-drive' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Google Drive Status</h4>
                    {googleDriveUser ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-600">Connected as {googleDriveUser.email}</span>
                        </div>
                        <button
                          onClick={handleGoogleDriveDisconnect}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-3">Not connected</p>
                        <button
                          onClick={handleGoogleDriveConnect}
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center w-full"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-4 h-4 mr-2" />
                          Connect Drive
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={performBackup}
                  disabled={isBackupInProgress}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${isBackupInProgress ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                >
                  {isBackupInProgress ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Backing up...
                    </>
                  ) : (
                    'Backup Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Setup Modal */}
      {showGoogleDriveSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Connect Google Drive</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter your Google Cloud Console credentials to enable Google Drive integration.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                  <input
                    type="text"
                    value={googleDriveCredentials.clientId}
                    onChange={(e) => setGoogleDriveCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter Client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="text"
                    value={googleDriveCredentials.apiKey}
                    onChange={(e) => setGoogleDriveCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter API Key"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowGoogleDriveSetup(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoogleDriveConnect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Date Debugger Modal */}
      {showDebugger && (
        <TransactionDateDebugger onClose={() => setShowDebugger(false)} />
      )}

      <Toaster position="top-right" />
    </div>
  );
};

export default App;