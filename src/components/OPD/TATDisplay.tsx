// TAT Display Component for OPD Queue
// Shows Turnaround Time metrics for each patient in queue

import React from 'react';
import { Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface TATDisplayProps {
  queueItem: any;
  config?: {
    maxWaitTime: number;
    maxConsultationTime: number;
    maxTotalTAT: number;
  };
}

const TATDisplay: React.FC<TATDisplayProps> = ({ queueItem, config }) => {
  // Default TAT configuration (in minutes)
  const defaultConfig = {
    maxWaitTime: 30,
    maxConsultationTime: 15,
    maxTotalTAT: 60,
    ...config
  };

  // Calculate TAT metrics
  const calculateTAT = () => {
    const now = new Date();
    const created = new Date(queueItem.created_at);
    
    // Wait time (registration to consultation start)
    let waitTime = 0;
    let consultationDuration = 0;
    let totalTAT = 0;
    
    if (queueItem.consultation_start_time) {
      const startTime = new Date(queueItem.consultation_start_time);
      waitTime = Math.round((startTime.getTime() - created.getTime()) / (1000 * 60));
      
      if (queueItem.consultation_end_time) {
        const endTime = new Date(queueItem.consultation_end_time);
        consultationDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        totalTAT = Math.round((endTime.getTime() - created.getTime()) / (1000 * 60));
      } else {
        consultationDuration = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));
        totalTAT = Math.round((now.getTime() - created.getTime()) / (1000 * 60));
      }
    } else {
      waitTime = Math.round((now.getTime() - created.getTime()) / (1000 * 60));
      totalTAT = waitTime;
    }
    
    return { waitTime, consultationDuration, totalTAT };
  };

  // Determine TAT status
  const getTATStatus = (waitTime: number, consultationDuration: number, totalTAT: number) => {
    const { maxWaitTime, maxConsultationTime, maxTotalTAT } = defaultConfig;
    
    let status = 'normal';
    let messages: string[] = [];
    
    // Check wait time
    if (waitTime > maxWaitTime) {
      status = 'breached';
      messages.push(`Wait time exceeded by ${waitTime - maxWaitTime}min`);
    } else if (waitTime > (maxWaitTime * 0.9)) {
      status = 'critical';
      messages.push(`Wait time critical (${waitTime}/${maxWaitTime}min)`);
    } else if (waitTime > (maxWaitTime * 0.7)) {
      if (status === 'normal') status = 'warning';
      messages.push(`Wait time warning (${waitTime}/${maxWaitTime}min)`);
    }
    
    // Check consultation duration
    if (consultationDuration > maxConsultationTime) {
      status = 'breached';
      messages.push(`Consultation exceeded by ${consultationDuration - maxConsultationTime}min`);
    } else if (consultationDuration > (maxConsultationTime * 0.9)) {
      if (status !== 'breached') status = 'critical';
      messages.push(`Consultation critical (${consultationDuration}/${maxConsultationTime}min)`);
    } else if (consultationDuration > (maxConsultationTime * 0.7)) {
      if (status === 'normal') status = 'warning';
      messages.push(`Consultation warning (${consultationDuration}/${maxConsultationTime}min)`);
    }
    
    // Check total TAT
    if (totalTAT > maxTotalTAT) {
      status = 'breached';
      messages.push(`Total TAT exceeded by ${totalTAT - maxTotalTAT}min`);
    } else if (totalTAT > (maxTotalTAT * 0.9)) {
      if (status !== 'breached') status = 'critical';
      messages.push(`Total TAT critical (${totalTAT}/${maxTotalTAT}min)`);
    } else if (totalTAT > (maxTotalTAT * 0.7)) {
      if (status === 'normal') status = 'warning';
      messages.push(`Total TAT warning (${totalTAT}/${maxTotalTAT}min)`);
    }
    
    return { status, messages };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'breached': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'breached': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const { waitTime, consultationDuration, totalTAT } = calculateTAT();
  const { status, messages } = getTATStatus(waitTime, consultationDuration, totalTAT);
  const statusColor = getStatusColor(status);
  const StatusIcon = getStatusIcon(status);

  return (
    <div className="space-y-2">
      {/* TAT Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusColor}`}>
        {StatusIcon}
        <span className="text-sm font-medium capitalize">{status}</span>
        {messages.length > 0 && (
          <span className="text-xs ml-auto">{messages[0]}</span>
        )}
      </div>

      {/* TAT Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {/* Wait Time */}
        <div className={`p-2 rounded-lg text-center ${waitTime > defaultConfig.maxWaitTime * 0.7 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="text-xs text-gray-600 mb-1">Wait Time</div>
          <div className="text-lg font-bold">{waitTime} min</div>
          <div className="text-xs text-gray-500">Max: {defaultConfig.maxWaitTime}min</div>
        </div>

        {/* Consultation Duration */}
        <div className={`p-2 rounded-lg text-center ${consultationDuration > defaultConfig.maxConsultationTime * 0.7 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-100'}`}>
          <div className="text-xs text-gray-600 mb-1">Consultation</div>
          <div className="text-lg font-bold">{consultationDuration} min</div>
          <div className="text-xs text-gray-500">Max: {defaultConfig.maxConsultationTime}min</div>
        </div>

        {/* Total TAT */}
        <div className={`p-2 rounded-lg text-center ${totalTAT > defaultConfig.maxTotalTAT * 0.7 ? 'bg-amber-50 border border-amber-200' : 'bg-purple-50 border border-purple-100'}`}>
          <div className="text-xs text-gray-600 mb-1">Total TAT</div>
          <div className="text-lg font-bold">{totalTAT} min</div>
          <div className="text-xs text-gray-500">Max: {defaultConfig.maxTotalTAT}min</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-1">
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Wait Time Progress</span>
            <span>{Math.round((waitTime / defaultConfig.maxWaitTime) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${waitTime > defaultConfig.maxWaitTime ? 'bg-red-500' : waitTime > defaultConfig.maxWaitTime * 0.9 ? 'bg-orange-500' : waitTime > defaultConfig.maxWaitTime * 0.7 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((waitTime / defaultConfig.maxWaitTime) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Consultation Progress</span>
            <span>{Math.round((consultationDuration / defaultConfig.maxConsultationTime) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${consultationDuration > defaultConfig.maxConsultationTime ? 'bg-red-500' : consultationDuration > defaultConfig.maxConsultationTime * 0.9 ? 'bg-orange-500' : consultationDuration > defaultConfig.maxConsultationTime * 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((consultationDuration / defaultConfig.maxConsultationTime) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Total TAT Progress</span>
            <span>{Math.round((totalTAT / defaultConfig.maxTotalTAT) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${totalTAT > defaultConfig.maxTotalTAT ? 'bg-red-500' : totalTAT > defaultConfig.maxTotalTAT * 0.9 ? 'bg-orange-500' : totalTAT > defaultConfig.maxTotalTAT * 0.7 ? 'bg-yellow-500' : 'bg-purple-500'}`}
              style={{ width: `${Math.min((totalTAT / defaultConfig.maxTotalTAT) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Time Stamps */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Registered:</span>
          <span>{new Date(queueItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {queueItem.consultation_start_time && (
          <div className="flex justify-between">
            <span>Consultation Started:</span>
            <span>{new Date(queueItem.consultation_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        {queueItem.consultation_end_time && (
          <div className="flex justify-between">
            <span>Consultation Ended:</span>
            <span>{new Date(queueItem.consultation_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TATDisplay;