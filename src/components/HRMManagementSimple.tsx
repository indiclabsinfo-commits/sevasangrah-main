import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Users, Calendar, DollarSign, Clock, Settings,
  Star, GraduationCap, UserPlus, Building2, BarChart3,
  LogOut, Bell, Briefcase, ArrowLeft,
} from 'lucide-react';
import { hrmService } from '../services/hrmService';

// Lazy-loaded sub-components
const EmployeeList = lazy(() => import('./hrm/EmployeeList'));
const EmployeeForm = lazy(() => import('./hrm/EmployeeForm'));
const EmployeeProfile = lazy(() => import('./hrm/EmployeeProfile'));
const AttendanceTracker = lazy(() => import('./hrm/AttendanceTracker'));
const LeaveManagement = lazy(() => import('./hrm/LeaveManagement'));
const ShiftMaster = lazy(() => import('./hrm/shifts/ShiftMaster'));
const PayrollDashboard = lazy(() => import('./hrm/payroll/PayrollDashboard'));
const PerformanceDashboard = lazy(() => import('./hrm/performance/PerformanceDashboard'));
const TrainingCalendar = lazy(() => import('./hrm/training/TrainingCalendar'));
const RecruitmentDashboard = lazy(() => import('./hrm/recruitment/RecruitmentDashboard'));
const DepartmentMaster = lazy(() => import('./hrm/DepartmentMaster'));
const ExitDashboard = lazy(() => import('./hrm/exits/ExitDashboard'));
const AnnouncementBoard = lazy(() => import('./hrm/communication/AnnouncementBoard'));
const OnboardingList = lazy(() => import('./hrm/onboarding/OnboardingList'));

interface TabConfig {
  key: string;
  label: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: Clock },
  { key: 'leaves', label: 'Leaves', icon: Calendar },
  { key: 'shifts', label: 'Shifts', icon: Settings },
  { key: 'payroll', label: 'Payroll', icon: DollarSign },
  { key: 'performance', label: 'Performance', icon: Star },
  { key: 'training', label: 'Training', icon: GraduationCap },
  { key: 'recruitment', label: 'Recruitment', icon: UserPlus },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'exits', label: 'Exits', icon: LogOut },
  { key: 'announcements', label: 'Announcements', icon: Bell },
  { key: 'onboarding', label: 'Onboarding', icon: Briefcase },
];

const TabSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
  </div>
);

// Inline dashboard with real stats
const DashboardPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrmService
      .getDashboardStats()
      .then(setStats)
      .catch(() =>
        setStats({
          total_employees: 0,
          active_employees: 0,
          present_today: 0,
          absent_today: 0,
          on_leave: 0,
          pending_leaves: 0,
          departments: 0,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <TabSpinner />;

  const cards = [
    { label: 'Total Employees', value: stats?.total_employees ?? 0, icon: Users, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Active Employees', value: stats?.active_employees ?? 0, icon: Users, bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Present Today', value: stats?.present_today ?? 0, icon: Clock, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Absent Today', value: stats?.absent_today ?? 0, icon: Clock, bg: 'bg-red-50', text: 'text-red-600' },
    { label: 'On Leave', value: stats?.on_leave ?? 0, icon: Calendar, bg: 'bg-yellow-50', text: 'text-yellow-600' },
    { label: 'Pending Leaves', value: stats?.pending_leaves ?? 0, icon: Calendar, bg: 'bg-orange-50', text: 'text-orange-600' },
    { label: 'Departments', value: stats?.departments ?? 0, icon: Building2, bg: 'bg-purple-50', text: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{c.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
              <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HRMManagementSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  // Employee sub-views: 'list' | 'add' | 'edit' | 'profile'
  const [employeeView, setEmployeeView] = useState<'list' | 'add' | 'edit' | 'profile'>('list');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const handleAddEmployee = () => {
    setSelectedEmployeeId(null);
    setEmployeeView('add');
  };

  const handleEditEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setEmployeeView('edit');
  };

  const handleViewProfile = (id: string) => {
    setSelectedEmployeeId(id);
    setEmployeeView('profile');
  };

  const handleEmployeeFormClose = () => {
    setEmployeeView('list');
    setSelectedEmployeeId(null);
  };

  const handleEmployeeFormSuccess = () => {
    setEmployeeView('list');
    setSelectedEmployeeId(null);
  };

  // Reset employee sub-view when switching tabs
  useEffect(() => {
    if (activeTab !== 'employees') {
      setEmployeeView('list');
      setSelectedEmployeeId(null);
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'employees':
        if (employeeView === 'add' || employeeView === 'edit') {
          return (
            <Suspense fallback={<TabSpinner />}>
              <div className="mb-4">
                <button
                  onClick={handleEmployeeFormClose}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Employee List
                </button>
              </div>
              <EmployeeForm
                employeeId={selectedEmployeeId}
                onClose={handleEmployeeFormClose}
                onSuccess={handleEmployeeFormSuccess}
              />
            </Suspense>
          );
        }
        if (employeeView === 'profile' && selectedEmployeeId) {
          return (
            <Suspense fallback={<TabSpinner />}>
              <div className="mb-4">
                <button
                  onClick={handleEmployeeFormClose}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Employee List
                </button>
              </div>
              <EmployeeProfile
                employeeId={selectedEmployeeId}
                onBack={handleEmployeeFormClose}
              />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={<TabSpinner />}>
            <EmployeeList
              onAddEmployee={handleAddEmployee}
              onEditEmployee={handleEditEmployee}
              onViewProfile={handleViewProfile}
            />
          </Suspense>
        );
      case 'attendance':
        return <Suspense fallback={<TabSpinner />}><AttendanceTracker /></Suspense>;
      case 'leaves':
        return <Suspense fallback={<TabSpinner />}><LeaveManagement /></Suspense>;
      case 'shifts':
        return <Suspense fallback={<TabSpinner />}><ShiftMaster /></Suspense>;
      case 'payroll':
        return <Suspense fallback={<TabSpinner />}><PayrollDashboard /></Suspense>;
      case 'performance':
        return <Suspense fallback={<TabSpinner />}><PerformanceDashboard /></Suspense>;
      case 'training':
        return <Suspense fallback={<TabSpinner />}><TrainingCalendar /></Suspense>;
      case 'recruitment':
        return <Suspense fallback={<TabSpinner />}><RecruitmentDashboard /></Suspense>;
      case 'departments':
        return <Suspense fallback={<TabSpinner />}><DepartmentMaster /></Suspense>;
      case 'exits':
        return <Suspense fallback={<TabSpinner />}><ExitDashboard /></Suspense>;
      case 'announcements':
        return <Suspense fallback={<TabSpinner />}><AnnouncementBoard /></Suspense>;
      case 'onboarding':
        return <Suspense fallback={<TabSpinner />}><OnboardingList /></Suspense>;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">HR Management</h1>
        <p className="text-gray-500 mt-1">Manage employees, attendance, payroll and more</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{renderContent()}</div>
    </div>
  );
};

export default HRMManagementSimple;
