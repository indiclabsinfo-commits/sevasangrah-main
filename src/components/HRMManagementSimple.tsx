import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Clock, UserPlus, TrendingUp, Briefcase } from 'lucide-react';
import { Button } from './ui/Button';

const HRMManagementSimple: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
    payrollDue: 0
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setStats({
        totalEmployees: 45,
        onLeaveToday: 3,
        pendingLeaves: 7,
        payrollDue: 2
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
        <p className="text-gray-600 mt-2">Simplified version - Full features coming soon</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">On Leave Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.onLeaveToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Leaves</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeaves}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Payroll Due</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.payrollDue}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="flex items-center justify-center gap-2 py-4">
            <UserPlus className="w-5 h-5" />
            Add Employee
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 py-4">
            <Calendar className="w-5 h-5" />
            Manage Leaves
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 py-4">
            <DollarSign className="w-5 h-5" />
            Process Payroll
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 py-4">
            <TrendingUp className="w-5 h-5" />
            Performance Reviews
          </Button>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">HRM Module Update</h3>
            <div className="mt-2 text-blue-700">
              <p className="mb-2">We're currently optimizing the HRM module for better performance.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full self-service features coming soon</li>
                <li>Database optimizations in progress</li>
                <li>Mobile app integration planned</li>
                <li>All core HR functions remain available</li>
              </ul>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-5">
          <h4 className="font-medium text-gray-900 mb-2">Employee Self-Service</h4>
          <p className="text-sm text-gray-600">Leave applications, payslip access, and profile management</p>
          <div className="mt-3 text-xs text-gray-500">Coming Soon</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-5">
          <h4 className="font-medium text-gray-900 mb-2">Attendance Automation</h4>
          <p className="text-sm text-gray-600">Biometric integration and automated tracking</p>
          <div className="mt-3 text-xs text-gray-500">Coming Soon</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-5">
          <h4 className="font-medium text-gray-900 mb-2">Payroll Processing</h4>
          <p className="text-sm text-gray-600">Automated salary calculation and bank transfers</p>
          <div className="mt-3 text-xs text-gray-500">Coming Soon</div>
        </div>
      </div>
    </div>
  );
};

export default HRMManagementSimple;