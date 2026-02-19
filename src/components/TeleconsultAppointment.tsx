import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Video, Phone, MessageSquare, Calendar, Clock, User, Users, Download, Copy, Share2 } from 'lucide-react';

const TeleconsultAppointment: React.FC = () => {
  const [appointmentType, setAppointmentType] = useState<'physical' | 'teleconsult'>('teleconsult');
  const [consultationMode, setConsultationMode] = useState<'video' | 'audio' | 'chat'>('video');
  const [activeTab, setActiveTab] = useState<'schedule' | 'upcoming' | 'history'>('upcoming');

  // Mock data
  const mockUpcomingAppointments = [
    {
      id: '1',
      patientName: 'Rajesh Kumar',
      patientUHID: 'MH-2026-000123',
      doctorName: 'Doctor Naveen',
      department: 'Cardiology',
      type: 'teleconsult',
      mode: 'video',
      date: '2026-02-17',
      time: '14:30',
      duration: '30 min',
      status: 'scheduled',
      joinUrl: 'https://meet.example.com/abc123'
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      patientUHID: 'MH-2026-000456',
      doctorName: 'Doctor Naveen',
      department: 'Neurology',
      type: 'physical',
      mode: 'physical',
      date: '2026-02-17',
      time: '15:00',
      duration: '45 min',
      status: 'confirmed',
      joinUrl: null
    },
    {
      id: '3',
      patientName: 'Amit Patel',
      patientUHID: 'MH-2026-000789',
      doctorName: 'Doctor Naveen',
      department: 'General Medicine',
      type: 'teleconsult',
      mode: 'audio',
      date: '2026-02-18',
      time: '10:00',
      duration: '20 min',
      status: 'in_waiting_room',
      joinUrl: 'https://meet.example.com/xyz789'
    }
  ];

  const mockTeleconsultHistory = [
    {
      id: '4',
      patientName: 'Suresh Reddy',
      patientUHID: 'MH-2026-000234',
      doctorName: 'Doctor Naveen',
      date: '2026-02-16',
      duration: '25 min',
      mode: 'video',
      recordingAvailable: true,
      prescriptionSent: true
    },
    {
      id: '5',
      patientName: 'Meena Singh',
      patientUHID: 'MH-2026-000567',
      doctorName: 'Dr. Joshi',
      date: '2026-02-15',
      duration: '40 min',
      mode: 'audio',
      recordingAvailable: false,
      prescriptionSent: true
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_waiting_room: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const handleStartConsultation = (appointmentId: string) => {
    alert(`Starting consultation for appointment ${appointmentId}`);
    // In real implementation: Open video call, update status, etc.
  };

  const handleCopyJoinLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Join link copied to clipboard!');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teleconsult Appointments</h1>
        <p className="text-gray-600">Manage physical and virtual consultations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Appointments</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Teleconsults</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Video className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Waiting Room</p>
              <p className="text-2xl font-bold">2</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Wait Time</p>
              <p className="text-2xl font-bold">7.5m</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
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
          <Calendar className="mr-2 h-4 w-4" /> Schedule
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('history')}
        >
          <Users className="mr-2 h-4 w-4" /> History
        </Button>
      </div>

      {
        activeTab === 'upcoming' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Upcoming Appointments</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="primary">
                  <Calendar className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {mockUpcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-bold text-lg">{appointment.patientName}</h3>
                        <span className="font-mono text-sm text-gray-500">{appointment.patientUHID}</span>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{appointment.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{appointment.date} at {appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{appointment.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getModeIcon(appointment.mode)}
                          <span className="capitalize">{appointment.mode}</span>
                          <Badge variant={appointment.type === 'teleconsult' ? 'neutral' : 'info'}>
                            {appointment.type}
                          </Badge>
                        </div>
                      </div>

                      {appointment.type === 'teleconsult' && appointment.joinUrl && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Video Call Ready</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyJoinLink(appointment.joinUrl!)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStartConsultation(appointment.id)}
                              >
                                <Video className="h-3 w-3 mr-1" />
                                Join Call
                              </Button>
                            </div>
                          </div>
                          {appointment.status === 'in_waiting_room' && (
                            <div className="mt-2 text-sm text-yellow-600">
                              ⏳ Patient is in virtual waiting room
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )
      }

      {
        activeTab === 'schedule' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Schedule New Appointment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={appointmentType === 'physical' ? 'primary' : 'outline'}
                      onClick={() => setAppointmentType('physical')}
                      className="flex-1"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Physical Visit
                    </Button>
                    <Button
                      type="button"
                      variant={appointmentType === 'teleconsult' ? 'primary' : 'outline'}
                      onClick={() => setAppointmentType('teleconsult')}
                      className="flex-1"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Teleconsult
                    </Button>
                  </div>
                </div>

                {appointmentType === 'teleconsult' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Mode</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={consultationMode === 'video' ? 'primary' : 'outline'}
                        onClick={() => setConsultationMode('video')}
                        className="flex-1"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </Button>
                      <Button
                        type="button"
                        variant={consultationMode === 'audio' ? 'primary' : 'outline'}
                        onClick={() => setConsultationMode('audio')}
                        className="flex-1"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Audio
                      </Button>
                      <Button
                        type="button"
                        variant={consultationMode === 'chat' ? 'primary' : 'outline'}
                        onClick={() => setConsultationMode('chat')}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient UHID</label>
                  <Input placeholder="Enter patient UHID" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                  <select className="w-full p-2 border rounded">
                    <option>Dr. Sharma - Cardiology</option>
                    <option>Dr. Patel - Neurology</option>
                    <option>Dr. Gupta - General Medicine</option>
                    <option>Dr. Kumar - Orthopedics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" />
                    <Input type="time" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select className="w-full p-2 border rounded">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                  <textarea className="w-full p-2 border rounded h-24" placeholder="Enter symptoms or reason for consultation" />
                </div>

                {appointmentType === 'teleconsult' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Teleconsult Settings</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Enable virtual waiting room</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">Record consultation (with consent)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Send reminder 30 minutes before</span>
                      </label>
                    </div>
                  </div>
                )}

                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </Card>
        )
      }

      {
        activeTab === 'history' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Teleconsult History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recording</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockTeleconsultHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{record.patientName}</div>
                        <div className="text-sm text-gray-500">{record.patientUHID}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.doctorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.duration}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getModeIcon(record.mode)}
                          <span className="capitalize">{record.mode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.recordingAvailable ? (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Not available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.prescriptionSent ? (
                          <Badge className="bg-green-100 text-green-800">Sent</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      }
    </div >
  );
};

export default TeleconsultAppointment;