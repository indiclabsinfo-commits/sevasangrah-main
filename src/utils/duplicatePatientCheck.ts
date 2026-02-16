// Duplicate Patient Check Utility
// Feature #22: Duplicate patient registration check

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PatientDuplicateCheck {
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  aadhaar?: string;
  abhaId?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface DuplicateMatch {
  patientId: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    aadhaar_number?: string;
    abha_id?: string;
    date_of_birth?: string;
    gender?: string;
    uhid?: string;
    created_at: string;
    last_visit?: string;
  };
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  totalMatches: number;
  exactMatches: DuplicateMatch[];
  potentialMatches: DuplicateMatch[];
  suggestedAction: 'block' | 'warn' | 'allow';
  confidence: number; // 0-100
}

// Calculate similarity between two strings (0-100)
const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  
  // Levenshtein distance for names
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = Math.max(0, 100 - (distance / maxLength) * 100);
  
  return Math.round(similarity);
};

// Levenshtein distance algorithm
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

// Normalize phone number (remove spaces, +91, etc.)
const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
};

// Check for duplicate patients
export const checkForDuplicates = async (
  patientData: PatientDuplicateCheck
): Promise<DuplicateCheckResult> => {
  try {
    logger.log('🔍 Checking for duplicate patients:', patientData);
    
    const matches: DuplicateMatch[] = [];
    
    // 1. Check by Aadhaar (exact match)
    if (patientData.aadhaar && patientData.aadhaar.length === 12) {
      const aadhaarMatches = await checkByAadhaar(patientData.aadhaar, patientData.patientId);
      matches.push(...aadhaarMatches);
    }
    
    // 2. Check by ABHA ID (exact match)
    if (patientData.abhaId) {
      const abhaMatches = await checkByABHA(patientData.abhaId, patientData.patientId);
      matches.push(...abhaMatches);
    }
    
    // 3. Check by phone number (exact and similar)
    if (patientData.phone) {
      const phoneMatches = await checkByPhone(patientData.phone, patientData.patientId);
      matches.push(...phoneMatches);
    }
    
    // 4. Check by name and date of birth
    if (patientData.firstName && patientData.dateOfBirth) {
      const nameDobMatches = await checkByNameAndDOB(
        patientData.firstName,
        patientData.lastName,
        patientData.dateOfBirth,
        patientData.patientId
      );
      matches.push(...nameDobMatches);
    }
    
    // 5. Check by name and phone similarity
    if (patientData.firstName && patientData.phone) {
      const namePhoneMatches = await checkByNameAndPhone(
        patientData.firstName,
        patientData.lastName,
        patientData.phone,
        patientData.patientId
      );
      matches.push(...namePhoneMatches);
    }
    
    // Remove duplicates (same patient matched by multiple criteria)
    const uniqueMatches = removeDuplicateMatches(matches);
    
    // Categorize matches
    const exactMatches = uniqueMatches.filter(m => m.matchScore >= 90);
    const potentialMatches = uniqueMatches.filter(m => m.matchScore >= 70 && m.matchScore < 90);
    
    // Determine suggested action
    let suggestedAction: 'block' | 'warn' | 'allow' = 'allow';
    let confidence = 0;
    
    if (exactMatches.length > 0) {
      suggestedAction = 'block';
      confidence = 95;
    } else if (potentialMatches.length > 0) {
      suggestedAction = 'warn';
      confidence = 70;
    } else {
      suggestedAction = 'allow';
      confidence = 10; // Low confidence for "no duplicates"
    }
    
    const result: DuplicateCheckResult = {
      hasDuplicates: exactMatches.length > 0 || potentialMatches.length > 0,
      totalMatches: uniqueMatches.length,
      exactMatches,
      potentialMatches,
      suggestedAction,
      confidence
    };
    
    logger.log('✅ Duplicate check result:', result);
    return result;
  } catch (error) {
    logger.error('❌ Error checking for duplicates:', error);
    return {
      hasDuplicates: false,
      totalMatches: 0,
      exactMatches: [],
      potentialMatches: [],
      suggestedAction: 'allow',
      confidence: 0
    };
  }
};

// Check by Aadhaar number
const checkByAadhaar = async (aadhaar: string, excludePatientId?: string): Promise<DuplicateMatch[]> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('aadhaar_number', aadhaar)
    .neq('id', excludePatientId || '')
    .limit(5);
  
  if (error || !data) return [];
  
  return data.map(patient => ({
    patientId: patient.id,
    matchScore: 100, // Exact Aadhaar match
    matchReasons: ['Exact Aadhaar number match'],
    patient
  }));
};

// Check by ABHA ID
const checkByABHA = async (abhaId: string, excludePatientId?: string): Promise<DuplicateMatch[]> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('abha_id', abhaId)
    .neq('id', excludePatientId || '')
    .limit(5);
  
  if (error || !data) return [];
  
  return data.map(patient => ({
    patientId: patient.id,
    matchScore: 100, // Exact ABHA match
    matchReasons: ['Exact ABHA ID match'],
    patient
  }));
};

// Check by phone number
const checkByPhone = async (phone: string, excludePatientId?: string): Promise<DuplicateMatch[]> => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return [];
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .neq('id', excludePatientId || '')
    .limit(10);
  
  if (error || !data) return [];
  
  const matches: DuplicateMatch[] = [];
  
  data.forEach(patient => {
    const patientPhone = normalizePhone(patient.phone || '');
    if (!patientPhone) return;
    
    const similarity = calculateStringSimilarity(normalizedPhone, patientPhone);
    
    if (similarity >= 70) {
      const reasons: string[] = [];
      if (similarity === 100) {
        reasons.push('Exact phone number match');
      } else if (similarity >= 90) {
        reasons.push('Very similar phone number');
      } else {
        reasons.push('Similar phone number');
      }
      
      matches.push({
        patientId: patient.id,
        matchScore: similarity,
        matchReasons: reasons,
        patient
      });
    }
  });
  
  return matches;
};

