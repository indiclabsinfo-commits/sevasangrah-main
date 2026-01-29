import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface Appointment {
    id: string;
    patient_name: string;
    doctor_name: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    appointment_type: string;
}

interface AppointmentCalendarProps {
    appointments: Appointment[];
    onSelectDate: (date: string) => void;
    selectedDate?: string;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ appointments, onSelectDate, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Pad the start of the month
    const startDay = startOfMonth(currentMonth).getDay(); // 0-6
    const blanks = Array(startDay).fill(null);

    const getDayAppointments = (date: Date) => {
        return appointments.filter(apt => isSameDay(new Date(apt.appointment_date), date));
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'no_show': return 'bg-red-200 text-red-900 border border-red-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        ◀
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 border border-gray-200 rounded-lg overflow-hidden">
                {daysOfWeek.map(day => (
                    <div key={day} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-600 border-b border-gray-200">
                        {day}
                    </div>
                ))}

                {blanks.map((_, i) => (
                    <div key={`blank-${i}`} className="bg-gray-50 min-h-[100px] border-b border-r border-gray-100"></div>
                ))}

                {daysInMonth.map(date => {
                    const dayApts = getDayAppointments(date);
                    const isSelected = selectedDate ? isSameDay(date, new Date(selectedDate)) : false;

                    return (
                        <div
                            key={date.toISOString()}
                            onClick={() => onSelectDate(date.toISOString())}
                            className={`min-h-[100px] p-2 border-b border-r border-gray-100 relative cursor-pointer hover:bg-blue-50 transition-colors
                    ${isToday(date) ? 'bg-blue-50/50' : 'bg-white'} 
                    ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
                `}
                        >
                            <div className={`text-right text-sm mb-1 ${isToday(date) ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                                <span className={isToday(date) ? 'bg-blue-100 px-2 py-0.5 rounded-full' : ''}>
                                    {format(date, 'd')}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {dayApts.slice(0, 3).map(apt => (
                                    <div
                                        key={apt.id}
                                        className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(apt.status)}`}
                                        title={`${apt.patient_name} - ${apt.appointment_time}`}
                                    >
                                        {apt.appointment_time} {apt.patient_name.split(' ')[0]}
                                    </div>
                                ))}
                                {dayApts.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center font-medium">
                                        + {dayApts.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AppointmentCalendar;
