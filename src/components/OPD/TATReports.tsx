// TAT Reports Component
// Shows Turnaround Time analytics and reports

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Download,
  Calendar,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TATReport {
  date: string;
  totalPatients: number;
  avgWaitTime: number;
  avgConsultationTime: number;
  avgTotalTAT: number;
  breachRate: number;
  statusBreakdown: {
    normal: number;
    warning: number;
    critical: number;
    breached: number;
  };
}

const TATReports: React.FC = () => {
  const [reports, setReports] = useState<TATReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [selectedReport, setSelectedReport] = useState<TATReport | null>(null);

  // Mock data - in production, this would come from API
  const mockReports: TATReport[] = [
    {
      date: '2026-02-16',
      totalPatients: 45,
      avgWaitTime: 22.5,
      avgConsultationTime: 12.3,
      avgTotalTAT: 48.7,
      breachRate: 8.9,
      statusBreakdown: {
        normal: 32,
        warning: 8,
        critical: 3,
        breached: 2
      }
    },
    {
      date: '2026-02-15',
      totalPatients: 52,
      avgWaitTime: 25.1,
      avgConsultationTime: 13.8,
      avgTotalTAT: 52.4,
      breachRate: 11.5,
      statusBreakdown: {
        normal: 35,
        warning: 10,
        critical: 4,
        breached: 3
      }
    },
    {
      date: '2026-02-14',
      totalPatients: 38,
      avgWaitTime: 20.3,
      avgConsultationTime: 11.7,
      avgTotalTAT: 45.2,
      breachRate: 5.3,
      statusBreakdown: {
        normal: 28,
        warning: 7,
        critical: 2,
        breached: 1
      }
    },
    {
      date: '2026-02-13',
      totalPatients: 41,
      avgWaitTime: 23.8,
      avgConsultationTime: 12.9,
      avgTotalTAT: 49.6,
      breachRate: 9.8,
      statusBreakdown: {
        normal: 30,
        warning: 8,
        critical: 2,
        breached: 1
      }
    },
    {
      date: '2026-02-12',
      totalPatients: 47,
      avgWaitTime: 26.4,
      avgConsultationTime: 14.2,
      avgTotalTAT: 54.1,
      breachRate: 12.8,
      statusBreakdown: {
        normal: 32,
        warning: 9,
        critical: 4,
        breached: 2
      }
    },
    {
      date: '2026-02-11',
      totalPatients: 35,
      avgWaitTime: 19.7,
      avgConsultationTime: 11.2,
      avgTotalTAT: 43.5,
      breachRate: 5.7,
      statusBreakdown: {
        normal: 26,
        warning: 6,
        critical: 2,
        breached: 1
      }
    },
    {
      date: '2026-02-10',
      totalPatients: 50,
      avgWaitTime: 24.6,
      avgConsultationTime: 13.5,
      avgTotalTAT: 51.3,
      breachRate: 10.0,
      statusBreakdown: {
        normal: 35,
        warning: 9,
        critical: 4,
        breached: 2
      }
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);
  }, [dateRange]);

  const calculateSummary = () => {
    if (reports.length === 0) return null;

    const summary = {
      totalPatients: reports.reduce((sum, r) => sum + r.totalPatients, 0),
      avgWaitTime: reports.reduce((sum, r) => sum + r.avgWaitTime, 0) / reports.length,
      avgConsultationTime: reports.reduce((sum, r) => sum + r.avgConsultationTime, 0) / reports.length,
      avgTotalTAT: reports.reduce((sum, r) => sum + r.avgTotalTAT, 0) / reports.length,
      avgBreachRate: reports.reduce((sum, r) => sum + r.breachRate, 0) / reports.length,
      totalStatusBreakdown: {
        normal: reports.reduce((sum, r) => sum + r.statusBreakdown.normal, 0),
        warning: reports.reduce((sum, r) => sum + r.statusBreakdown.warning, 0),
        critical: reports.reduce((sum, r) => sum + r.statusBreakdown.critical, 0),
        breached: reports.reduce((sum, r) => sum + r.statusBreakdown.breached, 0)
      }
    };

    return summary;
  };

  const summary = calculateSummary();

  const handleExport = () => {
    // In production, this would generate and download a CSV/PDF
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Total Patients,Avg Wait Time,Avg Consultation Time,Avg Total TAT,Breach Rate,Normal,Warning,Critical,Breached\n"
      + reports.map(r => 
          `${r.date},${r.totalPatients},${r.avgWaitTime},${r.avgConsultationTime},${r.avgTotalTAT},${r.breachRate},${r.statusBreakdown.normal},${r.statusBreakdown.warning},${r.statusBreakdown.critical},${r.statusBreakdown.breached}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tat_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: keyof typeof reports[0]['statusBreakdown']) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-orange-100 text-orange-800';
      case 'breached': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: keyof typeof reports[0]['statusBreakdown']) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'breached': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">TAT Analytics & Reports</h2>
              <p className="text-sm text-gray-500">Turnaround Time performance metrics and insights</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setDateRange('today')}
                className={`px-4 py-2 text-sm font-medium ${dateRange === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 text-sm font-medium ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Week
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-4 py-2 text-sm font-medium ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Month
              </button>
            </div>
            
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Patients */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.totalPatients}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            {/* Average Wait Time */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.avgWaitTime.toFixed(1)} min</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="text-yellow-600" size={20} />
                </div>
              </div>
            </div>

            {/* Average Consultation Time */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Consultation</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.avgConsultationTime.toFixed(1)} min</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Clock className="text-green-600" size={20} />
                </div>
              </div>
            </div>

            {/* Breach Rate */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Breach Rate</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.avgBreachRate.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        {summary && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">TAT Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.totalStatusBreakdown).map(([status, count]) => (
                <div 
                  key={status} 
                  className={`p-4 rounded-lg flex items-center justify-between ${getStatusColor(status as any)}`}
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{status}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs opacity-75">
                      {((count / summary.totalPatients) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-white/50">
                    {getStatusIcon(status as any)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="text-gray-600" size={20} />
            Daily TAT Performance
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total TAT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breach Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${selectedReport?.date === report.date ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(report.date).toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.totalPatients}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.avgWaitTime.toFixed(1)} min</div>
                    <div className="text-xs text-gray-500">
                      {report.avgWaitTime > 25 ? '⚠️ High' : report.avgWaitTime < 20 ? '✅ Good' : '🟡 Normal'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.avgConsultationTime.toFixed(1)} min</div>
                    <div className="text-xs text-gray-500">
                      {report.avgConsultationTime > 14 ? '⚠️ High' : report.avgConsultationTime < 11 ? '✅ Good' : '🟡 Normal'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.avgTotalTAT.toFixed(1)} min</div>
                    <div className="text-xs text-gray-500">
                      {report.avgTotalTAT > 55 ? '⚠️ High' : report.avgTotalTAT < 45 ? '✅ Good' : '🟡 Normal'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${report