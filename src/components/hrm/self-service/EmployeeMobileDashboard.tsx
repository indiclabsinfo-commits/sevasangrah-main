import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  LogOut,
  Bell,
  Settings,
  ChevronRight,
  Download,
  CheckCircle,
  AlertCircle,
  Home,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Shield,
  Heart,
  Stethoscope,
  Users as UsersIcon,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';

interface Props {
  onNavigate?: (section: string) => void;
}

const EmployeeMobileDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState([
    { id: 'apply-leave', label: 'Apply Leave', icon: Calendar, color: 'bg-blue-500' },
    { id: 'view-payslip', label: 'View Payslip', icon: DollarSign, color: 'bg-green-500' },
    { id: 'tax-declaration', label: 'Tax Declaration', icon: FileText, color: 'bg-purple-500' },
    { id: 'attendance', label: 'Attendance', icon: Clock, color: 'bg-orange-500' },
  ]);

  // Fetch employee profile
  const { data: employee, isLoading: loadingEmployee, refetch: refetchEmployee } = useQuery({
    queryKey: ['employee-self-profile', user?.id],
    queryFn: () => hrmService.getEmployeeById(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch leave balance
  const { data: leaveBalance, isLoading: loadingLeave } = useQuery({
    queryKey: ['employee-leave-balance', user?.id],
    queryFn: () => hrmService.getLeaveBalance(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch upcoming payslips
  const { data: upcomingPayslips, isLoading: loadingPayslips } = useQuery({
    queryKey: ['employee-upcoming-payslips', user?.id],
    queryFn: () => hrmService.getUpcomingPayslips(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch recent attendance
  const { data: recentAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['employee-recent-attendance', user?.id],
    queryFn: () => hrmService.getRecentAttendance(user?.id || '', 7),
    enabled: !!user?.id,
  });

  // Fetch notifications
  const { data: employeeNotifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['employee-notifications', user?.id],
    queryFn: () => hrmService.getNotifications(user?.id || ''),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (employeeNotifications) {
      setNotifications(employeeNotifications);
    }
  }, [employeeNotifications]);

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'apply-leave':
        onNavigate?.('leave-application');
        break;
      case 'view-payslip':
        onNavigate?.('payslip-portal');
        break;
      case 'tax-declaration':
        onNavigate?.('tax-declaration');
        break;
      case 'attendance':
        onNavigate?.('attendance-tracker');
        break;
    }
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    // Implement notification read logic
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification marked as read');
  };

  const handleDownloadPayslip = (payslipId: string) => {
    // Implement payslip download logic
    toast.success('Payslip download started');
  };

  const getDepartmentIcon = (departmentName?: string) => {
    if (!departmentName) return Briefcase;
    
    const dept = departmentName.toLowerCase();
    if (dept.includes('doctor') || dept.includes('medical')) return Stethoscope;
    if (dept.includes('nurse') || dept.includes('nursing')) return Heart;
    if (dept.includes('admin') || dept.includes('management')) return UsersIcon;
    if (dept.includes('finance') || dept.includes('accounts')) return DollarSign;
    return Briefcase;
  };

  const DepartmentIcon = getDepartmentIcon(employee?.department_name);

  if (loadingEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {employee?.photo_url ? (
                <img 
                  src={employee.photo_url} 
                  alt={employee.first_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {employee?.first_name} {employee?.last_name}
              </h1>
              <div className="flex items-center text-sm text-white/80 mt-1">
                <DepartmentIcon className="w-4 h-4 mr-1" />
                <span>{employee?.department_name || 'Department'}</span>
                <span className="mx-2">•</span>
                <span>{employee?.job_title || 'Position'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              onClick={() => onNavigate?.('settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Employee ID & Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-xs opacity-80">Employee ID</div>
            <div className="font-bold text-sm mt-1">{employee?.staff_unique_id || 'EMP-001'}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-xs opacity-80">Years of Service</div>
            <div className="font-bold text-sm mt-1">
              {employee?.date_of_joining ? 
                `${new Date().getFullYear() - new Date(employee.date_of_joining).getFullYear()} yrs` : 
                '0 yrs'}
            </div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-xs opacity-80">Leave Balance</div>
            <div className="font-bold text-sm mt-1">
              {typeof leaveBalance === 'object' && leaveBalance !== null 
                ? (leaveBalance.CL || 0) + ' days CL'
                : '0 days'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all"
              >
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mb-2`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6 space-y-6">
        {/* Upcoming Payslip */}
        {upcomingPayslips && upcomingPayslips.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Upcoming Payslip</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate?.('payslip-portal')}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingPayslips.slice(0, 1).map((payslip: any) => (
                <div key={payslip.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {payslip.month} {payslip.year}
                    </div>
                    <div className="text-sm text-gray-600">
                      Net Salary: ₹{payslip.net_salary?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadPayslip(payslip.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Attendance */}
        {recentAttendance && recentAttendance.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Recent Attendance</h3>
            <div className="space-y-2">
              {recentAttendance.slice(0, 5).map((attendance: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      attendance.status === 'Present' ? 'bg-green-100 text-green-600' :
                      attendance.status === 'Absent' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {attendance.status === 'Present' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : attendance.status === 'Absent' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {format(new Date(attendance.date), 'EEE, MMM d')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {attendance.check_in ? `In: ${attendance.check_in}` : 'Not checked in'}
                        {attendance.check_out ? ` | Out: ${attendance.check_out}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    attendance.status === 'Present' ? 'text-green-600' :
                    attendance.status === 'Absent' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {attendance.status}
                  </span>
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => onNavigate?.('attendance-tracker')}
            >
              View Full Attendance
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                {notifications.length} new
              </span>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border ${
                    notification.is_read ? 'border-gray-100 bg-gray-50' : 'border-blue-100 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkNotificationRead(notification.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {notifications.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => onNavigate?.('notifications')}
              >
                View All Notifications
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Employee Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-4">Your Information</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Work Email</div>
                <div className="font-medium text-gray-900">{employee?.work_email || 'Not set'}</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Personal Phone</div>
                <div className="font-medium text-gray-900">{employee?.personal_phone || 'Not set'}</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Residential Address</div>
                <div className="font-medium text-gray-900">
                  {employee?.residential_address ? 
                    `${employee.residential_address.substring(0, 40)}...` : 
                    'Not set'}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Statutory IDs</div>
                <div className="font-medium text-gray-900">
                  PAN: {employee?.pan_card_number || 'Not set'} | Aadhaar: {employee?.aadhaar_number ? '****' + employee.aadhaar_number.slice(-4) : 'Not set'}
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => onNavigate?.('profile')}
          >
            <User className="w-4 h-4 mr-2" />
            View Full Profile
          </Button>
        </div>

        {/* Emergency Contact & Help */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            Emergency & Help
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="font-medium text-gray-900">HR Help Desk</div>
              <div className="text-sm text-gray-600">Contact HR for urgent issues</div>
            </button>
            <button className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="font-medium text-gray-900">IT Support</div>
              <div className="text-sm text-gray-600">Technical issues with the system</div>
            </button>
            <button className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
              <div className="font-medium text-gray-900">Emergency Contact Update</div>
              <div className="text-sm text-gray-600">Update your emergency contacts</div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around">
        <button 
          className={`flex flex-col items-center p-2 ${activeTab === 'dashboard' ? 'text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 ${activeTab === 'leaves' ? 'text-primary-600' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('leaves');
            onNavigate?.('leave-application');
          }}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs mt-1">Leaves</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 ${activeTab === 'payslips' ? 'text-primary-600' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('payslips');
            onNavigate?.('payslip-portal');
          }}
        >
          <DollarSign className="w-6 h-6" />
          <span className="text-xs mt-1">Payslips</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-primary-600' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('profile');
            onNavigate?.('profile');
          }}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default EmployeeMobileDashboard;