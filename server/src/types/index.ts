// ============================================================================
// SHARED TYPES
// ============================================================================

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  uhid?: string;
  blood_group?: string;
  photo_url?: string;
  hospital_id: string;
  created_at: string;
}

export interface MedicalCertificate {
  id: string;
  certificate_number: string;
  patient_id: string;
  doctor_id: string;
  certificate_type: 'sick_leave' | 'fitness' | 'disability';
  diagnosis: string;
  diagnosis_codes?: string[];
  start_date: string;
  end_date: string;
  duration_days: number;
  restrictions?: string;
  recommendations?: string;
  additional_notes?: string;
  purpose?: string;
  disability_percentage?: number;
  nature_of_disability?: string;
  pdf_path?: string;
  hospital_id: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  template_name: string;
  template_type: 'sms' | 'whatsapp' | 'email';
  category: string;
  language: string;
  content: string;
  variables: string[];
  is_active: boolean;
  hospital_id: string;
}

export interface NotificationLog {
  id: string;
  notification_number: string;
  template_id?: string;
  recipient_name?: string;
  recipient_phone: string;
  channel: 'sms' | 'whatsapp' | 'email';
  category?: string;
  message_content: string;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';
  scheduled_for?: string;
  sent_at?: string;
  cost_estimate?: number;
  error_message?: string;
  patient_id?: string;
  hospital_id: string;
  created_at: string;
}

export interface OTPVerification {
  id: string;
  phone_number: string;
  otp_code: string;
  purpose: 'registration' | 'login' | 'verification';
  expires_at: string;
  verified: boolean;
  attempts: number;
  hospital_id: string;
  created_at: string;
}

export interface UHIDConfig {
  id: string;
  hospital_id: string;
  prefix: string;
  separator: string;
  include_year: boolean;
  year_format: 'YYYY' | 'YY';
  sequence_digits: number;
  current_sequence: number;
  format_preview: string;
}

export interface EpisodeOfCare {
  id: string;
  episode_number: string;
  patient_id: string;
  episode_type: 'opd_visit' | 'ipd_admission' | 'emergency' | 'followup';
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  primary_diagnosis?: string;
  primary_doctor_id?: string;
  department?: string;
  notes?: string;
  hospital_id: string;
}

export interface EpisodeRecord {
  id: string;
  episode_id: string;
  record_type: 'consultation' | 'admission' | 'prescription' | 'lab_result' | 'certificate' | 'vitals';
  record_id: string;
  record_date: string;
  description?: string;
}

export interface DocumentUpload {
  id: string;
  patient_id: string;
  document_type: 'lab_report' | 'xray' | 'prescription' | 'discharge_summary' | 'other';
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by?: string;
  hospital_id: string;
  created_at: string;
}
