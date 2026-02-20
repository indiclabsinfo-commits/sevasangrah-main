// DoctorsDropdown component - fetches real doctors from database
import React, { useState, useEffect } from 'react';
import { DoctorService, type DoctorInfo } from '../services/doctorService';
import { logger } from '../utils/logger';

interface DoctorsDropdownProps {
  value: string;
  onChange: (doctorName: string, doctorId?: string) => void;
  department?: string;
  disabled?: boolean;
  placeholder?: string;
  showFee?: boolean;
  required?: boolean;
}

const DoctorsDropdown: React.FC<DoctorsDropdownProps> = ({
  value,
  onChange,
  department,
  disabled = false,
  placeholder = 'Select Doctor',
  showFee = false,
  required = false
}) => {
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadDoctors = async () => {
      try {
        await fetchDoctors();
      } catch (error) {
        if (mounted) {
          console.error('Failed to load doctors:', error);
          setError('Failed to load doctors. Using fallback data.');
          // Use fallback doctors immediately
          const fallbackDoctors = [
            { id: 'doc-1', name: 'DR. NAVEEN', department: 'GYN.', specialization: 'Gynecologist', fee: 500 },
            { id: 'doc-2', name: 'DR. RAJESH KUMAR', department: 'General', specialization: 'General Medicine', fee: 500 },
            { id: 'doc-3', name: 'DR. PRIYA SHARMA', department: 'Cardiology', specialization: 'Cardiology', fee: 1200 }
          ];
          setDoctors(fallbackDoctors);
          setLoading(false);
        }
      }
    };
    
    loadDoctors();
    
    return () => {
      mounted = false;
    };
  }, [department]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let doctorsList: DoctorInfo[];
      
      if (department) {
        // Get doctors by specific department
        doctorsList = await DoctorService.getDoctorsByDepartment(department);
      } else {
        // Get all doctors
        doctorsList = await DoctorService.getAllDoctors();
      }
      
      setDoctors(doctorsList);
      logger.log(`✅ Loaded ${doctorsList.length} doctors${department ? ` for department: ${department}` : ''}`);
      
    } catch (err: any) {
      logger.error('❌ Error loading doctors:', err);
      setError(err.message || 'Failed to load doctors');
      // Use fallback doctors
      const fallbackDoctors = DoctorService.getFallbackDoctors();
      setDoctors(fallbackDoctors);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selectedDoctor = doctors.find(doc => doc.name === selectedName);
    onChange(selectedName, selectedDoctor?.id);
  };

  const getDoctorDisplayName = (doctor: DoctorInfo) => {
    let display = doctor.name;
    if (showFee && doctor.fee) {
      display += ` (₹${doctor.fee})`;
    }
    if (doctor.specialization && doctor.specialization !== doctor.department) {
      display += ` - ${doctor.specialization}`;
    }
    return display;
  };

  if (loading) {
    return (
      <select
        disabled
        className="w-full border rounded-md p-2 bg-gray-100 text-gray-500"
      >
        <option>Loading doctors...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
        Error loading doctors: {error}
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-yellow-600 text-sm p-2 bg-yellow-50 rounded border border-yellow-100">
        No doctors found{department ? ` in ${department} department` : ''}. Please add doctors in database.
      </div>
    );
  }

  // Group doctors by department if no specific department filter
  const doctorsByDepartment: Record<string, DoctorInfo[]> = {};
  if (!department) {
    doctors.forEach(doctor => {
      if (!doctorsByDepartment[doctor.department]) {
        doctorsByDepartment[doctor.department] = [];
      }
      doctorsByDepartment[doctor.department].push(doctor);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">{placeholder} {required && '*'}</option>
      
      {department ? (
        // Flat list for specific department
        doctors.map(doctor => (
          <option key={doctor.id} value={doctor.name}>
            {getDoctorDisplayName(doctor)}
          </option>
        ))
      ) : (
        // Grouped by department
        Object.entries(doctorsByDepartment).map(([dept, deptDoctors]) => (
          <optgroup key={dept} label={`${dept} Department`}>
            {deptDoctors.map(doctor => (
              <option key={doctor.id} value={doctor.name}>
                {getDoctorDisplayName(doctor)}
              </option>
            ))}
          </optgroup>
        ))
      )}
    </select>
  );
};

export default DoctorsDropdown;