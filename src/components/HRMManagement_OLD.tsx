import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  UserCheck,
  AlertCircle,
  Briefcase,
  CalendarDays,
  CheckSquare,
  Building2,
  LogOut,
  Megaphone,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Shield
} from 'lucide-react';
import { Button } from './ui/Button';
import hrmService from '../services/hrmService';
import EmployeeList from './hrm/EmployeeList';
import EmployeeForm from './hrm/EmployeeForm';
import AttendanceTracker from './hrm/attendance/AttendanceTracker';
import LeaveDashboard from './hrm/leaves/LeaveDashboard';
import PayrollDashboard from './hrm/payroll/PayrollDashboard';
import PerformanceDashboard from './hrm/performance/PerformanceDashboard';
import TrainingCalendar from './hrm/training/TrainingCalendar';
import RecruitmentDashboard from './hrm/recruitment/RecruitmentDashboard';
import OnboardingList from './hrm/onboarding/OnboardingList';
import DepartmentMaster from './hrm/DepartmentMaster';
import EmployeeProfile from './hrm/EmployeeProfile';
import ExitDashboard from './hrm/exits/ExitDashboard';
import PayrollReports from './hrm/payroll/PayrollReports';
import AnnouncementBoard from './hrm/communication/AnnouncementBoard';
import ShiftMaster from './hrm/shifts/ShiftMaster';
import MasterSheet from './hrm/rbac/MasterSheet';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigate?: (tab: string) => void;
}

type HRMView =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'leaves'
  | 'shifts'
  | 'payroll'
  | 'performance'
  | 'training'
  | 'recruitment'
  | 'onboarding'
  | 'departments'
  | 'exits'
  | 'payroll-reports'
  | 'announcements'
  | 'profile'
  | 'master-sheet';

