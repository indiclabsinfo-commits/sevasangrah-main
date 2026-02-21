import React, { useEffect, useState } from 'react';
import { User, Heart, Thermometer, Activity, Wind, History } from 'lucide-react';
import { opdService } from '../../services/opdService';

interface PatientBannerProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    age?: number;
    gender?: string;
    phone?: string;
    uhid?: string;
    blood_group?: string;
    patient_id?: string;
  };
  onToggleHistory: () => void;
  showHistoryActive: boolean;
}

interface Vitals {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature_f?: number;
  pulse_rate?: number;
  spO2_percentage?: number;
  respiratory_rate?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
}

const PatientBanner: React.FC<PatientBannerProps> = ({ patient, onToggleHistory, showHistoryActive }) => {
  const [vitals, setVitals] = useState<Vitals | null>(null);

  useEffect(() => {
    if (patient.id) {
      opdService.getLatestVitals(patient.id).then(v => {
        if (v) setVitals(v);
      }).catch(() => {});
    }
  }, [patient.id]);

  const fullName = `${patient.first_name} ${patient.last_name}`.trim();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      {/* Patient info row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{fullName}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {patient.uhid && <span>{patient.uhid}</span>}
              {patient.patient_id && !patient.uhid && <span>{patient.patient_id}</span>}
              {patient.age && <span>{patient.age}y</span>}
              {patient.gender && <span>{patient.gender}</span>}
              {patient.blood_group && (
                <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-xs font-medium">
                  {patient.blood_group}
                </span>
              )}
              {patient.phone && <span>{patient.phone}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleHistory}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showHistoryActive
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <History size={15} />
          History
        </button>
      </div>

      {/* Vitals row */}
      {vitals && (
        <div className="flex items-center gap-4 text-xs">
          {vitals.blood_pressure_systolic && (
            <div className="flex items-center gap-1 bg-pink-50 text-pink-700 px-2 py-1 rounded">
              <Heart size={12} />
              <span className="font-medium">BP:</span>
              {vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic} mmHg
            </div>
          )}
          {vitals.temperature_f && (
            <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded">
              <Thermometer size={12} />
              <span className="font-medium">Temp:</span>
              {vitals.temperature_f}°F
            </div>
          )}
          {vitals.pulse_rate && (
            <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded">
              <Activity size={12} />
              <span className="font-medium">Pulse:</span>
              {vitals.pulse_rate} bpm
            </div>
          )}
          {vitals.spO2_percentage && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
              <Wind size={12} />
              <span className="font-medium">SpO2:</span>
              {vitals.spO2_percentage}%
            </div>
          )}
          {vitals.weight_kg && (
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
              <span className="font-medium">Wt:</span>
              {vitals.weight_kg} kg
            </div>
          )}
          {vitals.bmi && (
            <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded">
              <span className="font-medium">BMI:</span>
              {vitals.bmi}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientBanner;
