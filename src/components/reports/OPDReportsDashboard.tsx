// OPD Reports & MIS Dashboard
// Feature: Comprehensive OPD reports with charts and export

import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, RefreshCw, Users, IndianRupee, TrendingUp, Stethoscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../../services/apiService';

const COLORS = ['#0056B3', '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#795548'];

const OPDReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'mis' | 'doctor'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [misData, setMisData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);

  useEffect(() => {
    loadReport();
  }, [activeTab, selectedDate, selectedMonth]);

  const loadReport = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'daily':
          const daily = await api.reports.opdDaily(selectedDate);
          setDailyData(daily);
          break;
        case 'monthly':
          const monthly = await api.reports.opdMonthly(selectedMonth);
          setMonthlyData(monthly);
          break;
        case 'mis':
          const mis = await api.reports.misOverview();
          setMisData(mis);
          break;
        case 'doctor':
          const doctor = await api.reports.doctorWise(dateFrom, dateTo);
          setDoctorData(doctor);
          break;
      }
    } catch (err) {
      console.warn('Could not load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = 'blue' }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className={`p-2 bg-${color}-100 rounded-lg`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">OPD Reports & MIS</h2>
            <p className="text-sm text-gray-600">Comprehensive analytics and management information</p>
          </div>
        </div>

        <button
          onClick={loadReport}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'daily', label: 'Daily Report' },
            { key: 'monthly', label: 'Monthly Report' },
            { key: 'mis', label: 'MIS Overview' },
            { key: 'doctor', label: 'Doctor-wise' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Daily Report */}
          {activeTab === 'daily' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Patients"
                  value={dailyData?.total_patients || 0}
                  icon={<Users size={20} className="text-blue-600" />}
                />
                <StatCard
                  label="New Patients"
                  value={dailyData?.new_patients || 0}
                  icon={<Users size={20} className="text-green-600" />}
                  color="green"
                />
                <StatCard
                  label="Follow-ups"
                  value={dailyData?.followup_patients || 0}
                  icon={<TrendingUp size={20} className="text-orange-600" />}
                  color="orange"
                />
                <StatCard
                  label="Revenue"
                  value={`Rs.${(dailyData?.total_revenue || 0).toLocaleString()}`}
                  icon={<IndianRupee size={20} className="text-purple-600" />}
                  color="purple"
                />
              </div>

              {/* Department Breakdown */}
              {dailyData?.by_department && dailyData.by_department.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Department Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData.by_department}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0056B3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Monthly Report */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Patients"
                  value={monthlyData?.total_patients || 0}
                  icon={<Users size={20} className="text-blue-600" />}
                />
                <StatCard
                  label="Average Daily"
                  value={monthlyData?.avg_daily || 0}
                  icon={<TrendingUp size={20} className="text-green-600" />}
                  color="green"
                />
                <StatCard
                  label="Peak Day"
                  value={monthlyData?.peak_day || '-'}
                  icon={<Calendar size={20} className="text-orange-600" />}
                  color="orange"
                />
                <StatCard
                  label="Total Revenue"
                  value={`Rs.${(monthlyData?.total_revenue || 0).toLocaleString()}`}
                  icon={<IndianRupee size={20} className="text-purple-600" />}
                  color="purple"
                />
              </div>

              {/* Daily Trend */}
              {monthlyData?.daily_trend && monthlyData.daily_trend.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData.daily_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#0056B3" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* MIS Overview */}
          {activeTab === 'mis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Registered"
                  value={misData?.total_patients || 0}
                  icon={<Users size={20} className="text-blue-600" />}
                />
                <StatCard
                  label="Active This Month"
                  value={misData?.active_this_month || 0}
                  icon={<TrendingUp size={20} className="text-green-600" />}
                  color="green"
                />
                <StatCard
                  label="Active Doctors"
                  value={misData?.active_doctors || 0}
                  icon={<Stethoscope size={20} className="text-orange-600" />}
                  color="orange"
                />
                <StatCard
                  label="Monthly Revenue"
                  value={`Rs.${(misData?.monthly_revenue || 0).toLocaleString()}`}
                  icon={<IndianRupee size={20} className="text-purple-600" />}
                  color="purple"
                />
              </div>

              {/* Department Distribution */}
              {misData?.department_distribution && misData.department_distribution.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Patient Distribution by Department</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={misData.department_distribution}
                          dataKey="count"
                          nameKey="department"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {misData.department_distribution.map((_: any, index: number) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {misData?.monthly_trend && misData.monthly_trend.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly Patient Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={misData.monthly_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0056B3" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Doctor-wise Report */}
          {activeTab === 'doctor' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={loadReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Apply
                </button>
              </div>

              {doctorData && Array.isArray(doctorData) && doctorData.length > 0 ? (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Doctor Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={doctorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="doctor_name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="patient_count" fill="#0056B3" radius={[4, 4, 0, 0]} name="Patients" />
                        <Bar dataKey="revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table View */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Detailed View</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patients</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Patient</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {doctorData.map((doc: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.doctor_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{doc.department || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-800">{doc.patient_count}</td>
                              <td className="px-4 py-3 text-sm text-gray-800">Rs.{(doc.revenue || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                Rs.{doc.patient_count ? Math.round((doc.revenue || 0) / doc.patient_count).toLocaleString() : 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                  <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600">No data available</p>
                  <p className="text-sm text-gray-500 mt-1">Select a date range and click Apply</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OPDReportsDashboard;
