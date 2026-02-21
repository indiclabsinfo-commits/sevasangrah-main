import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Search, User, FileText, Activity, Pill, Plus, ChevronDown, ChevronUp,
  Calendar, Clock, Stethoscope, Printer, Loader2, Heart, Thermometer, X
} from 'lucide-react';
import { opdService } from '@/services/opdService';
import { SupabaseHospitalService } from '@/services/supabaseHospitalService';
import { getSupabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

type RecordTab = 'consultations' | 'vitals' | 'prescriptions' | 'add-record';

const DigitalMedicalRecords: React.FC = () => {
  // Patient search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Data
  const [consultations, setConsultations] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RecordTab>('consultations');
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null);

  // Add record form
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState({
    doctor_id: '',
    chief_complaints: '',
    examination_findings: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_date: '',
    follow_up_notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Load doctors on mount
  useEffect(() => {
    SupabaseHospitalService.getDoctors().then(setDoctors).catch(() => {});
  }, []);

  // Debounced patient search
  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await SupabaseHospitalService.searchPatients(term);
      setSearchResults(results);
    } catch (err) {
      logger.error('Patient search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchPatients]);

  // Load patient data when selected
  const selectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setSearchResults([]);
    setActiveTab('consultations');
    setExpandedConsultation(null);
    await loadPatientData(patient.id);
  };

  const loadPatientData = async (patientId: string) => {
    setLoading(true);
    try {
      const [consultationData, vitalsData, prescriptionData] = await Promise.all([
        opdService.getPatientConsultations(patientId),
        fetchVitalsHistory(patientId),
        fetchPrescriptions(patientId),
      ]);
      setConsultations(consultationData);
      setVitals(vitalsData);
      setPrescriptions(prescriptionData);
    } catch (err) {
      logger.error('Failed to load patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalsHistory = async (patientId: string): Promise<any[]> => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  };

  const fetchPrescriptions = async (patientId: string): Promise<any[]> => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('patient_enhanced_prescription')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescription_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  };

  const handleAddRecord = async () => {
    if (!selectedPatient || !newRecord.doctor_id || !newRecord.chief_complaints) {
      alert('Please fill in doctor and chief complaints at minimum.');
      return;
    }
    setSaving(true);
    try {
      await opdService.createConsultation({
        patient_id: selectedPatient.id,
        doctor_id: newRecord.doctor_id,
        chief_complaints: newRecord.chief_complaints,
        examination_findings: newRecord.examination_findings || undefined,
        diagnosis: newRecord.diagnosis || 'Pending',
        treatment_plan: newRecord.treatment_plan || undefined,
        follow_up_date: newRecord.follow_up_date || undefined,
        follow_up_notes: newRecord.follow_up_notes || undefined,
      });

      // Mark as completed immediately (standalone record)
      // The createConsultation creates as IN_PROGRESS, so update
      const updatedConsultations = await opdService.getPatientConsultations(selectedPatient.id);
      if (updatedConsultations.length > 0 && updatedConsultations[0].status === 'IN_PROGRESS') {
        await opdService.completeConsultation(updatedConsultations[0].id);
      }

      alert('Record saved successfully!');
      setNewRecord({ doctor_id: '', chief_complaints: '', examination_findings: '', diagnosis: '', treatment_plan: '', follow_up_date: '', follow_up_notes: '' });
      setActiveTab('consultations');
      await loadPatientData(selectedPatient.id);
    } catch (err: any) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const parseMedications = (meds: any): any[] => {
    if (!meds) return [];
    if (typeof meds === 'string') {
      try { return JSON.parse(meds); } catch { return []; }
    }
    if (Array.isArray(meds)) return meds;
    return [];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setConsultations([]);
    setVitals([]);
    setPrescriptions([]);
    setExpandedConsultation(null);
  };

  return (
    <div className="container mx-auto p-4 space-y-4 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Medical Records</h1>
          <p className="text-gray-600">Search patients and manage their complete medical history</p>
        </div>
        {selectedPatient && (
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Records
          </Button>
        )}
      </div>

      {/* Patient Search */}
      <Card className="p-4 print:hidden">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10 text-lg"
              placeholder="Search patient by name, phone, or UHID..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {searchResults.map((p: any) => (
                <button
                  key={p.id}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 flex items-center justify-between"
                  onClick={() => selectPatient(p)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-gray-500">
                      {p.age ? `${p.age}y` : ''}{p.gender ? ` / ${p.gender}` : ''} | {p.phone || 'No phone'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{p.uhid || ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* No Patient Selected */}
      {!selectedPatient && (
        <Card className="p-16 text-center print:hidden">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <p className="text-xl font-medium text-gray-400">Search and select a patient</p>
          <p className="text-sm text-gray-300 mt-2">to view their medical records</p>
        </Card>
      )}

      {/* Patient Selected - Main Layout */}
      {selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Patient Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">Patient Info</h3>
                <button onClick={clearPatient} className="text-gray-400 hover:text-gray-600 print:hidden">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {(selectedPatient.first_name?.[0] || '').toUpperCase()}{(selectedPatient.last_name?.[0] || '').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedPatient.uhid || 'No UHID'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {selectedPatient.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age</span>
                    <span className="font-medium">{selectedPatient.age} years</span>
                  </div>
                )}
                {selectedPatient.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-medium">{selectedPatient.gender}</span>
                  </div>
                )}
                {selectedPatient.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium">{selectedPatient.phone}</span>
                  </div>
                )}
                {selectedPatient.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-xs">{selectedPatient.email}</span>
                  </div>
                )}
                {selectedPatient.blood_group && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Blood Group</span>
                    <span className="font-medium text-red-600">{selectedPatient.blood_group}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Visits</span>
                  <span className="font-bold">{consultations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prescriptions</span>
                  <span className="font-bold">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vitals Recorded</span>
                  <span className="font-bold">{vitals.length}</span>
                </div>
                {consultations.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Visit</span>
                    <span className="font-medium text-xs">{formatDate(consultations[0]?.consultation_date)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Latest Vitals Card */}
            {vitals.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1">
                  <Activity size={14} /> Latest Vitals
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {vitals[0].blood_pressure && (
                    <div className="bg-red-50 p-2 rounded">
                      <p className="text-gray-500">BP</p>
                      <p className="font-bold text-red-700">{vitals[0].blood_pressure}</p>
                    </div>
                  )}
                  {vitals[0].pulse && (
                    <div className="bg-pink-50 p-2 rounded">
                      <p className="text-gray-500">Pulse</p>
                      <p className="font-bold text-pink-700">{vitals[0].pulse} bpm</p>
                    </div>
                  )}
                  {vitals[0].temperature && (
                    <div className="bg-orange-50 p-2 rounded">
                      <p className="text-gray-500">Temp</p>
                      <p className="font-bold text-orange-700">{vitals[0].temperature}°F</p>
                    </div>
                  )}
                  {vitals[0].spo2 && (
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-gray-500">SpO2</p>
                      <p className="font-bold text-blue-700">{vitals[0].spo2}%</p>
                    </div>
                  )}
                  {vitals[0].weight && (
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-gray-500">Weight</p>
                      <p className="font-bold text-green-700">{vitals[0].weight} kg</p>
                    </div>
                  )}
                  {vitals[0].height && (
                    <div className="bg-purple-50 p-2 rounded">
                      <p className="text-gray-500">Height</p>
                      <p className="font-bold text-purple-700">{vitals[0].height} cm</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">{formatDate(vitals[0].created_at)}</p>
              </Card>
            )}
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex border-b mb-4 print:hidden">
              {([
                { id: 'consultations' as RecordTab, label: 'Consultations', icon: <Stethoscope size={15} />, count: consultations.length },
                { id: 'vitals' as RecordTab, label: 'Vitals', icon: <Activity size={15} />, count: vitals.length },
                { id: 'prescriptions' as RecordTab, label: 'Prescriptions', icon: <Pill size={15} />, count: prescriptions.length },
                { id: 'add-record' as RecordTab, label: 'Add Record', icon: <Plus size={15} /> },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Loading records...</span>
              </div>
            ) : (
              <>
                {/* ===== CONSULTATIONS TAB ===== */}
                {activeTab === 'consultations' && (
                  <div className="space-y-3">
                    {consultations.length === 0 ? (
                      <Card className="p-12 text-center">
                        <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-400 font-medium">No consultation records</p>
                        <p className="text-sm text-gray-300 mt-1">Add a record from the "Add Record" tab</p>
                      </Card>
                    ) : (
                      consultations.map((c: any) => {
                        const isExpanded = expandedConsultation === c.id;
                        const doctorName = c.doctor ? `Dr. ${c.doctor.first_name || ''} ${c.doctor.last_name || ''}`.trim() : 'Unknown';

                        return (
                          <Card key={c.id} className="overflow-hidden">
                            <button
                              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                              onClick={() => setExpandedConsultation(isExpanded ? null : c.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${c.status === 'COMPLETED' ? 'bg-green-500' : c.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{formatDate(c.consultation_date)}</span>
                                      <Badge className={c.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                        {c.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{doctorName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right hidden md:block">
                                    <p className="text-sm text-gray-700 truncate max-w-xs">{c.chief_complaints || '-'}</p>
                                    <p className="text-xs text-gray-400 truncate max-w-xs">{c.diagnosis || '-'}</p>
                                  </div>
                                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </div>
                              </div>
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="border-t bg-gray-50 p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {c.chief_complaints && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Chief Complaints</h4>
                                      <p className="text-sm bg-white p-3 rounded border">{c.chief_complaints}</p>
                                    </div>
                                  )}
                                  {c.examination_findings && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Examination Findings</h4>
                                      <p className="text-sm bg-white p-3 rounded border">{c.examination_findings}</p>
                                    </div>
                                  )}
                                  {c.diagnosis && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Diagnosis</h4>
                                      <p className="text-sm bg-white p-3 rounded border">{c.diagnosis}</p>
                                      {c.diagnosis_codes?.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                          {c.diagnosis_codes.map((code: string, i: number) => (
                                            <span key={i} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{code}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {c.treatment_plan && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Treatment Plan</h4>
                                      <p className="text-sm bg-white p-3 rounded border">{c.treatment_plan}</p>
                                    </div>
                                  )}
                                </div>
                                {(c.follow_up_date || c.follow_up_notes) && (
                                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <h4 className="text-xs font-semibold text-yellow-700 uppercase mb-1">Follow-up</h4>
                                    {c.follow_up_date && <p className="text-sm"><Calendar size={12} className="inline mr-1" />{formatDate(c.follow_up_date)}</p>}
                                    {c.follow_up_notes && <p className="text-sm text-gray-600 mt-1">{c.follow_up_notes}</p>}
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ===== VITALS TAB ===== */}
                {activeTab === 'vitals' && (
                  <div>
                    {vitals.length === 0 ? (
                      <Card className="p-12 text-center">
                        <Heart className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-400 font-medium">No vitals recorded</p>
                      </Card>
                    ) : (
                      <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BP</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pulse</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SpO2</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Height</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {vitals.map((v: any, i: number) => (
                                <tr key={v.id || i} className={i === 0 ? 'bg-blue-50' : ''}>
                                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                                    {formatDate(v.created_at)}
                                    {i === 0 && <Badge className="ml-2 bg-blue-100 text-blue-700">Latest</Badge>}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium">{v.blood_pressure || '-'}</td>
                                  <td className="px-4 py-3 text-sm">{v.pulse ? `${v.pulse} bpm` : '-'}</td>
                                  <td className="px-4 py-3 text-sm">{v.temperature ? `${v.temperature}°F` : '-'}</td>
                                  <td className="px-4 py-3 text-sm">{v.spo2 ? `${v.spo2}%` : '-'}</td>
                                  <td className="px-4 py-3 text-sm">{v.weight ? `${v.weight} kg` : '-'}</td>
                                  <td className="px-4 py-3 text-sm">{v.height ? `${v.height} cm` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* ===== PRESCRIPTIONS TAB ===== */}
                {activeTab === 'prescriptions' && (
                  <div className="space-y-3">
                    {prescriptions.length === 0 ? (
                      <Card className="p-12 text-center">
                        <Pill className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-400 font-medium">No prescriptions found</p>
                      </Card>
                    ) : (
                      prescriptions.map((rx: any, idx: number) => {
                        const meds = parseMedications(rx.medications);
                        return (
                          <Card key={rx.id || idx} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Pill size={16} className="text-purple-600" />
                                <span className="font-medium text-sm">{formatDate(rx.prescription_date || rx.created_at)}</span>
                              </div>
                              {rx.notes && <span className="text-xs text-gray-400">{rx.notes}</span>}
                            </div>
                            {meds.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Medicine</th>
                                      <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Dosage</th>
                                      <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Frequency</th>
                                      <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Duration</th>
                                      <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Instructions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {meds.map((med: any, mi: number) => (
                                      <tr key={mi} className="border-b last:border-b-0">
                                        <td className="py-1.5 font-medium">{med.drug_name || med.name || med.medicine || '-'}</td>
                                        <td className="py-1.5">{med.dosage || med.dose || '-'}</td>
                                        <td className="py-1.5">{med.frequency || '-'}</td>
                                        <td className="py-1.5">{med.duration || '-'}</td>
                                        <td className="py-1.5 text-gray-500">{med.instructions || med.notes || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No medication details</p>
                            )}
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ===== ADD RECORD TAB ===== */}
                {activeTab === 'add-record' && (
                  <Card className="p-6 print:hidden">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Plus size={18} /> Add New Medical Record
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                        <select
                          className="w-full p-2 border rounded-lg"
                          value={newRecord.doctor_id}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, doctor_id: e.target.value }))}
                        >
                          <option value="">-- Select Doctor --</option>
                          {doctors.map((doc: any) => (
                            <option key={doc.id} value={doc.id}>
                              Dr. {doc.first_name || doc.name || ''} {doc.last_name || ''} {doc.department ? `- ${doc.department}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                        <Input
                          type="date"
                          value={newRecord.follow_up_date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRecord(prev => ({ ...prev, follow_up_date: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaints *</label>
                        <textarea
                          className="w-full p-2 border rounded-lg h-20"
                          placeholder="Enter chief complaints..."
                          value={newRecord.chief_complaints}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, chief_complaints: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Examination Findings</label>
                        <textarea
                          className="w-full p-2 border rounded-lg h-20"
                          placeholder="Enter examination findings..."
                          value={newRecord.examination_findings}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, examination_findings: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                        <textarea
                          className="w-full p-2 border rounded-lg h-20"
                          placeholder="Enter diagnosis..."
                          value={newRecord.diagnosis}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosis: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                        <textarea
                          className="w-full p-2 border rounded-lg h-20"
                          placeholder="Enter treatment plan..."
                          value={newRecord.treatment_plan}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, treatment_plan: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Notes</label>
                        <textarea
                          className="w-full p-2 border rounded-lg h-20"
                          placeholder="Enter follow-up notes..."
                          value={newRecord.follow_up_notes}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, follow_up_notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleAddRecord} disabled={saving || !newRecord.doctor_id || !newRecord.chief_complaints}>
                        {saving ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                          <><FileText className="h-4 w-4 mr-2" /> Save Record</>
                        )}
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalMedicalRecords;