const HRMManagement: React.FC<Props> = () => {
  const { hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState<HRMView>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['hrm-dashboard-stats'],
    queryFn: () => hrmService.getDashboardStats(),
  });

  const handleViewProfile = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setCurrentView('profile');
  };

  const handleAddEmployee = () => {
    setSelectedEmployeeId(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setShowEmployeeForm(true);
  };

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
    setSelectedEmployeeId(null);
  };

  // Navigation Groups
  const navGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Workforce',
      items: [
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'recruitment', label: 'Recruitment', icon: UserPlus },
        { id: 'onboarding', label: 'Onboarding', icon: CheckSquare },
        { id: 'exits', label: 'Exits', icon: LogOut },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'leaves', label: 'Leaves', icon: CalendarDays, badge: stats?.pending_leave_requests },
        { id: 'shifts', label: 'Shifts', icon: Clock },
      ]
    },
    {
      title: 'Finance',
      items: [
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'payroll-reports', label: 'Reports', icon: FileText },
      ]
    },
    {
      title: 'Development',
      items: [
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'training', label: 'Training', icon: Briefcase },
      ]
    },
    {
      title: 'Communication',
      items: [
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'master-sheet', label: 'Master Sheet', icon: Shield },
      ]
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your hospital staff and HR operations</p>
        </div>
        {hasPermission('hrm.employee.create') && (
          <Button onClick={handleAddEmployee} className="bg-primary-600 hover:bg-primary-700 shadow-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : stats?.total_employees || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Active: </span>
            <span className="font-semibold text-green-600 ml-1">
              {stats?.active_employees || 0}
            </span>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Present Today</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statsLoading ? '...' : stats?.present_today || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Absent: </span>
            <span className="font-semibold text-red-600 ml-1">
              {stats?.absent_today || 0}
            </span>
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">On Leave Today</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {statsLoading ? '...' : stats?.on_leave_today || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Pending: </span>
            <span className="font-semibold text-orange-600 ml-1">
              {stats?.pending_leave_requests || 0}
            </span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Departments</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {statsLoading ? '...' : stats?.departments_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">New Joinings: </span>
            <span className="font-semibold text-green-600 ml-1">
              {stats?.new_joinings_this_month || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity / Alerts */}
      {stats && stats.pending_leave_requests > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="font-semibold text-yellow-900">Pending Actions</h4>
            <p className="text-sm text-yellow-800 mt-1">
              You have {stats.pending_leave_requests} pending leave request{stats.pending_leave_requests > 1 ? 's' : ''} waiting for approval.
            </p>
            <button
              onClick={() => setCurrentView('leaves')}
              className="text-sm font-medium text-yellow-700 hover:text-yellow-900 mt-2 underline"
            >
              View Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (showEmployeeForm) {
      return (
        <div className="animate-fadeIn">
          <EmployeeForm
            employeeId={selectedEmployeeId}
            onClose={handleCloseEmployeeForm}
            onSuccess={() => {
              handleCloseEmployeeForm();
              refetchStats();
              toast.success(selectedEmployeeId ? 'Employee updated successfully' : 'Employee added successfully');
            }}
          />
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'employees':
        if (hasPermission('hrm.employee.view_all') || hasPermission('hrm.team.view')) {
          return (
            <EmployeeList
              onAddEmployee={handleAddEmployee}
              onEditEmployee={handleEditEmployee}
              onViewProfile={handleViewProfile}
            />
          );
        }
        return <div className="p-8 text-center text-gray-500">You do not have permission to view the employee list.</div>;
      case 'attendance':
        if (hasPermission('hrm.attendance.approve') || hasPermission('hrm.attendance.view_team') || hasPermission('hrm.self.view_profile')) {
          return <AttendanceTracker />;
        }
        return <div className="p-8 text-center text-gray-500">You do not have permission to view attendance.</div>;
      case 'leaves':
        if (hasPermission('hrm.leave.approve') || hasPermission('hrm.leave.approve_team') || hasPermission('hrm.leave.request')) {
          return <LeaveDashboard />;
        }
        return <div className="p-8 text-center text-gray-500">You do not have permission to view leaves.</div>;
      case 'shifts':
        return <ShiftMaster />;
      case 'payroll':
        if (hasPermission('hrm.payroll.manage') || hasPermission('hrm.self.view_payslip')) {
          return <PayrollDashboard onViewReports={() => setCurrentView('payroll-reports')} />;
        }
        return <div className="p-8 text-center text-gray-500">You do not have permission to view payroll.</div>;
      case 'performance':
        return <PerformanceDashboard />;
      case 'training':
        return <TrainingCalendar />;
      case 'recruitment':
        return <RecruitmentDashboard />;
      case 'onboarding':
        return <OnboardingList />;
      case 'departments':
        return <DepartmentMaster />;
      case 'exits':
        return <ExitDashboard />;
      case 'payroll-reports':
        return <PayrollReports />;
      case 'announcements':
        return <AnnouncementBoard />;
      case 'profile':
        return selectedEmployeeId ? (
          <EmployeeProfile
            employeeId={selectedEmployeeId}
            onBack={() => setCurrentView('employees')}
          />
        ) : (
          renderDashboard()
        );
      case 'master-sheet':
        if (hasPermission('admin_access') || hasPermission('system_settings')) {
          return <MasterSheet />;
        }
        return <div className="p-8 text-center text-gray-500">You do not have permission to access the Master Sheet.</div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {!isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
          } lg:block`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            <span className={`font-bold text-xl text-primary-600 ${!isSidebarOpen && 'lg:hidden'}`}>HRM System</span>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-6 px-2">
              {navGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${!isSidebarOpen && 'lg:hidden'}`}>
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id as HRMView);
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group relative ${currentView === item.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        title={!isSidebarOpen ? item.label : ''}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${currentView === item.id ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                          }`} />
                        <span className={`ml-3 ${!isSidebarOpen && 'lg:hidden'}`}>{item.label}</span>

                        {/* Badge */}
                        {item.badge && item.badge > 0 && (
                          <span className={`ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ${!isSidebarOpen && 'lg:absolute lg:top-0 lg:right-0 lg:translate-x-1/2 lg:-translate-y-1/2'}`}>
                            {item.badge}
                          </span>
                        )}

                        {/* Active Indicator */}
                        {currentView === item.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer (Toggle for Desktop) */}
          <div className="p-4 border-t border-gray-100 hidden lg:flex justify-end">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-3 font-bold text-lg text-gray-900">
              {navGroups.flatMap(g => g.items).find(i => i.id === currentView)?.label || 'HRM'}
            </span>
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default HRMManagement;
