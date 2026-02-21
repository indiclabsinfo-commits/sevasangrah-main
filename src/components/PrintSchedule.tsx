import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Printer, Download, Calendar, User, Clock, Building, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import { appointmentService } from '@/services/appointmentService';
import { SupabaseHospitalService } from '@/services/supabaseHospitalService';
import { logger } from '@/utils/logger';

interface ScheduleGroup {
  doctorName: string;
  department: string;
  date: string;
  slots: {
    time: string;
    patient: string;
    type: string;
    status: string;
    notes: string;
    mode: string;
  }[];
}

const PrintSchedule: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: todayStr, end: weekLater });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [printFormat, setPrintFormat] = useState<'portrait' | 'landscape'>('portrait');

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalAppointments, setTotalAppointments] = useState(0);

  // Load doctors on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const docs = await SupabaseHospitalService.getDoctors();
        setDoctors(docs);
        const depts = [...new Set(docs.map((d: any) => d.department).filter(Boolean))] as string[];
        setDepartments(depts);
      } catch (err) {
        logger.error('Failed to load doctors:', err);
      }
    };
    loadDoctors();
  }, []);

  // Load appointments when filters change
  useEffect(() => {
    loadSchedule();
  }, [dateRange.start, dateRange.end, doctorFilter, departmentFilter]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const filters: any = {
        dateRange: { start: dateRange.start, end: dateRange.end },
      };
      if (doctorFilter !== 'all') {
        filters.doctorId = doctorFilter;
      }

      const { data } = await appointmentService.getAppointments({
        filters,
        sortOrder: 'asc',
        limit: 500,
      });

      // Filter by department if needed
      let filtered = data;
      if (departmentFilter !== 'all') {
        filtered = data.filter((a: any) => {
          const doc = doctors.find((d: any) => d.id === a.doctor_id);
          return doc?.department === departmentFilter;
        });
      }

      setTotalAppointments(filtered.length);

      // Group by doctor + date
      const groupMap = new Map<string, ScheduleGroup>();

      filtered.forEach((appt: any) => {
        const doctorName = appt.doctor
          ? `Dr. ${appt.doctor.first_name || ''} ${appt.doctor.last_name || ''}`.trim()
          : 'Unknown Doctor';
        const doc = doctors.find((d: any) => d.id === appt.doctor_id);
        const department = doc?.department || '';
        const date = appt.appointment_date || '';
        const key = `${appt.doctor_id}_${date}`;

        if (!groupMap.has(key)) {
          groupMap.set(key, { doctorName, department, date, slots: [] });
        }

        const patientName = appt.patient
          ? `${appt.patient.first_name || ''} ${appt.patient.last_name || ''}`.trim()
          : 'Unknown';

        groupMap.get(key)!.slots.push({
          time: appt.appointment_time || '-',
          patient: patientName,
          type: appt.appointment_type || 'Consultation',
          status: appt.status || 'SCHEDULED',
          notes: appt.notes || appt.reason || '-',
          mode: appt.consultation_mode || 'physical',
        });
      });

      // Sort slots by time within each group
      const groups = Array.from(groupMap.values());
      groups.forEach(g => g.slots.sort((a, b) => a.time.localeCompare(b.time)));
      // Sort groups by date then doctor
      groups.sort((a, b) => a.date.localeCompare(b.date) || a.doctorName.localeCompare(b.doctorName));

      setScheduleGroups(groups);
    } catch (err) {
      logger.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    // @ts-ignore
    content: () => printRef.current,
    documentTitle: `Doctor_Schedule_${dateRange.start}_to_${dateRange.end}`,
    pageStyle: printFormat === 'landscape'
      ? '@page { size: landscape; margin: 0.5in; }'
      : '@page { size: portrait; margin: 0.5in; }',
  });

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF(printFormat === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.text('Practitioner Schedule', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10);
      doc.text(
        `Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2, y, { align: 'center' }
      );
      y += 12;

      scheduleGroups.forEach((group) => {
        // Check if we need a new page
        if (y > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          y = 20;
        }

        // Doctor header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${group.doctorName} - ${group.department}`, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Date: ${group.date}  |  ${group.slots.length} appointments`, pageWidth - 14, y, { align: 'right' });
        y += 6;

        // Table header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const colX = printFormat === 'landscape' ? [14, 50, 120, 180, 220] : [14, 42, 95, 140, 170];
        doc.text('Time', colX[0], y);
        doc.text('Patient', colX[1], y);
        doc.text('Type', colX[2], y);
        doc.text('Status', colX[3], y);
        doc.text('Notes', colX[4], y);
        y += 1;
        doc.line(14, y, pageWidth - 14, y);
        y += 4;

        // Rows
        doc.setFont('helvetica', 'normal');
        group.slots.forEach((slot) => {
          if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(slot.time, colX[0], y);
          doc.text(slot.patient.substring(0, 30), colX[1], y);
          doc.text(slot.type.substring(0, 15), colX[2], y);
          doc.text(slot.status, colX[3], y);
          doc.text((slot.notes || '-').substring(0, 20), colX[4], y);
          y += 5;
        });

        y += 8;
      });

      if (scheduleGroups.length === 0) {
        doc.setFontSize(12);
        doc.text('No appointments found for the selected period.', pageWidth / 2, y, { align: 'center' });
      }

      doc.save(`Schedule_${dateRange.start}_to_${dateRange.end}.pdf`);
    } catch (err) {
      logger.error('PDF export failed:', err);
      alert('Failed to export PDF');
    }
  };

  const handleExportCSV = () => {
    try {
      const rows: string[][] = [['Doctor', 'Department', 'Date', 'Time', 'Patient', 'Type', 'Status', 'Mode', 'Notes']];

      scheduleGroups.forEach((group) => {
        group.slots.forEach((slot) => {
          rows.push([
            group.doctorName,
            group.department,
            group.date,
            slot.time,
            slot.patient,
            slot.type,
            slot.status,
            slot.mode,
            slot.notes,
          ]);
        });
      });

      const csvContent = rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Schedule_${dateRange.start}_to_${dateRange.end}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('CSV export failed:', err);
      alert('Failed to export CSV');
    }
  };

  const confirmedCount = scheduleGroups.reduce((sum, g) => sum + g.slots.filter(s => s.status === 'CONFIRMED').length, 0);
  const scheduledCount = scheduleGroups.reduce((sum, g) => sum + g.slots.filter(s => s.status === 'SCHEDULED').length, 0);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Print Practitioner Schedule</h1>
        <p className="text-gray-600">Generate and print doctor schedules in multiple formats</p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="all">All Doctors</option>
              {doctors.map((doc: any) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.first_name || doc.name || ''} {doc.last_name || ''} {doc.department ? `- ${doc.department}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Print Format</label>
            <div className="flex gap-2">
              <Button
                variant={printFormat === 'portrait' ? 'primary' : 'outline'}
                onClick={() => setPrintFormat('portrait')}
                className="flex-1"
              >
                Portrait
              </Button>
              <Button
                variant={printFormat === 'landscape' ? 'primary' : 'outline'}
                onClick={() => setPrintFormat('landscape')}
                className="flex-1"
              >
                Landscape
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handlePrint} disabled={loading || scheduleGroups.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print Schedule
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={loading || scheduleGroups.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={loading || scheduleGroups.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Loading schedule...</span>
        </div>
      )}

      {/* No Data State */}
      {!loading && scheduleGroups.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No appointments found</p>
          <p className="text-sm text-gray-400 mt-1">Adjust the date range or filters to find appointments</p>
        </Card>
      )}

      {/* Printable Content */}
      {!loading && scheduleGroups.length > 0 && (
        <div ref={printRef} className={`bg-white ${printFormat === 'landscape' ? 'landscape' : ''}`}>
          <Card className="p-8 print:p-0 print:shadow-none print:border-0">
            {/* Header for print */}
            <div className="text-center mb-8 print:mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center print:w-12 print:h-12">
                  <Building className="h-8 w-8 text-blue-600 print:h-6 print:w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-900 print:text-2xl">Practitioner Schedule</h1>
                  <p className="text-xl text-blue-700 print:text-lg">Appointment Overview</p>
                </div>
              </div>
              <div className="text-gray-600">
                <p className="text-lg print:text-base">
                  Period: {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
                </p>
                <p className="text-sm print:text-xs">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              </div>

              {/* Summary Stats */}
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <span>Total: <strong>{totalAppointments}</strong></span>
                <span className="text-green-600">Confirmed: <strong>{confirmedCount}</strong></span>
                <span className="text-blue-600">Scheduled: <strong>{scheduledCount}</strong></span>
              </div>
            </div>

            {/* Schedule Content */}
            <div className="space-y-8">
              {scheduleGroups.map((group, index) => (
                <div key={index} className="break-inside-avoid">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 print:bg-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-blue-900 print:text-lg">{group.doctorName}</h2>
                        <p className="text-blue-700 print:text-sm">{group.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold print:text-base">{group.date}</p>
                        <p className="text-sm text-gray-600 print:text-xs">{group.slots.length} appointments</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 print:text-sm">
                      <thead>
                        <tr className="bg-gray-50 print:bg-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">Patient</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.slots.map((slot, slotIndex) => (
                          <tr key={slotIndex} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap print:px-2 print:py-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400 print:h-3 print:w-3" />
                                <span className="font-medium">{slot.time}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap print:px-2 print:py-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400 print:h-3 print:w-3" />
                                <span>{slot.patient}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap print:px-2 print:py-2">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {slot.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap print:px-2 print:py-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                slot.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                slot.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                slot.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {slot.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 print:px-2 print:py-2">
                              <span className="text-gray-500 text-sm">{slot.notes}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary for this group */}
                  <div className="mt-4 p-4 border-t border-gray-200 print:text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600">Total:</p>
                        <p className="font-semibold">{group.slots.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Confirmed:</p>
                        <p className="font-semibold text-green-600">
                          {group.slots.filter(s => s.status === 'CONFIRMED').length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Scheduled:</p>
                        <p className="font-semibold text-blue-600">
                          {group.slots.filter(s => s.status === 'SCHEDULED').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer for print */}
            <div className="mt-8 pt-6 border-t border-gray-300 text-center text-gray-500 print:text-xs">
              <p>This is an official schedule document. Please verify with reception for last-minute changes.</p>
              <p className="mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PrintSchedule;
