// Doctor Degree Mapping for Prescription Templates
// Maps doctor names to their medical degrees

export interface DoctorDegree {
  name: string;
  degree: string;
}

// Department-based degree mapping for prescription display
export const DEPARTMENT_DEGREES: Record<string, string> = {
  "ORTHOPEDIC": "M.S. ORTHO/ KNEE SPECIALIST",
  "ORTHOPAEDIC": "M.S. ORTHO/ KNEE SPECIALIST",
  "DIETICIAN": "M.SC & phD IN FOOD & NUTRITION",
  "GYN": "MBBS, MS, MENOPAUSE SPECIALIST CONSULTANT - OBSTRETRICS & GYNAECOLOGY",
  "GENERAL PHYSICIAN": "MBBS ( RNT MEDICAL COLLEGE)",
  "ENDOCRINOLOGY": "MBBS, MD MEDICINE\nMRCP Endocrinology (UK)",
  "NEUROLOGY": "MD. DNB. (Neurology)",
  "UROLOGY": "MS, MCH, ( UROLOGY &\nKIDNEY TRANSPLANT),\nCONSULTANT UROLOGIST\nLAPAROSCOPIC & ROBOTIC\nUROSURGEON",
  "SURGICAL ONCOLOGY": "MBBS,DNB (GEN. SURGERY),DRNB (SURGICSAL ONCOLOGY) CONSULTANT CANCER SURGEONE",
  "MEDICAL ONCOLOGY": "MD, DNB (MEDICAL ONCOLOGY)",
  "NEUROSURGERY": "M.S GENERAL SURGERY,\nM.CH. NEUROSUGERY",
  "GASTRO": "MS, MCH, DIRECTOR,GI &\nHPB SURGERY CONSULTANT,\nLIVER TRANSPLANTATION",
  "PHYSIOTHERAPY": "B.P.Th (Mumbai),\nM.P.Th - Ortho (Mumbai)"
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