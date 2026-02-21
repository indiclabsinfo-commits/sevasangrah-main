import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Clock, User, Users, AlertCircle, CheckCircle, Bell } from 'lucide-react';

const WaitingHallDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBlinking, setIsBlinking] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setIsBlinking(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real queue data state
  const [currentTokens, setCurrentTokens] = useState<any[]>([]);
  const [upcomingTokens, setUpcomingTokens] = useState<any[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<any[]>([]);

  // Fetch real queue data
  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const { getSupabase } = await import('../lib/supabaseClient');
        const supabase = await getSupabase();

        // Get today's queue with patient and doctor details
        const { data: queues, error } = await supabase
          .from('opd_queue')
          .select(`
            *,
            patient:patients(first_name, last_name, phone),
            doctor:users!opd_queue_doctor_id_fkey(first_name, last_name)
          `)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .order('queue_no', { ascending: true });

        if (error) throw error;

        // Separate in-consultation and waiting
        const inConsultation = queues?.filter(q => q.queue_status === 'IN_CONSULTATION') || [];
        const waiting = queues?.filter(q => ['WAITING', 'VITALS_DONE'].includes(q.queue_status)) || [];

        // Format current tokens (in consultation)
        setCurrentTokens(inConsultation.slice(0, 3).map((q, idx) => ({
          token: `#${q.queue_no}`,
          counter: `Counter ${idx + 1}`,
          doctor: q.doctor ? `Dr. ${q.doctor.first_name} ${q.doctor.last_name}` : 'Doctor',
          department: q.department || 'General',
          waitTime: 'Now Serving'
        })));

        // Format upcoming tokens (waiting)
        setUpcomingTokens(waiting.slice(0, 5).map(q => ({
          token: `#${q.queue_no}`,
          patient: q.patient ? `${q.patient.first_name} ${q.patient.last_name}` : 'Patient',
          doctor: q.doctor ? `Dr. ${q.doctor.first_name} ${q.doctor.last_name}` : 'Doctor',
          estimatedTime: q.wait_time ? `${q.wait_time} min` : 'Calculating...',
          status: q.queue_status
        })));

        // Get unique doctors and their status
        const doctorGroups = queues?.reduce((acc: any, q) => {
          const docKey = q.doctor_id;
          if (!acc[docKey]) {
            acc[docKey] = {
              doctor: q.doctor ? `Dr. ${q.doctor.first_name} ${q.doctor.last_name}` : 'Doctor',
              department: q.department || 'General',
              status: 'available',
              currentPatient: 'None',
              waitTime: '0 min'
            };
          }
          if (q.queue_status === 'IN_CONSULTATION') {
            acc[docKey].status = 'busy';
            acc[docKey].currentPatient = `#${q.queue_no}`;
          }
          return acc;
        }, {});

        setDoctorAvailability(Object.values(doctorGroups || {}));

      } catch (error) {
        console.error('Error fetching queue data:', error);
        // Keep existing data or show empty
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'break': return 'bg-blue-500';
      case 'off': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'break': return 'On Break';
      case 'off': return 'Off Duty';
      default: return status;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-8">
      {/* Hospital Header */}
      <div className="mb-8 text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl">🏥</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900">MAGNUS HOSPITAL</h1>
            <p className="text-xl text-blue-700">Patient Waiting Hall Display</p>
          </div>
        </div>
        
        {/* Date and Time Display */}
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
          <div className={`text-5xl md:text-6xl font-mono font-bold text-center ${isBlinking ? 'text-blue-700' : 'text-blue-900'}`}>
            {formatTime(currentTime)}
          </div>
          <div className="text-xl text-gray-600 text-center mt-2">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Left Column: Current Serving */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8" />
                NOW SERVING
              </h2>
              <div className="text-2xl font-bold bg-white text-blue-700 px-4 py-2 rounded-lg">
                LIVE
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentTokens.map((token, index) => (
                <div 
                  key={index} 
                  className="bg-white text-blue-900 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-300 shadow-lg"
                >
                  <div className="text-5xl font-bold mb-2">{token.token}</div>
                  <div className="text-lg font-semibold mb-1">{token.counter}</div>
                  <div className="text-sm text-gray-600 mb-2">{token.doctor}</div>
                  <div className="text-sm text-gray-500">{token.department}</div>
                  <div className="mt-4 text-2xl font-bold text-green-600 animate-pulse">
                    {token.waitTime}
                  </div>
                </div>
              ))}
            </div>

            {/* Announcement Bar */}
            <div className="mt-8 bg-yellow-500 text-white p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-6 w-6" />
              <div className="flex-1">
                <span className="font-bold">Announcement:</span> Please have your UHID card and previous reports ready when called.
              </div>
            </div>
          </Card>

          {/* Upcoming Tokens */}
          <Card className="mt-6 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Users className="h-6 w-6" />
              UPCOMING TOKENS
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Wait</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingTokens.map((token, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-2xl font-bold text-blue-700">{token.token}</div>
                      </td>
                      <td className="px-4 py-4 font-medium">{token.patient}</td>
                      <td className="px-4 py-4">{token.doctor}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{token.estimatedTime}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {token.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Doctor Availability */}
        <div>
          <Card className="p-6 h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <User className="h-6 w-6" />
              DOCTOR AVAILABILITY
            </h2>

            <div className="space-y-4">
              {doctorAvailability.map((doctor, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{doctor.doctor}</h3>
                      <p className="text-sm text-gray-600">{doctor.department}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(doctor.status)}`} title={getStatusText(doctor.status)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Current:</span>
                      <div className="font-medium">{doctor.currentPatient}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Wait Time:</span>
                      <div className="font-medium">{doctor.waitTime}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(doctor.status)}`} />
                      <span className="text-sm">{getStatusText(doctor.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold text-gray-700 mb-3">Status Legend</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Busy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">On Break</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Off Duty</span>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Important Information
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Please wait for your token to be called</li>
                <li>• Estimated wait times are approximate</li>
                <li>• Emergency cases will be prioritized</li>
                <li>• Free WiFi available: Magnus_Guest</li>
                <li>• Cafeteria: Ground Floor</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-600">
        <p className="text-sm">For assistance, please visit the reception desk or call extension 101</p>
        <p className="text-xs mt-2">Display updates every 30 seconds • Last updated: {formatTime(currentTime)}</p>
      </div>
    </div>
  );
};

export default WaitingHallDisplay;