// TypeScript Interfaces for Supabase
// Generated: 2026-02-21T09:03:49.045Z

export interface Patients {
  id: string;
  patient_id: string;
  prefix: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
  blood_group: string;
  notes: string;
  date_of_entry: string | Date;
  patient_tag: string;
  is_active: boolean;
  hospital_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  created_by?: string | null;
  aadhaar_number?: string | null;
  abha_id: string;
  assigned_department: string;
  assigned_doctor: string;
  date_of_birth: string | Date;
  photo_url?: string | null;
  has_reference: boolean;
  reference_details: string;
  queue_no: number;
  queue_status: string;
  queue_date?: string | null;
  has_pending_appointment: boolean;
  rghs_number?: string | null;
  token_number?: string | null;
  uhid?: string | null;
  photo_thumbnail_url?: string | null;
  photo_uploaded_at?: string | null;
}

export interface Doctors {
  id: string;
  name: string;
  department: string;
  specialization: string;
  fee: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  consultation_fee: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  qualification?: string | null;
  experience_years?: string | null;
}

export interface Appointments {
}

export interface Prescriptions {
}

export interface Bills {
}

export interface Departments {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Medicines {
}

export interface Users {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string | null;
  specialization?: string | null;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  password_hash: string;
}

export interface Transactions {
}

