import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Printer, Download, Calendar, Filter, User, Clock, Building } from 'lucide-react';

const PrintScheduleSimple: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '2026-02-17', end: '2026-02-23' });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF export would generate a formatted schedule document');
    // In real implementation: Generate PDF using jsPDF or similar
  };

  const handleExportExcel = () => {
    alert('Excel export would generate schedule data in spreadsheet format');
    // In real implementation: Generate CSV/Excel file
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Print Practitioner Schedule</h1>
        <p className="text-gray-600">Generate and print doctor schedules</p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Schedule Display */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">MAGNUS HOSPITAL</h1>
              <p className="text-lg text-blue-700">Practitioner Schedule</p>
            </div>
          </div>
          <div className="text-gray-600">
            <p>Period: {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}</p>
            <p className="text-sm">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8">
          {mockSchedule.map((daySchedule, index) => (
            <div key={index}>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">{daySchedule.doctor}</h2>
                    <p className="text-blue-700">{daySchedule.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{daySchedule.date}</p>
                    <p className="text-sm text-gray-600">{daySchedule.slots.length} appointments</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {daySchedule.slots.map((slot, slotIndex) => (
                      <tr key={slotIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{slot.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{slot.patient}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {slot.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            slot.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {slot.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 border-t border-gray-200">
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

        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-gray-500 text-sm">
          <p>Magnus Hospital • 123 Hospital Road, City • Phone: (123) 456-7890</p>
          <p>Email: info@magnushospital.com • Website: www.magnushospital.com</p>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Printing Instructions
        </h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• Use "Print Schedule" button for browser printing</li>
          <li>• Select date range and filters before printing</li>
          <li>• Use "Export PDF" to save as PDF file (mock)</li>
          <li>• Use "Export Excel" for data analysis (mock)</li>
          <li>• For best print results, use Chrome or Firefox</li>
          <li>• Adjust browser print settings for optimal output</li>
        </ul>
      </Card>
    </div>
  );
};

export default PrintScheduleSimple;