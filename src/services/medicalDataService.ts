// Medical Data API Service for Azure Backend
// Replaces direct Supabase calls with backend API calls

import axios from 'axios';

// Helper functions
const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return { Authorization: `Bearer ${token}` };
};

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '';
};

// Generic fetch function for medical data
async function fetchMedicalData(endpoint: string, method: string = 'GET', data?: any) {
  const url = `${getBaseUrl()}${endpoint}`;
  
  try {
    console.log(`🌐 Medical API call: ${method} ${url}`);
    
    let response;
    const config = { headers: getHeaders() };
    
    switch (method) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data, config);
        break;
      case 'PUT':
      case 'PATCH':
        response = await axios.put(url, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    console.log(`✅ Medical API Success:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`💥 Medical API error:`, error);
    console.error(`Error response:`, error.response?.data);
    throw error;
  }
}

// Helper function for upsert operations
async function upsertMedicalData(tableName: string, data: any, patientId: string) {
  console.log(`💾 Upserting ${tableName} data:`, data);
  
  try {
    // Backend handles upsert logic
    const result = await fetchMedicalData(`/api/medical/${tableName}/${patientId}`, 'PUT', data);
    return result;
  } catch (error) {
    console.error(`Error upserting ${tableName} data:`, error);
    throw error;
  }
}

// Medical Data Service Functions
export const getMedicalHighRiskData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting high risk data for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/high-risk/${patientId}`, 'GET');
    return data || null;
  } catch (error: any) {
    console.error('Error getting high risk data:', error);
    // Return null if not found (404)
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
};

export const saveMedicalHighRiskData = async (data: any) => {
  return await upsertMedicalData('high-risk', data, data.patient_id);
};

export const getMedicalExaminationData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting examination data for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/examination/${patientId}`, 'GET');
    return data || null;
  } catch (error: any) {
    console.error('Error getting examination data:', error);
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
};

export const saveMedicalExaminationData = async (data: any) => {
  return await upsertMedicalData('examination', data, data.patient_id);
};

export const getMedicalInvestigationData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting investigation data for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/investigation/${patientId}`, 'GET');
    return data || null;
  } catch (error: any) {
    console.error('Error getting investigation data:', error);
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
};

export const saveMedicalInvestigationData = async (data: any) => {
  return await upsertMedicalData('investigation', data, data.patient_id);
};

export const getMedicalDiagnosisData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting diagnosis data for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/diagnosis/${patientId}`, 'GET');
    return data || null;
  } catch (error: any) {
    console.error('Error getting diagnosis data:', error);
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
};

export const saveMedicalDiagnosisData = async (data: any) => {
  return await upsertMedicalData('diagnosis', data, data.patient_id);
};

export const getMedicalPrescriptionData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting prescription data for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/prescription/${patientId}`, 'GET');
    return data || null;
  } catch (error: any) {
    console.error('Error getting prescription data:', error);
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
};

export const saveMedicalPrescriptionData = async (data: any) => {
  return await upsertMedicalData('prescription', data, data.patient_id);
};

export const getMedicalRecordSummaryData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting record summary for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/record-summary/${patientId}`, 'GET');
    return data || null;
  } catch (error: any) {
    console.error('Error getting record summary:', error);
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
};

export const saveMedicalRecordSummaryData = async (data: any) => {
  return await upsertMedicalData('record-summary', data, data.patient_id);
};

// Chief Complaints functions (different table structure)
export const getPatientChiefComplaintsData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting chief complaints for patient: ${patientId}`);
    const data = await fetchMedicalData(`/api/medical/chief-complaints/${patientId}`, 'GET');
    return data || [];
  } catch (error: any) {
    console.error('Error getting chief complaints:', error);
    if (error.response?.status === 404) {
      return [];
    }
    return [];
  }
};

export const savePatientChiefComplaintsData = async (patientId: string, complaintsArray: any[]) => {
  try {
    console.log(`💾 Saving chief complaints for patient: ${patientId}`, complaintsArray);
    
    const result = await fetchMedicalData(`/api/medical/chief-complaints/${patientId}`, 'PUT', {
      complaints: complaintsArray
    });
    
    return result;
  } catch (error) {
    console.error('Error saving chief complaints:', error);
    throw error;
  }
};

// Bulk operations
export const getAllMedicalData = async (patientId: string) => {
  try {
    console.log(`📋 Getting all medical data for patient: ${patientId}`);
    
    const [
      highRisk,
      examination,
      investigation,
      diagnosis,
      prescription,
      recordSummary
    ] = await Promise.allSettled([
      getMedicalHighRiskData(patientId),
      getMedicalExaminationData(patientId),
      getMedicalInvestigationData(patientId),
      getMedicalDiagnosisData(patientId),
      getMedicalPrescriptionData(patientId),
      getMedicalRecordSummaryData(patientId)
    ]);

    const result = {
      highRisk: highRisk.status === 'fulfilled' ? highRisk.value : null,
      examination: examination.status === 'fulfilled' ? examination.value : null,
      investigation: investigation.status === 'fulfilled' ? investigation.value : null,
      diagnosis: diagnosis.status === 'fulfilled' ? diagnosis.value : null,
      prescription: prescription.status === 'fulfilled' ? prescription.value : null,
      recordSummary: recordSummary.status === 'fulfilled' ? recordSummary.value : null
    };

    console.log(`✅ Retrieved all medical data for patient: ${patientId}`);
    return result;
  } catch (error) {
    console.error('Error getting all medical data:', error);
    return {
      highRisk: null,
      examination: null,
      investigation: null,
      diagnosis: null,
      prescription: null,
      recordSummary: null
    };
  }
};

export const saveAllMedicalData = async (patientId: string, medicalData: any) => {
  try {
    console.log(`💾 Saving all medical data for patient: ${patientId}`);
    
    const promises = [];
    
    if (medicalData.highRisk) {
      promises.push(saveMedicalHighRiskData({ patient_id: patientId, ...medicalData.highRisk }));
    }
    
    if (medicalData.examination) {
      promises.push(saveMedicalExaminationData({ patient_id: patientId, ...medicalData.examination }));
    }
    
    if (medicalData.investigation) {
      promises.push(saveMedicalInvestigationData({ patient_id: patientId, ...medicalData.investigation }));
    }
    
    if (medicalData.diagnosis) {
      promises.push(saveMedicalDiagnosisData({ patient_id: patientId, ...medicalData.diagnosis }));
    }
    
    if (medicalData.prescription) {
      promises.push(saveMedicalPrescriptionData({ patient_id: patientId, ...medicalData.prescription }));
    }
    
    if (medicalData.recordSummary) {
      promises.push(saveMedicalRecordSummaryData({ patient_id: patientId, ...medicalData.recordSummary }));
    }
    
    const results = await Promise.allSettled(promises);
    const errors = results.filter(r => r.status === 'rejected');
    
    if (errors.length > 0) {
      console.error('Some saves failed:', errors);
      throw new Error(`${errors.length} save operations failed`);
    }
    
    console.log('✅ All medical data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving all medical data:', error);
    throw error;
  }
};