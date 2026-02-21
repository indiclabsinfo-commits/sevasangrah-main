import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Video, Phone, Calendar, Clock, User, Users, Copy, ExternalLink, Search, Plus, Send, Loader2 } from 'lucide-react';
import { appointmentService } from '@/services/appointmentService';
import { SupabaseHospitalService } from '@/services/supabaseHospitalService';
import { logger } from '@/utils/logger';

type ConsultationMode = 'physical' | 'google_meet' | 'zoom' | 'whatsapp';
type ActiveTab = 'upcoming' | 'schedule' | 'history';

interface TeleconsultAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time?: string;
  appointment_type?: string;
  consultation_mode?: string;
  join_url?: string;
  reason?: string;
  status: string;
  notes?: string;
  created_at: string;
  patient?: { id: string; first_name: string; last_name: string; phone?: string; email?: string; gender?: string; age?: number };
  doctor?: { id: string; first_name: string; last_name: string; email?: string };
}

const PROVIDER_OPTIONS: { value: ConsultationMode; label: string; icon: React.ReactNode }[] = [
  { value: 'google_meet', label: 'Google Meet', icon: <Video className="h-4 w-4" /> },
  { value: 'zoom', label: 'Zoom', icon: <Video className="h-4 w-4" /> },
  { value: 'whatsapp', label: 'WhatsApp Video', icon: <Phone className="h-4 w-4" /> },
  { value: 'physical', label: 'Physical Visit', icon: <User className="h-4 w-4" /> },
];

const TeleconsultAppointmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');

  // Data states
  const [upcomingAppointments, setUpcomingAppointments] = useState<TeleconsultAppointment[]>([]);
  const [historyAppointments, setHistoryAppointments] = useState<TeleconsultAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ todayTotal: 0, teleconsultsToday: 0, scheduled: 0, completed: 0 });

  // Schedule form states
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('google_meet');
  const [joinUrl, setJoinUrl] = useState('');
  const [reason, setReason] = useState('');
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingToQueue, setSendingToQueue] = useState<string | null>(null);

  // Load data on mount and tab change
  useEffect(() => {
    loadDoctors();
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'upcoming') loadUpcoming();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadDoctors = async () => {
    try {
      const docs = await SupabaseHospitalService.getDoctors();
      setDoctors(docs);
    } catch (err) {
      logger.error('Failed to load doctors:', err);
    }
  };

  const loadStats = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: todayAppts } = await appointmentService.getAppointments({
        filters: { dateRange: { start: todayStr, end: todayStr } },
        limit: 200,
      });
      const teleconsultsToday = todayAppts.filter((a: any) => a.consultation_mode && a.consultation_mode !== 'physical').length;
      const scheduledCount = todayAppts.filter((a: any) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
      const completedCount = todayAppts.filter((a: any) => a.status === 'COMPLETED').length;
      setStats({ todayTotal: todayAppts.length, teleconsultsToday, scheduled: scheduledCount, completed: completedCount });
    } catch (err) {
      logger.error('Failed to load stats:', err);
    }
  };

  const loadUpcoming = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await appointmentService.getAppointments({
        filters: { dateRange: { start: todayStr, end: '2099-12-31' } },
        sortOrder: 'asc',
        limit: 50,
      });
      // Show teleconsult appointments (non-physical) that are upcoming
      const teleconsult = data.filter((a: any) =>
        a.consultation_mode && a.consultation_mode !== 'physical' &&
        ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status)
      );
      setUpcomingAppointments(teleconsult);
    } catch (err) {
      logger.error('Failed to load upcoming:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentService.getAppointments({
        filters: { status: 'COMPLETED' },
        sortOrder: 'desc',
        limit: 50,
      });
      const teleconsult = data.filter((a: any) => a.consultation_mode && a.consultation_mode !== 'physical');
      setHistoryAppointments(teleconsult);
    } catch (err) {
      logger.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced patient search
  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setPatientResults([]);
      return;
    }
    setSearchingPatients(true);
    try {
      const results = await SupabaseHospitalService.searchPatients(term);
      setPatientResults(results);
    } catch (err) {
      logger.error('Patient search failed:', err);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  // Auto-generate WhatsApp link
  useEffect(() => {
    if (consultationMode === 'whatsapp' && selectedPatient?.phone) {
      const phone = selectedPatient.phone.replace(/[^0-9]/g, '');
      setJoinUrl(`https://wa.me/${phone}`);
    } else if (consultationMode === 'physical') {
      setJoinUrl('');
    } else if (consultationMode !== 'whatsapp') {
      // Don't clear if user manually typed for meet/zoom
    }
  }, [consultationMode, selectedPatient]);

  const handleSchedule = async () => {
    if (!selectedPatient || !selectedDoctorId || !appointmentDate) {
      alert('Please select a patient, doctor, and date.');
      return;
    }
    if (consultationMode !== 'physical' && !joinUrl) {
      alert('Please enter the meeting link.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.createAppointment({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime || undefined,
        appointment_type: consultationMode === 'physical' ? 'CONSULTATION' : 'TELECONSULT',
        consultation_mode: consultationMode,
        join_url: consultationMode !== 'physical' ? joinUrl : undefined,
        reason: reason || undefined,
        status: 'SCHEDULED',
      });

      alert('Appointment scheduled successfully!');
      // Reset form
      setSelectedPatient(null);
      setPatientSearch('');
      setPatientResults([]);
      setSelectedDoctorId('');
      setAppointmentDate('');
      setAppointmentTime('');
      setConsultationMode('google_meet');
      setJoinUrl('');
      setReason('');
      loadStats();
    } catch (err: any) {
      alert('Failed to schedule: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToQueue = async (appointment: TeleconsultAppointment) => {
    setSendingToQueue(appointment.id);
    try {
      await SupabaseHospitalService.addToOPDQueue({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        consultation_mode: appointment.consultation_mode || 'physical',
        join_url: appointment.join_url || undefined,
        notes: appointment.reason || undefined,
      });
      alert('Patient sent to doctor queue!');
    } catch (err: any) {
      alert('Failed to add to queue: ' + (err.message || 'Unknown error'));
    } finally {
      setSendingToQueue(null);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleJoinCall = (url: string) => {
    window.open(url, '_blank');
  };

  const getProviderLabel = (mode?: string) => {
    switch (mode) {
      case 'google_meet': return 'Google Meet';
      case 'zoom': return 'Zoom';
      case 'whatsapp': return 'WhatsApp';
      default: return 'Physical';
    }
  };

  const getProviderBadgeClass = (mode?: string) => {
    switch (mode) {
      case 'google_meet': return 'bg-blue-100 text-blue-800';
      case 'zoom': return 'bg-indigo-100 text-indigo-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const formatPatientName = (patient?: any) => {
    if (!patient) return 'Unknown';
    return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';
  };

  const formatDoctorName = (doctor?: any) => {
    if (!doctor) return 'Unknown';
    return `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teleconsult Appointments</h1>
        <p className="text-gray-600">Schedule and manage virtual consultations via Google Meet, Zoom, or WhatsApp</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Total</p>
              <p className="text-2xl font-bold">{stats.todayTotal}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Teleconsults Today</p>
              <p className="text-2xl font-bold">{stats.teleconsultsToday}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Video className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'upcoming' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('upcoming')}
        >
          <Clock className="mr-2 h-4 w-4" /> Upcoming
        </Button>
        <Button
          variant={activeTab === 'schedule' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('schedule')}
        >
          <Plus className="mr-2 h-4 w-4" /> Schedule
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('history')}
        >
          <Calendar className="mr-2 h-4 w-4" /> History
        </Button>
      </div>

      {/* ===== UPCOMING TAB ===== */}
      {activeTab === 'upcoming' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Upcoming Teleconsult Appointments</h2>
            <Button variant="primary" onClick={() => setActiveTab('schedule')}>
              <Plus className="h-4 w-4 mr-2" /> New Teleconsult
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">Loading appointments...</span>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No upcoming teleconsult appointments</p>
              <p className="text-sm mt-1">Schedule one from the Schedule tab</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appt) => (
                <Card key={appt.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{formatPatientName(appt.patient)}</h3>
                        {getStatusBadge(appt.status)}
                        <Badge className={getProviderBadgeClass(appt.consultation_mode)}>
                          {getProviderLabel(appt.consultation_mode)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{formatDoctorName(appt.doctor)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{appt.appointment_date}</span>
                        </div>
                        {appt.appointment_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{appt.appointment_time}</span>
                          </div>
                        )}
                        {appt.reason && (
                          <div className="text-gray-500 truncate">
                            {appt.reason}
                          </div>
                        )}
                      </div>

                      {/* Join Call Section */}
                      {appt.join_url && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                {getProviderLabel(appt.consultation_mode)} Ready
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleCopyLink(appt.join_url!)}>
                                <Copy className="h-3 w-3 mr-1" /> Copy Link
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleSendToQueue(appt)}
                                disabled={sendingToQueue === appt.id}>
                                {sendingToQueue === appt.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 mr-1" />
                                )}
                                Send to Queue
                              </Button>
                              <Button size="sm" onClick={() => handleJoinCall(appt.join_url!)}>
                                <ExternalLink className="h-3 w-3 mr-1" /> Join Call
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {activeTab === 'schedule' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Schedule Teleconsult Appointment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Patient Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Patient</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedPatient.phone || 'No phone'} | {selectedPatient.gender || ''} | Age: {selectedPatient.age || 'N/A'}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch('');
                      setPatientResults([]);
                    }}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        placeholder="Search by name, phone, or UHID..."
                        value={patientSearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientSearch(e.target.value)}
                      />
                      {searchingPatients && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    {patientResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {patientResults.map((p: any) => (
                          <button
                            key={p.id}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0"
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientSearch('');
                              setPatientResults([]);
                            }}
                          >
                            <p className="font-medium">{p.first_name} {p.last_name}</p>
                            <p className="text-xs text-gray-500">{p.phone || 'No phone'} | {p.uhid || ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Doctor Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.first_name || doc.name || ''} {doc.last_name || ''} {doc.department ? `- ${doc.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={appointmentDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppointmentDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                <textarea
                  className="w-full p-2 border rounded-lg h-20"
                  placeholder="Enter reason or symptoms..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setConsultationMode(opt.value);
                        if (opt.value === 'physical') setJoinUrl('');
                        if (opt.value !== 'whatsapp' && opt.value !== 'physical') setJoinUrl('');
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        consultationMode === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Link Input */}
              {consultationMode !== 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {consultationMode === 'whatsapp' ? 'WhatsApp Link (auto-generated)' : 'Meeting Link'}
                  </label>
                  {consultationMode === 'whatsapp' ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-mono text-green-800">{joinUrl || 'Select a patient with phone number'}</p>
                      {!selectedPatient?.phone && (
                        <p className="text-xs text-orange-600 mt-1">Patient has no phone number for WhatsApp</p>
                      )}
                    </div>
                  ) : (
                    <Input
                      placeholder={consultationMode === 'google_meet' ? 'Paste Google Meet link...' : 'Paste Zoom link...'}
                      value={joinUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinUrl(e.target.value)}
                    />
                  )}
                  {consultationMode === 'google_meet' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Create a meeting at meet.google.com and paste the link here
                    </p>
                  )}
                  {consultationMode === 'zoom' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Create a meeting in Zoom and paste the invite link here
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              {selectedPatient && selectedDoctorId && appointmentDate && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold mb-2">Appointment Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Patient:</span> {selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p><span className="text-gray-500">Doctor:</span> {doctors.find((d: any) => d.id === selectedDoctorId)?.first_name || ''} {doctors.find((d: any) => d.id === selectedDoctorId)?.last_name || ''}</p>
                    <p><span className="text-gray-500">Date:</span> {appointmentDate} {appointmentTime && `at ${appointmentTime}`}</p>
                    <p><span className="text-gray-500">Mode:</span> {getProviderLabel(consultationMode)}</p>
                    {joinUrl && <p><span className="text-gray-500">Link:</span> <span className="font-mono text-xs break-all">{joinUrl}</span></p>}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleSchedule}
                disabled={submitting || !selectedPatient || !selectedDoctorId || !appointmentDate}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling...</>
                ) : (
                  <><Calendar className="h-4 w-4 mr-2" /> Schedule Appointment</>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Teleconsult History</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">Loading history...</span>
            </div>
          ) : historyAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No teleconsult history</p>
              <p className="text-sm mt-1">Completed teleconsult appointments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{formatPatientName(appt.patient)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDoctorName(appt.doctor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{appt.appointment_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{appt.appointment_time || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getProviderBadgeClass(appt.consultation_mode)}>
                          {getProviderLabel(appt.consultation_mode)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appt.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default TeleconsultAppointmentPage;
