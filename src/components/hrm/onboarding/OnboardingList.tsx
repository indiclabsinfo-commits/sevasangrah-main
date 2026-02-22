import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Square, User, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OnboardingList: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    // Mock list of new hires (In real app, fetch from employee_master where status='Onboarding')
    const { data: employees } = useQuery({
        queryKey: ['new-hires'],
        queryFn: async () => {
            // Temporary: Fetch all employees for demo
            const employees = await hrmService.getEmployeeMasters();
            return employees;
        }
    });

    const { data: onboarding, isLoading: onboardingLoading } = useQuery({
        queryKey: ['onboarding', selectedEmployeeId],
        queryFn: () => selectedEmployeeId ? hrmService.getEmployeeOnboarding(selectedEmployeeId) : null,
        enabled: !!selectedEmployeeId,
    });

    const initiateMutation = useMutation({
        mutationFn: (empId: string) => hrmService.initiateOnboarding(empId),
        onSuccess: () => {
            toast.success('Onboarding initiated');
            queryClient.invalidateQueries({ queryKey: ['onboarding'] });
        },
        onError: () => toast.error('Failed to initiate onboarding'),
    });

    const taskMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string, status: string }) =>
            hrmService.updateOnboardingTask(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding'] });
        },
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Employee List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">New Hires</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {employees?.map((emp) => (
                        <div
                            key={emp.id}
                            onClick={() => setSelectedEmployeeId(emp.id)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmployeeId === emp.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                                    <p className="text-xs text-gray-500">{emp.department?.department_name || 'No Dept'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Onboarding Details */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {!selectedEmployeeId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <User className="w-12 h-12 mb-4 text-gray-300" />
                        <p>Select an employee to view onboarding status</p>
                    </div>
                ) : onboarding ? (
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Onboarding Checklist</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Started on {format(new Date(onboarding.start_date), 'd MMM yyyy')}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${onboarding.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {onboarding.status}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {onboarding.tasks?.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                    <button
                                        onClick={() => taskMutation.mutate({
                                            taskId: task.id,
                                            status: task.status === 'Completed' ? 'Pending' : 'Completed'
                                        })}
                                        className="mt-0.5"
                                    >
                                        {task.status === 'Completed' ? (
                                            <CheckSquare className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-300" />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`font-medium ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            {task.task_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{task.description}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {task.assigned_to ? 'Assigned' : 'Unassigned'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <p className="mb-4">No onboarding workflow started for this employee.</p>
                        <Button onClick={() => initiateMutation.mutate(selectedEmployeeId)}>
                            Initiate Onboarding
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingList;
