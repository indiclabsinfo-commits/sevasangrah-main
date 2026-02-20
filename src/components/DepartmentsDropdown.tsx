// DepartmentsDropdown component - fetches real departments from database
import React, { useState, useEffect } from 'react';
import { DoctorService } from '../services/doctorService';
import { logger } from '../utils/logger';

interface DepartmentsDropdownProps {
  value: string;
  onChange: (department: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  showCount?: boolean;
}

const DepartmentsDropdown: React.FC<DepartmentsDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select Department',
  required = false,
  showCount = false
}) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [doctorCounts, setDoctorCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadDepartments = async () => {
      try {
        await fetchDepartments();
      } catch (error) {
        if (mounted) {
          console.error('Failed to load departments:', error);
          setError('Failed to load departments. Using fallback data.');
          // Use fallback departments immediately
          const fallbackDepartments = ['General', 'GYN.', 'Cardiology', 'Emergency', 'Orthopaedics', 'Pediatrics'];
          setDepartments(fallbackDepartments);
          setLoading(false);
        }
      }
    };
    
    loadDepartments();
    
    return () => {
      mounted = false;
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all doctors to count by department
      const allDoctors = await DoctorService.getAllDoctors();
      
      // Get unique departments
      const uniqueDepartments = [...new Set(allDoctors.map(doc => doc.department))].sort();
      setDepartments(uniqueDepartments);
      
      // Count doctors per department
      const counts: Record<string, number> = {};
      allDoctors.forEach(doctor => {
        counts[doctor.department] = (counts[doctor.department] || 0) + 1;
      });
      setDoctorCounts(counts);
      
      logger.log(`✅ Loaded ${uniqueDepartments.length} departments`);
      
    } catch (err: any) {
      logger.error('❌ Error loading departments:', err);
      setError(err.message || 'Failed to load departments');
      // Use fallback departments
      const fallbackDoctors = DoctorService.getFallbackDoctors();
      const fallbackDepartments = [...new Set(fallbackDoctors.map(doc => doc.department))].sort();
      setDepartments(fallbackDepartments);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const getDepartmentDisplayName = (dept: string) => {
    if (!showCount) return dept;
    const count = doctorCounts[dept] || 0;
    return `${dept} (${count} doctor${count !== 1 ? 's' : ''})`;
  };

  if (loading) {
    return (
      <select
        disabled
        className="w-full border rounded-md p-2 bg-gray-100 text-gray-500"
      >
        <option>Loading departments...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
        Error loading departments: {error}
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="text-yellow-600 text-sm p-2 bg-yellow-50 rounded border border-yellow-100">
        No departments found. Please add doctors in database.
      </div>
    );
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
      {departments.map(dept => (
        <option key={dept} value={dept}>
          {getDepartmentDisplayName(dept)}
        </option>
      ))}
    </select>
  );
};

export default DepartmentsDropdown;