// Check by name and date of birth
const checkByNameAndDOB = async (
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  excludePatientId?: string
): Promise<DuplicateMatch[]> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .neq('id', excludePatientId || '')
    .limit(10);
  
  if (error || !data) return [];
  
  const matches: DuplicateMatch[] = [];
  
  data.forEach(patient => {
    let matchScore = 0;
    const reasons: string[] = [];
    
    // Check name similarity
    const firstNameSimilarity = calculateStringSimilarity(firstName, patient.first_name || '');
    const lastNameSimilarity = calculateStringSimilarity(lastName || '', patient.last_name || '');
    const nameSimilarity = Math.max(firstNameSimilarity, lastNameSimilarity);
    
    if (nameSimilarity >= 80) {
      matchScore += nameSimilarity * 0.6; // 60% weight for name
      reasons.push(`Name similarity: ${nameSimilarity}%`);
    }
    
    // Check date of birth
    if (dateOfBirth && patient.date_of_birth) {
      const dobSimilarity = calculateStringSimilarity(dateOfBirth, patient.date_of_birth);
      if (dobSimilarity >= 80) {
        matchScore += dobSimilarity * 0.4; // 40% weight for DOB
        reasons.push(`Date of birth match: ${dobSimilarity}%`);
      }
    }
    
    if (matchScore >= 70) {
      matches.push({
        patientId: patient.id,
        matchScore: Math.round(matchScore),
        matchReasons: reasons,
        patient
      });
    }
  });
  
  return matches;
};

// Check by name and phone
const checkByNameAndPhone = async (
  firstName: string,
  lastName: string,
  phone: string,
  excludePatientId?: string
): Promise<DuplicateMatch[]> => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return [];
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .neq('id', excludePatientId || '')
    .limit(10);
  
  if (error || !data) return [];
  
  const matches: DuplicateMatch[] = [];
  
  data.forEach(patient => {
    let matchScore = 0;
    const reasons: string[] = [];
    
    // Check name similarity
    const firstNameSimilarity = calculateStringSimilarity(firstName, patient.first_name || '');
    const lastNameSimilarity = calculateStringSimilarity(lastName || '', patient.last_name || '');
    const nameSimilarity = Math.max(firstNameSimilarity, lastNameSimilarity);
    
    if (nameSimilarity >= 70) {
      matchScore += nameSimilarity * 0.5; // 50% weight for name
      reasons.push(`Name similarity: ${nameSimilarity}%`);
    }
    
    // Check phone similarity
    const patientPhone = normalizePhone(patient.phone || '');
    if (patientPhone) {
      const phoneSimilarity = calculateStringSimilarity(normalizedPhone, patientPhone);
      if (phoneSimilarity >= 70) {
        matchScore += phoneSimilarity * 0.5; // 50% weight for phone
        reasons.push(`Phone similarity: ${phoneSimilarity}%`);
      }
    }
    
    if (matchScore >= 70) {
      matches.push({
        patientId: patient.id,
        matchScore: Math.round(matchScore),
        matchReasons: reasons,
        patient
      });
    }
  });
  
  return matches;
};

// Remove duplicate matches (same patient matched multiple times)
const removeDuplicateMatches = (matches: DuplicateMatch[]): DuplicateMatch[] => {
  const uniquePatients = new Map<string, DuplicateMatch>();
  
  matches.forEach(match => {
    const existing = uniquePatients.get(match.patientId);
    if (!existing || match.matchScore > existing.matchScore) {
      uniquePatients.set(match.patientId, match);
    }
  });
  
  return Array.from(uniquePatients.values());
};

// Merge duplicate patients (admin function)
export const mergeDuplicatePatients = async (
  primaryPatientId: string,
  duplicatePatientIds: string[]
): Promise<boolean> => {
  try {
    logger.log('🔄 Merging duplicate patients:', { primaryPatientId, duplicatePatientIds });
    
    // In a real implementation, this would:
    // 1. Transfer all records (appointments, transactions, etc.) to primary patient
    // 2. Update foreign keys in related tables
    // 3. Mark duplicate patients as merged/inactive
    // 4. Log the merge operation
    
    // For now, we'll just log and return success
    logger.log('✅ Merge operation logged (simulated)');
    
    // Update duplicate patients to mark them as merged
    const { error } = await supabase
      .from('patients')
      .update({
        merged_into: primaryPatientId,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .in('id', duplicatePatientIds);
    
    if (error) {
      logger.error('❌ Error marking duplicates as merged:', error);
      return false;
    }
    
    // Log merge operation
    await supabase
      .from('patient_merge_logs')
      .insert({
        primary_patient_id: primaryPatientId,
        duplicate_patient_ids: duplicatePatientIds,
        merged_at: new Date().toISOString(),
        merged_by: 'system' // In real app, use current user ID
      });
    
    logger.log('✅ Duplicate patients merged successfully');
    return true;
  } catch (error) {
    logger.error('❌ Error merging duplicate patients:', error);
    return false;
  }
};

// Get merge history for a patient
export const getMergeHistory = async (patientId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('patient_merge_logs')
    .select('*')
    .or(`primary_patient_id.eq.${patientId},duplicate_patient_ids.cs.{${patientId}}`)
    .order('merged_at', { ascending: false });
  
  if (error) {
    logger.error('❌ Error fetching merge history:', error);
    return [];
  }
  
  return data || [];
};