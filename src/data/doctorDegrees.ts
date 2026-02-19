// Doctor Degree Mapping for Prescription Templates
// Maps doctor names to their medical degrees

export interface DoctorDegree {
  name: string;
  degree: string;
}

// Department-based degree mapping for prescription display
// Department-based degree mapping for prescription display
export const DEPARTMENT_DEGREES: Record<string, string> = {
  "General Medicine": "MBBS, MD"
};

// Doctor name corrections mapping
export const DOCTOR_NAME_CORRECTIONS: Record<string, string> = {
  "DR. KULDDEP VALA": "DR. KULDEEP VALA",
  "DR.RAJEEDP GUPTA": "DR.RAJDEEP GUPTA"
};

export const DOCTOR_DEGREES: Record<string, string> = {
  "Doctor Naveen": "MBBS, MD"
};

/**
 * Get doctor's degree by name
 * @param doctorName - Full doctor name (e.g., "Dr. Aashish Agarwal")
 * @returns Doctor's degree string or null if not found
 */
export const getDoctorDegree = (doctorName: string): string | null => {
  if (!doctorName) return null;

  const degree = DOCTOR_DEGREES[doctorName];
  if (!degree) {
    console.warn(`⚠️ Doctor degree not found for: "${doctorName}"`);
    return null;
  }

  return degree;
};

/**
 * Get formatted doctor name with degree
 * @param doctorName - Full doctor name
 * @returns Object with name and degree separated
 */
export const getDoctorWithDegree = (doctorName: string): { name: string; degree: string | null } => {
  // Apply name correction if available
  const correctedName = DOCTOR_NAME_CORRECTIONS[doctorName] || doctorName;

  return {
    name: correctedName,
    degree: getDoctorDegree(correctedName) || getDoctorDegree(doctorName)
  };
};