import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Printer, Download, Calendar, Filter, User, Clock, Building } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PrintSchedule: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState({ start: '2026-02-17', end: '2026-02-23' });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [printFormat, setPrintFormat] = useState<'portrait' | 'landscape'>('portrait');

  // Mock data
  const mockDoctors = [
    { id: '1', name: 'Dr. Sharma', department: 'Cardiology', specialization: 'Cardiologist' },
    { id: '2', name: 'Dr. Patel', department: 'Neurology', specialization: 'Neurologist' },
    { id: '3', name: 'Dr. Gupta', department: 'General Medicine', specialization: 'Physician' },
    { id: '4', name: 'Dr. Kumar', department: 'Orthopedics', specialization: 'Orthopedic Surgeon' },
    { id: '5', name: 'Dr. Joshi', department: 'Pediatrics', specialization: 'Pediatrician' }
  ];

  const mockSchedule = [
    {
      doctor: 'Dr. Sharma',
      department: 'Cardiology',
      date: '2026-02-17',
      slots: [
        { time: '09:00-10:00', patient: 'Rajesh Kumar', type: 'Follow-up', status: 'confirmed' },
        { time: '10:00-11:00', patient: 'Priya Sharma', type: 'New', status: 'confirmed' },
        { time: '11:00-12:00', patient: 'Amit Patel', type: 'Consultation', status: 'pending' },
        { time: '14:00-15:00', patient: 'Suresh Reddy', type: 'Procedure', status: 'confirmed' },
        { time: '15:00-16:00', patient: 'Meena Singh', type: 'Follow-up', status: 'confirmed' }
      ]
    },
    {
      doctor: 'Dr. Patel',
      department: 'Neurology',
      date: '2026-02-17',
      slots: [
        { time: '09:30-10:30', patient: 'Ravi Verma', type: 'New', status: 'confirmed' },
        { time: '10:30-11:30', patient: 'Anjali Desai', type: 'Consultation', status: 'confirmed' },
        { time: '11:30-12:30', patient: 'Kiran Rao', type: 'Follow-up', status: 'pending' },
        { time: '14:30-15:30', patient: 'Vikram Singh', type: 'Procedure', status: 'confirmed' }
      ]
    }
  ];

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Doctor_Schedule_${dateRange.start}_to_${dateRange.end}`,
    pageStyle: printFormat === 'landscape' 
      ? '@page { size: landscape; margin: 0.5in; }' 
      : '@page { size: portrait; margin: 0.5in; }'
  });

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented with a PDF library');
    // In real implementation: Use jsPDF or similar library
  };

  const handleExportExcel = () => {
    alert('Excel export functionality would be implemented');
    // In real implementation: Generate CSV/Excel file
  };

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
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select 
              className="w-full p-2 border rounded"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
            <select 
              className="w-full p-2 border rounded"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="all">All Doctors</option>
              {mockDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Print Format</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={printFormat === 'portrait' ? 'default' : 'outline'}
                onClick={() => setPrintFormat('portrait')}
                className="flex-1"
              >
                Portrait
              </Button>
              <Button
                type="button"
                variant={printFormat === 'landscape' ? 'default' : 'outline'}
                onClick={() => setPrintFormat('landscape')}
                className="flex-1"
              >
                Landscape
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Schedule
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Printable Content */}
      <div ref={printRef} className={`bg-white ${printFormat === 'landscape' ? 'landscape' : ''}`}>
        <Card className="p-8 print:p-0 print:shadow-none print:border-0">
          {/* Header for print */}
          <div className="text-center mb-8 print:mb-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center print:w-12 print:h-12">
                <Building className="h-8 w-8 text-blue-600 print:h-6 print:w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-900 print:text-2xl">MAGNUS HOSPITAL</h1>
                <p className="text-xl text-blue-700 print:text-lg">Practitioner Schedule</p>
              </div>
            </div>
            <div className="text-gray-600">
              <p className="text-lg print:text-base">
                Period: {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
              </p>
              <p className="text-sm print:text-xs">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Schedule Content */}
          <div className="space-y-8">
            {mockSchedule.map((daySchedule, index) => (
              <div key={index} className="break-inside-avoid">
                <div className="bg-blue-50 p-4 rounded-lg mb-4 print:bg-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900 print:text-lg">{daySchedule.doctor}</h2>
                      <p className="text-blue-700 print:text-sm">{daySchedule.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold print:text-base">{daySchedule.date}</p>
                      <p className="text-sm text-gray-600 print:text-xs">{daySchedule.slots.length} appointments</p>
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
                      {daySchedule.slots.map((slot, slotIndex) => (
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
                              slot.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {slot.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap print:px-2 print:py-2">
                            <span className="text-gray-500 text-sm">-</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary for print */}
                <div className="mt-4 p-4 border-t border-gray-200 print:text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600">Total Appointments:</p>
                      <p className="font-semibold">{daySchedule.slots.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Confirmed:</p>
                      <p className="font-semibold text-green-600">
                        {daySchedule.slots.filter(s => s.status === 'confirmed').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pending:</p>
                      <p className="font-semibold text-yellow-600">
                        {daySchedule.slots.filter(s => s.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer for print */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center text-gray-500 print:text-xs">
            <p>Magnus Hospital • 123 Hospital Road, City • Phone: (123) 456-7890</p>
            <p>Email: info@magnushospital.com • Website: www.magnushospital.com</p>
            <p className="mt-2">This is an official schedule document. Please verify with reception for last-minute changes.</p>
          </div>
        </Card>
      </div>

      {/* Preview Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Printing Instructions
        </h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• Use "Print Schedule" button for direct printing</li>
          <li>• Select "Portrait" for standard A4 printing</li>
          <li>• Select "Landscape" for wider schedules</li>
          <li>• Use "Export PDF" to save as PDF file</li>
          <li>• Use "Export Excel" for data analysis</li>
          <li>• Adjust date range and filters as needed</li>
          <li>• For best results, use Chrome or Firefox browser</li>
        </ul>
      </Card>
    </div>
  );
};

export default PrintSchedule;