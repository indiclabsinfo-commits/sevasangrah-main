// OPD Reports & MIS Dashboard
// Comprehensive OPD reports with real Supabase data, charts, and export

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Calendar, Download, RefreshCw, Users, IndianRupee,
  TrendingUp, Stethoscope, Clock, Activity, FileText, ArrowUpRight,
  ArrowDownRight, Minus, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

const getSupabase = async () => {
  const { supabase } = await import('../../lib/supabaseClient');
  return supabase;
};

const COLORS = ['#0056B3', '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#795548', '#E91E63', '#607D8B'];

const OPDReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'mis' | 'doctor' | 'department' | 'revenue'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [misData, setMisData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);

  // ========== DATA LOADERS ==========

  const loadDailyReport = useCallback(async () => {
    const supabase = await getSupabase();
    const startOfDay = `${selectedDate}T00:00:00`;
    const endOfDay = `${selectedDate}T23:59:59`;

    const [patientsRes, consultationsRes, queueRes, transactionsRes] = await Promise.all([
      supabase.from('patients').select('id, gender, age, assigned_department, patient_tag, created_at')
        .gte('created_at', startOfDay).lte('created_at', endOfDay),
      supabase.from('opd_consultations').select('id, doctor_id, patient_id, status, consultation_date, chief_complaints, diagnosis')
        .gte('consultation_date', startOfDay).lte('consultation_date', endOfDay),
      supabase.from('opd_queue').select('id, queue_status, created_at, updated_at, doctor_id')
        .gte('created_at', startOfDay).lte('created_at', endOfDay),
      supabase.from('patient_transactions').select('id, amount, transaction_type, status, created_at')
        .gte('created_at', startOfDay).lte('created_at', endOfDay)
        .neq('status', 'CANCELLED'),
    ]);

    const patients = patientsRes.data || [];
    const consultations = consultationsRes.data || [];
    const queue = queueRes.data || [];
    const transactions = transactionsRes.data || [];

    // Revenue calculation
    const totalRevenue = transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

    // Department breakdown
    const deptMap: Record<string, number> = {};
    patients.forEach((p: any) => {
      const dept = p.assigned_department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const byDepartment = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // Gender distribution
    const genderMap: Record<string, number> = {};
    patients.forEach((p: any) => {
      const g = (p.gender || 'Unknown').toUpperCase();
      genderMap[g] = (genderMap[g] || 0) + 1;
    });
    const byGender = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

    // Age group distribution
    const ageGroups: Record<string, number> = { '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    patients.forEach((p: any) => {
      const age = p.age || 0;
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 30) ageGroups['19-30']++;
      else if (age <= 45) ageGroups['31-45']++;
      else if (age <= 60) ageGroups['46-60']++;
      else ageGroups['60+']++;
    });
    const byAgeGroup = Object.entries(ageGroups).map(([group, count]) => ({ group, count }));

    // Patient tag distribution
    const tagMap: Record<string, number> = {};
    patients.forEach((p: any) => {
      const tag = p.patient_tag || 'Regular';
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
    const byTag = Object.entries(tagMap).map(([name, value]) => ({ name, value }));

    // Queue stats
    const queueCompleted = queue.filter((q: any) => q.queue_status === 'COMPLETED').length;
    const queueWaiting = queue.filter((q: any) => q.queue_status === 'WAITING').length;
    const queueInConsultation = queue.filter((q: any) => q.queue_status === 'IN_CONSULTATION').length;

    // Average wait time (queue created_at to updated_at for completed)
    const completedQueue = queue.filter((q: any) => q.queue_status === 'COMPLETED' && q.updated_at);
    const avgWaitMinutes = completedQueue.length > 0
      ? Math.round(completedQueue.reduce((sum: number, q: any) => {
          return sum + (new Date(q.updated_at).getTime() - new Date(q.created_at).getTime()) / 60000;
        }, 0) / completedQueue.length)
      : 0;

    // Hourly distribution
    const hourly: Record<string, number> = {};
    for (let h = 8; h <= 20; h++) {
      hourly[`${h}:00`] = 0;
    }
    patients.forEach((p: any) => {
      const hour = new Date(p.created_at).getHours();
      const key = `${hour}:00`;
      if (hourly[key] !== undefined) hourly[key]++;
    });
    const byHour = Object.entries(hourly).map(([hour, count]) => ({ hour, count }));

    setDailyData({
      total_patients: patients.length,
      new_patients: patients.length,
      followup_patients: consultations.filter((c: any) => c.chief_complaints?.toLowerCase().includes('follow')).length,
      total_consultations: consultations.length,
      completed_consultations: consultations.filter((c: any) => c.status === 'COMPLETED').length,
      total_revenue: totalRevenue,
      avg_revenue_per_patient: patients.length > 0 ? Math.round(totalRevenue / patients.length) : 0,
      queue_total: queue.length,
      queue_completed: queueCompleted,
      queue_waiting: queueWaiting,
      queue_in_consultation: queueInConsultation,
      avg_wait_minutes: avgWaitMinutes,
      by_department: byDepartment,
      by_gender: byGender,
      by_age_group: byAgeGroup,
      by_tag: byTag,
      by_hour: byHour,
    });
  }, [selectedDate]);

  const loadMonthlyReport = useCallback(async () => {
    const supabase = await getSupabase();
    const [year, month] = selectedMonth.split('-').map(Number);
    const startOfMonth = `${selectedMonth}-01T00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${selectedMonth}-${lastDay}T23:59:59`;

    const [patientsRes, consultationsRes, transactionsRes] = await Promise.all([
      supabase.from('patients').select('id, created_at, assigned_department')
        .gte('created_at', startOfMonth).lte('created_at', endOfMonth),
      supabase.from('opd_consultations').select('id, consultation_date, status, doctor_id, patient_id')
        .gte('consultation_date', startOfMonth).lte('consultation_date', endOfMonth),
      supabase.from('patient_transactions').select('id, amount, created_at, transaction_type')
        .gte('created_at', startOfMonth).lte('created_at', endOfMonth)
        .neq('status', 'CANCELLED'),
    ]);

    const patients = patientsRes.data || [];
    const consultations = consultationsRes.data || [];
    const transactions = transactionsRes.data || [];

    const totalRevenue = transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

    // Daily trend
    const dailyMap: Record<string, { patients: number; consultations: number; revenue: number }> = {};
    for (let d = 1; d <= lastDay; d++) {
      const key = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      dailyMap[key] = { patients: 0, consultations: 0, revenue: 0 };
    }
    patients.forEach((p: any) => {
      const day = p.created_at?.split('T')[0];
      if (day && dailyMap[day]) dailyMap[day].patients++;
    });
    consultations.forEach((c: any) => {
      const day = c.consultation_date?.split('T')[0];
      if (day && dailyMap[day]) dailyMap[day].consultations++;
    });
    transactions.forEach((t: any) => {
      const day = t.created_at?.split('T')[0];
      if (day && dailyMap[day]) dailyMap[day].revenue += parseFloat(t.amount) || 0;
    });
    const daily_trend = Object.entries(dailyMap).map(([date, data]) => ({
      date: date.slice(8), // just day number
      ...data,
    }));

    // Peak day
    const peakDay = daily_trend.reduce((max, d) => d.patients > max.patients ? d : max, { date: '-', patients: 0 });

    // Week-over-week comparison
    const weeks: { week: string; patients: number; revenue: number }[] = [];
    for (let w = 0; w < 5; w++) {
      const weekStart = w * 7 + 1;
      const weekEnd = Math.min(weekStart + 6, lastDay);
      const weekPatients = daily_trend.slice(weekStart - 1, weekEnd).reduce((s, d) => s + d.patients, 0);
      const weekRevenue = daily_trend.slice(weekStart - 1, weekEnd).reduce((s, d) => s + d.revenue, 0);
      if (weekStart <= lastDay) {
        weeks.push({ week: `W${w + 1}`, patients: weekPatients, revenue: Math.round(weekRevenue) });
      }
    }

    const uniqueDoctors = new Set(consultations.map((c: any) => c.doctor_id)).size;
    const avgDaily = Math.round(patients.length / lastDay);

    setMonthlyData({
      total_patients: patients.length,
      total_consultations: consultations.length,
      total_revenue: totalRevenue,
      avg_daily: avgDaily,
      peak_day: `Day ${peakDay.date} (${peakDay.patients} patients)`,
      active_doctors: uniqueDoctors,
      completed: consultations.filter((c: any) => c.status === 'COMPLETED').length,
      daily_trend,
      weekly_comparison: weeks,
    });
  }, [selectedMonth]);

  const loadMISOverview = useCallback(async () => {
    const supabase = await getSupabase();
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 7)}-01T00:00:00`;
    const yearStart = `${today.slice(0, 4)}-01-01T00:00:00`;

    const [
      totalPatientsRes, todayPatientsRes, monthPatientsRes,
      totalConsultRes, todayConsultRes, monthConsultRes,
      todayQueueRes, admissionsRes,
      monthRevenueRes, yearRevenueRes, doctorsRes,
      deptPatientsRes
    ] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
      supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('opd_consultations').select('id', { count: 'exact', head: true }),
      supabase.from('opd_consultations').select('id', { count: 'exact', head: true }).gte('consultation_date', `${today}T00:00:00`),
      supabase.from('opd_consultations').select('id', { count: 'exact', head: true }).gte('consultation_date', monthStart),
      supabase.from('opd_queue').select('id, queue_status', { count: 'exact' }).gte('created_at', `${today}T00:00:00`),
      supabase.from('patient_admissions').select('id, status', { count: 'exact' }),
      supabase.from('patient_transactions').select('amount').gte('created_at', monthStart).neq('status', 'CANCELLED'),
      supabase.from('patient_transactions').select('amount').gte('created_at', yearStart).neq('status', 'CANCELLED'),
      supabase.from('doctors').select('id').eq('is_active', true),
      supabase.from('patients').select('assigned_department').gte('created_at', monthStart),
    ]);

    const monthRevenue = (monthRevenueRes.data || []).reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
    const yearRevenue = (yearRevenueRes.data || []).reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

    const todayQueue = todayQueueRes.data || [];
    const admissions = admissionsRes.data || [];

    // Department distribution
    const deptMap: Record<string, number> = {};
    (deptPatientsRes.data || []).forEach((p: any) => {
      const dept = p.assigned_department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const department_distribution = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly trend (last 6 months)
    const monthly_trend: { month: string; patients: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.toISOString().slice(0, 7);
      const mStart = `${m}-01T00:00:00`;
      const mEnd = `${m}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}T23:59:59`;
      const { count } = await supabase.from('patients').select('id', { count: 'exact', head: true })
        .gte('created_at', mStart).lte('created_at', mEnd);
      monthly_trend.push({ month: d.toLocaleString('default', { month: 'short' }), patients: count || 0 });
    }

    setMisData({
      total_patients: totalPatientsRes.count || 0,
      patients_today: todayPatientsRes.count || 0,
      patients_this_month: monthPatientsRes.count || 0,
      total_consultations: totalConsultRes.count || 0,
      consultations_today: todayConsultRes.count || 0,
      consultations_this_month: monthConsultRes.count || 0,
      queue_today: todayQueue.length,
      queue_waiting: todayQueue.filter((q: any) => q.queue_status === 'WAITING').length,
      queue_completed: todayQueue.filter((q: any) => q.queue_status === 'COMPLETED').length,
      total_admissions: admissions.length,
      current_admissions: admissions.filter((a: any) => a.status === 'ADMITTED').length,
      active_doctors: (doctorsRes.data || []).length,
      monthly_revenue: monthRevenue,
      yearly_revenue: yearRevenue,
      department_distribution,
      monthly_trend,
    });
  }, []);

  const loadDoctorReport = useCallback(async () => {
    const supabase = await getSupabase();
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    const { data: consultations } = await supabase.from('opd_consultations')
      .select('id, doctor_id, patient_id, status, consultation_date')
      .gte('consultation_date', startDate).lte('consultation_date', endDate);

    const { data: doctors } = await supabase.from('users')
      .select('id, first_name, last_name, department');

    const { data: transactions } = await supabase.from('patient_transactions')
      .select('amount, patient_id, created_at')
      .gte('created_at', startDate).lte('created_at', endDate)
      .neq('status', 'CANCELLED');

    const doctorMap = new Map((doctors || []).map((d: any) => [d.id, d]));
    const patientRevenue = new Map<string, number>();
    (transactions || []).forEach((t: any) => {
      patientRevenue.set(t.patient_id, (patientRevenue.get(t.patient_id) || 0) + (parseFloat(t.amount) || 0));
    });

    // Group consultations by doctor
    const stats: Record<string, { doctor_name: string; department: string; total: number; completed: number; patients: Set<string>; revenue: number }> = {};
    (consultations || []).forEach((c: any) => {
      if (!stats[c.doctor_id]) {
        const doc = doctorMap.get(c.doctor_id);
        stats[c.doctor_id] = {
          doctor_name: doc ? `${doc.first_name} ${doc.last_name || ''}`.trim() : 'Unknown',
          department: doc?.department || '-',
          total: 0, completed: 0, patients: new Set(), revenue: 0,
        };
      }
      stats[c.doctor_id].total++;
      if (c.status === 'COMPLETED') stats[c.doctor_id].completed++;
      stats[c.doctor_id].patients.add(c.patient_id);
      stats[c.doctor_id].revenue += patientRevenue.get(c.patient_id) || 0;
    });

    const doctorStats = Object.values(stats).map((s: any) => ({
      ...s,
      unique_patients: s.patients.size,
      patients: undefined,
      avg_per_day: Math.round(s.total / (Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000)))),
      completion_rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    setDoctorData(doctorStats);
  }, [dateFrom, dateTo]);

  const loadDepartmentReport = useCallback(async () => {
    const supabase = await getSupabase();
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    const { data: patients } = await supabase.from('patients')
      .select('id, assigned_department, gender, age, patient_tag, created_at')
      .gte('created_at', startDate).lte('created_at', endDate);

    const { data: transactions } = await supabase.from('patient_transactions')
      .select('amount, patient_id, created_at')
      .gte('created_at', startDate).lte('created_at', endDate)
      .neq('status', 'CANCELLED');

    const patientRevenue = new Map<string, number>();
    (transactions || []).forEach((t: any) => {
      patientRevenue.set(t.patient_id, (patientRevenue.get(t.patient_id) || 0) + (parseFloat(t.amount) || 0));
    });

    const deptStats: Record<string, { department: string; patients: number; male: number; female: number; revenue: number; vip: number; emergency: number }> = {};
    (patients || []).forEach((p: any) => {
      const dept = p.assigned_department || 'General';
      if (!deptStats[dept]) {
        deptStats[dept] = { department: dept, patients: 0, male: 0, female: 0, revenue: 0, vip: 0, emergency: 0 };
      }
      deptStats[dept].patients++;
      if (p.gender?.toUpperCase() === 'MALE') deptStats[dept].male++;
      if (p.gender?.toUpperCase() === 'FEMALE') deptStats[dept].female++;
      if (p.patient_tag === 'VIP') deptStats[dept].vip++;
      if (p.patient_tag === 'Emergency') deptStats[dept].emergency++;
      deptStats[dept].revenue += patientRevenue.get(p.id) || 0;
    });

    setDepartmentData(Object.values(deptStats).sort((a, b) => b.patients - a.patients));
  }, [dateFrom, dateTo]);

  const loadRevenueReport = useCallback(async () => {
    const supabase = await getSupabase();
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    const { data: transactions } = await supabase.from('patient_transactions')
      .select('id, amount, transaction_type, status, description, created_at')
      .gte('created_at', startDate).lte('created_at', endDate)
      .neq('status', 'CANCELLED');

    const txns = transactions || [];
    const totalRevenue = txns.reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

    // By type
    const typeMap: Record<string, number> = {};
    txns.forEach((t: any) => {
      const type = t.transaction_type || 'OTHER';
      typeMap[type] = (typeMap[type] || 0) + (parseFloat(t.amount) || 0);
    });
    const byType = Object.entries(typeMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value: Math.round(value) }));

    // Daily revenue trend
    const dailyMap: Record<string, number> = {};
    txns.forEach((t: any) => {
      const day = t.created_at?.split('T')[0];
      if (day) dailyMap[day] = (dailyMap[day] || 0) + (parseFloat(t.amount) || 0);
    });
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date: date.slice(5), revenue: Math.round(revenue) }));

    setRevenueData({
      total: totalRevenue,
      transaction_count: txns.length,
      avg_per_transaction: txns.length > 0 ? Math.round(totalRevenue / txns.length) : 0,
      by_type: byType,
      daily_trend: dailyTrend,
    });
  }, [dateFrom, dateTo]);

  // ========== LOAD ON TAB CHANGE ==========

  useEffect(() => {
    loadReport();
  }, [activeTab, selectedDate, selectedMonth]);

  const loadReport = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'daily': await loadDailyReport(); break;
        case 'monthly': await loadMonthlyReport(); break;
        case 'mis': await loadMISOverview(); break;
        case 'doctor': await loadDoctorReport(); break;
        case 'department': await loadDepartmentReport(); break;
        case 'revenue': await loadRevenueReport(); break;
      }
    } catch (err) {
      console.warn('Could not load report:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== EXPORT ==========

  const exportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ========== COMPONENTS ==========

  const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string; subtitle?: string; trend?: number }> = ({ label, value, icon, color = 'blue', subtitle, trend }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color === 'blue' ? '#EBF5FF' : color === 'green' ? '#E8F5E9' : color === 'orange' ? '#FFF3E0' : color === 'purple' ? '#F3E5F5' : color === 'red' ? '#FFEBEE' : color === 'cyan' ? '#E0F7FA' : '#F5F5F5'}` }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
          {trend > 0 ? <ArrowUpRight size={12} /> : trend < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {Math.abs(trend)}% vs prev
        </div>
      )}
    </div>
  );

  const DateRangeFilter = () => (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-500" />
        <label className="text-sm font-medium text-gray-700">From:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">To:</label>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <button onClick={loadReport}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        Apply
      </button>
    </div>
  );

  // ========== RENDER ==========

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
        <div className="flex items-center gap-2">
          <button onClick={loadReport} disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto">
          {[
            { key: 'daily', label: 'Daily Report', icon: <Calendar size={14} /> },
            { key: 'monthly', label: 'Monthly Trends', icon: <TrendingUp size={14} /> },
            { key: 'mis', label: 'MIS Overview', icon: <Activity size={14} /> },
            { key: 'doctor', label: 'Doctor-wise', icon: <Stethoscope size={14} /> },
            { key: 'department', label: 'Department-wise', icon: <Users size={14} /> },
            { key: 'revenue', label: 'Revenue Analysis', icon: <IndianRupee size={14} /> },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* ==================== DAILY REPORT ==================== */}
          {activeTab === 'daily' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Calendar size={16} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>

              {dailyData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Patients" value={dailyData.total_patients} icon={<Users size={20} className="text-blue-600" />} />
                    <StatCard label="Consultations" value={dailyData.total_consultations} icon={<Stethoscope size={20} className="text-green-600" />} color="green" />
                    <StatCard label="Completed" value={dailyData.completed_consultations} icon={<Activity size={20} className="text-cyan-600" />} color="cyan" />
                    <StatCard label="Revenue" value={`Rs.${dailyData.total_revenue.toLocaleString()}`} icon={<IndianRupee size={20} className="text-purple-600" />} color="purple" />
                    <StatCard label="Avg/Patient" value={`Rs.${dailyData.avg_revenue_per_patient}`} icon={<TrendingUp size={20} className="text-orange-600" />} color="orange" />
                    <StatCard label="Avg Wait" value={`${dailyData.avg_wait_minutes} min`} icon={<Clock size={20} className="text-red-600" />} color="red" />
                  </div>

                  {/* Queue Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-600">{dailyData.queue_waiting}</div>
                      <div className="text-sm text-yellow-700">Waiting</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">{dailyData.queue_in_consultation}</div>
                      <div className="text-sm text-blue-700">In Consultation</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{dailyData.queue_completed}</div>
                      <div className="text-sm text-green-700">Completed</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Breakdown */}
                    {dailyData.by_department.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Department Breakdown</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={dailyData.by_department}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0056B3" radius={[4, 4, 0, 0]} name="Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Gender Distribution */}
                    {dailyData.by_gender.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Gender Distribution</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={dailyData.by_gender} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {dailyData.by_gender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Hourly Distribution */}
                    {dailyData.by_hour.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Hourly Patient Flow</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <AreaChart data={dailyData.by_hour}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#0056B3" fill="#0056B3" fillOpacity={0.2} name="Patients" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Age Group Distribution */}
                    {dailyData.by_age_group.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Age Group Distribution</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={dailyData.by_age_group}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="group" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4CAF50" radius={[4, 4, 0, 0]} name="Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== MONTHLY REPORT ==================== */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Calendar size={16} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                {monthlyData && (
                  <button onClick={() => exportCSV(monthlyData.daily_trend || [], `monthly-report-${selectedMonth}`)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1">
                    <Download size={14} /> Export CSV
                  </button>
                )}
              </div>

              {monthlyData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Patients" value={monthlyData.total_patients} icon={<Users size={20} className="text-blue-600" />} />
                    <StatCard label="Avg Daily" value={monthlyData.avg_daily} icon={<TrendingUp size={20} className="text-green-600" />} color="green" />
                    <StatCard label="Peak Day" value={monthlyData.peak_day} icon={<Calendar size={20} className="text-orange-600" />} color="orange" />
                    <StatCard label="Total Revenue" value={`Rs.${monthlyData.total_revenue.toLocaleString()}`} icon={<IndianRupee size={20} className="text-purple-600" />} color="purple" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Patient Trend */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Patient Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData.daily_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="patients" stroke="#0056B3" strokeWidth={2} name="Patients" />
                          <Line type="monotone" dataKey="consultations" stroke="#4CAF50" strokeWidth={2} name="Consultations" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Daily Revenue Trend */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Revenue Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData.daily_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                          <Area type="monotone" dataKey="revenue" stroke="#9C27B0" fill="#9C27B0" fillOpacity={0.2} name="Revenue" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Weekly Comparison */}
                    {monthlyData.weekly_comparison && monthlyData.weekly_comparison.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Week-over-Week Comparison</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={monthlyData.weekly_comparison}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="patients" fill="#0056B3" radius={[4, 4, 0, 0]} name="Patients" />
                            <Bar yAxisId="right" dataKey="revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} name="Revenue (Rs)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== MIS OVERVIEW ==================== */}
          {activeTab === 'mis' && (
            <div className="space-y-6">
              {misData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Patients" value={misData.total_patients} icon={<Users size={20} className="text-blue-600" />}
                      subtitle={`${misData.patients_today} today`} />
                    <StatCard label="This Month" value={misData.patients_this_month} icon={<Calendar size={20} className="text-green-600" />} color="green" />
                    <StatCard label="Consultations" value={misData.total_consultations} icon={<Stethoscope size={20} className="text-orange-600" />} color="orange"
                      subtitle={`${misData.consultations_today} today`} />
                    <StatCard label="Active Doctors" value={misData.active_doctors} icon={<Activity size={20} className="text-cyan-600" />} color="cyan" />
                    <StatCard label="Monthly Revenue" value={`Rs.${misData.monthly_revenue.toLocaleString()}`} icon={<IndianRupee size={20} className="text-purple-600" />} color="purple" />
                    <StatCard label="Yearly Revenue" value={`Rs.${misData.yearly_revenue.toLocaleString()}`} icon={<TrendingUp size={20} className="text-red-600" />} color="red" />
                  </div>

                  {/* Queue and Admissions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{misData.queue_today}</div>
                      <div className="text-sm text-blue-700">Queue Today</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{misData.queue_waiting}</div>
                      <div className="text-sm text-yellow-700">Waiting Now</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{misData.queue_completed}</div>
                      <div className="text-sm text-green-700">Completed Today</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{misData.current_admissions}</div>
                      <div className="text-sm text-purple-700">Currently Admitted</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Distribution */}
                    {misData.department_distribution?.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Department Distribution (This Month)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={misData.department_distribution} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={100}
                              label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}>
                              {misData.department_distribution.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Monthly Trend (6 months) */}
                    {misData.monthly_trend?.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Patient Trend (Last 6 Months)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={misData.monthly_trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="patients" fill="#0056B3" radius={[4, 4, 0, 0]} name="Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== DOCTOR-WISE ==================== */}
          {activeTab === 'doctor' && (
            <div className="space-y-6">
              <DateRangeFilter />

              {doctorData && doctorData.length > 0 ? (
                <>
                  {/* Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">Doctor Performance</h3>
                      <button onClick={() => exportCSV(doctorData, `doctor-report-${dateFrom}-${dateTo}`)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700">
                        <Download size={14} /> Export
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={doctorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="doctor_name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#0056B3" radius={[4, 4, 0, 0]} name="Total Consultations" />
                        <Bar dataKey="completed" fill="#4CAF50" radius={[4, 4, 0, 0]} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">Detailed Doctor Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Consultations</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unique Patients</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion %</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg/Day</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {doctorData.map((doc: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.doctor_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{doc.department}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-800">{doc.total}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-800">{doc.unique_patients}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  doc.completion_rate >= 80 ? 'bg-green-100 text-green-800' :
                                  doc.completion_rate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>{doc.completion_rate}%</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-800">{doc.avg_per_day}</td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">Rs.{(doc.revenue || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                  <Stethoscope size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600">No consultation data</p>
                  <p className="text-sm text-gray-500 mt-1">Select a date range and click Apply</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== DEPARTMENT-WISE ==================== */}
          {activeTab === 'department' && (
            <div className="space-y-6">
              <DateRangeFilter />

              {departmentData && departmentData.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Patients by Department</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="patients" fill="#0056B3" radius={[0, 4, 4, 0]} name="Patients" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue by Department</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={departmentData.filter((d: any) => d.revenue > 0)} dataKey="revenue" nameKey="department" cx="50%" cy="50%" outerRadius={100}
                            label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}>
                            {departmentData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Department Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800">Department Summary</h3>
                      <button onClick={() => exportCSV(departmentData, `department-report-${dateFrom}-${dateTo}`)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700">
                        <Download size={14} /> Export
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Male</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Female</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">VIP</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Emergency</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {departmentData.map((dept: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.department}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-800">{dept.patients}</td>
                              <td className="px-4 py-3 text-sm text-center text-blue-600">{dept.male}</td>
                              <td className="px-4 py-3 text-sm text-center text-pink-600">{dept.female}</td>
                              <td className="px-4 py-3 text-sm text-center text-orange-600">{dept.vip}</td>
                              <td className="px-4 py-3 text-sm text-center text-red-600">{dept.emergency}</td>
                              <td className="px-4 py-3 text-sm text-right font-medium">Rs.{Math.round(dept.revenue).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-3 text-sm">TOTAL</td>
                            <td className="px-4 py-3 text-sm text-center">{departmentData.reduce((s: number, d: any) => s + d.patients, 0)}</td>
                            <td className="px-4 py-3 text-sm text-center text-blue-600">{departmentData.reduce((s: number, d: any) => s + d.male, 0)}</td>
                            <td className="px-4 py-3 text-sm text-center text-pink-600">{departmentData.reduce((s: number, d: any) => s + d.female, 0)}</td>
                            <td className="px-4 py-3 text-sm text-center text-orange-600">{departmentData.reduce((s: number, d: any) => s + d.vip, 0)}</td>
                            <td className="px-4 py-3 text-sm text-center text-red-600">{departmentData.reduce((s: number, d: any) => s + d.emergency, 0)}</td>
                            <td className="px-4 py-3 text-sm text-right">Rs.{Math.round(departmentData.reduce((s: number, d: any) => s + d.revenue, 0)).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600">No department data</p>
                  <p className="text-sm text-gray-500 mt-1">Select a date range and click Apply</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== REVENUE ANALYSIS ==================== */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <DateRangeFilter />

              {revenueData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Total Revenue" value={`Rs.${revenueData.total.toLocaleString()}`} icon={<IndianRupee size={20} className="text-green-600" />} color="green" />
                    <StatCard label="Transactions" value={revenueData.transaction_count} icon={<FileText size={20} className="text-blue-600" />} />
                    <StatCard label="Avg/Transaction" value={`Rs.${revenueData.avg_per_transaction.toLocaleString()}`} icon={<TrendingUp size={20} className="text-purple-600" />} color="purple" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Type */}
                    {revenueData.by_type.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue by Transaction Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={revenueData.by_type} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {revenueData.by_type.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Daily Revenue Trend */}
                    {revenueData.daily_trend.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={revenueData.daily_trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                            <Area type="monotone" dataKey="revenue" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.2} name="Revenue" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Revenue Table */}
                  {revenueData.by_type.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-800">Revenue Breakdown</h3>
                        <button onClick={() => exportCSV(revenueData.by_type, `revenue-report-${dateFrom}-${dateTo}`)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700">
                          <Download size={14} /> Export
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {revenueData.by_type.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-3 text-sm text-right text-gray-800">Rs.{item.value.toLocaleString()}</td>
                                <td className="px-6 py-3 text-sm text-right text-gray-600">
                                  {revenueData.total > 0 ? ((item.value / revenueData.total) * 100).toFixed(1) : 0}%
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold">
                              <td className="px-6 py-3 text-sm">TOTAL</td>
                              <td className="px-6 py-3 text-sm text-right">Rs.{revenueData.total.toLocaleString()}</td>
                              <td className="px-6 py-3 text-sm text-right">100%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                  <IndianRupee size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600">No revenue data</p>
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
