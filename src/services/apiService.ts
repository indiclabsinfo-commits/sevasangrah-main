/**
 * Unified Backend API Client
 * Routes all backend calls through the Express.js server at /api
 * In development: Vite proxies /api → localhost:3002
 * In production: Same origin (Express serves both frontend + API)
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

interface RequestOptions {
  headers?: Record<string, string>;
}

async function request<T>(method: string, path: string, body?: any, options?: RequestOptions): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  const headers: Record<string, string> = {
    ...options?.headers,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data.data !== undefined ? data.data : data;
}

const api = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, body?: any, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T = any>(path: string, body?: any) => request<T>('PUT', path, body),
  delete: <T = any>(path: string) => request<T>('DELETE', path),

  // File upload helper
  upload: async <T = any>(path: string, file: File | Blob, fieldName = 'file', extraFields?: Record<string, string>) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
    }
    return request<T>('POST', path, formData);
  },

  // Health check
  health: () => request<{ status: string; database: string }>('GET', '/health'),

  // === SMS ===
  sms: {
    send: (to: string, message: string, patientId?: string) =>
      request('POST', '/sms/send', { to, message, patientId }),
    sendAppointmentConfirmation: (data: { patientName: string; phone: string; date: string; time: string; doctorName: string; patientId?: string }) =>
      request('POST', '/sms/send-appointment-confirmation', data),
    sendRegistrationConfirmation: (data: { patientName: string; phone: string; uhid: string; patientId?: string }) =>
      request('POST', '/sms/send-registration-confirmation', data),
    sendReminder: (data: { patientName: string; phone: string; date: string; doctorName: string; patientId?: string }) =>
      request('POST', '/sms/send-reminder', data),
    getLogs: (patientId?: string) =>
      request('GET', `/sms/logs${patientId ? `?patient_id=${patientId}` : ''}`),
  },

  // === WhatsApp ===
  whatsapp: {
    send: (to: string, message: string, patientId?: string) =>
      request('POST', '/whatsapp/send', { to, message, patientId }),
    sendReminder: (data: { patientName: string; phone: string; date: string; time: string; doctorName: string; patientId?: string }) =>
      request('POST', '/whatsapp/send-reminder', data),
    sendFollowUpReminder: (data: { patientName: string; phone: string; date: string; doctorName: string; patientId?: string }) =>
      request('POST', '/whatsapp/send-followup-reminder', data),
  },

  // === OTP ===
  otp: {
    send: (phoneNumber: string, purpose?: string) =>
      request('POST', '/otp/send', { phoneNumber, purpose }),
    verify: (phoneNumber: string, otpCode: string) =>
      request('POST', '/otp/verify', { phoneNumber, otpCode }),
  },

  // === Notifications ===
  notifications: {
    send: (data: { channel: string; recipientName?: string; recipientPhone: string; message: string; category?: string; patientId?: string }) =>
      request('POST', '/notifications/send', data),
    getTemplates: () => request('GET', '/notifications/templates'),
    createTemplate: (data: any) => request('POST', '/notifications/templates', data),
    getLogs: (page = 1, limit = 50) => request('GET', `/notifications/logs?page=${page}&limit=${limit}`),
    getStats: () => request('GET', '/notifications/stats'),
  },

  // === Certificates ===
  certificates: {
    create: (data: any) => request('POST', '/certificates', data),
    get: (id: string) => request('GET', `/certificates/${id}`),
    list: (patientId?: string) => request('GET', `/certificates${patientId ? `?patient_id=${patientId}` : ''}`),
    getPdfUrl: (id: string) => `${API_BASE}/api/certificates/${id}/pdf`,
  },

  // === Patient Photos ===
  patients: {
    uploadPhoto: (patientId: string, photoBlob: Blob) => {
      const formData = new FormData();
      formData.append('photo', photoBlob, 'patient-photo.jpg');
      return request<{ photoUrl: string }>('POST', `/patients/${patientId}/photo`, formData);
    },
    getPhotoUrl: (patientId: string) => request<{ photoUrl: string }>('GET', `/patients/${patientId}/photo`),
    bulkSync: (patients: any[]) => request('POST', '/patients/bulk-sync', { patients }),
  },

  // === UHID ===
  uhid: {
    getConfig: () => request('GET', '/uhid/config'),
    updateConfig: (data: any) => request('PUT', '/uhid/config', data),
    generateNext: () => request<{ uhid: string; sequence: number }>('POST', '/uhid/next'),
  },

  // === Episodes ===
  episodes: {
    create: (data: any) => request('POST', '/episodes', data),
    list: (patientId: string) => request('GET', `/episodes?patient_id=${patientId}`),
    get: (id: string) => request('GET', `/episodes/${id}`),
    linkRecord: (episodeId: string, data: any) => request('POST', `/episodes/${episodeId}/records`, data),
    update: (id: string, data: any) => request('PUT', `/episodes/${id}`, data),
  },

  // === Reports ===
  reports: {
    opdDaily: (date?: string) => request('GET', `/reports/opd/daily${date ? `?date=${date}` : ''}`),
    opdMonthly: (month?: string) => request('GET', `/reports/opd/monthly${month ? `?month=${month}` : ''}`),
    misOverview: () => request('GET', '/reports/mis/overview'),
    doctorWise: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return request('GET', `/reports/mis/doctor-wise?${params.toString()}`);
    },
  },

  // === Document Uploads ===
  documents: {
    upload: (patientId: string, file: File, documentType?: string, description?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      if (documentType) formData.append('documentType', documentType);
      if (description) formData.append('description', description);
      return request('POST', '/uploads', formData);
    },
    list: (patientId: string) => request('GET', `/uploads?patient_id=${patientId}`),
    getDownloadUrl: (id: string) => `${API_BASE}/api/uploads/${id}/download`,
    delete: (id: string) => request('DELETE', `/uploads/${id}`),
  },
};

export default api;
