// Shared doctor data service - fetches from Supabase database
import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

export interface DoctorInfo {
  id: string;
  name: string;
  department: string;
  specialization?: string;
  fee?: number;
  is_active?: boolean;
}

// Cache for doctors data (to avoid repeated fetches)
let doctorsCache: DoctorInfo[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class DoctorService {
  // Fetch all doctors from Supabase
  static async fetchAllDoctors(): Promise<DoctorInfo[]> {
    // Return cached data if recent
    const now = Date.now();
    if (doctorsCache && (now - lastFetchTime) < CACHE_DURATION) {
      logger.log('📋 Returning cached doctors data');
      return doctorsCache;
    }

    try {
      const supabase = await getSupabase();
      logger.log('🔍 Fetching doctors from Supabase...');
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .order('department')
        .order('name');

      if (error) {
        logger.error('❌ Error fetching doctors:', error);
        // Fallback to hardcoded data
        return this.getFallbackDoctors();
      }

      if (!data || data.length === 0) {
        logger.warn('⚠️ No doctors found in database, using fallback');
        return this.getFallbackDoctors();
      }

      // Transform to DoctorInfo format
      const doctors: DoctorInfo[] = data.map(doc => ({
        id: doc.id,
        name: doc.name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || 'Unknown Doctor',
        department: doc.department || 'General',
        specialization: doc.specialization || doc.department || 'General',
        fee: doc.fee || doc.consultation_fee || 0,
        is_active: doc.is_active !== false
      }));

      // Update cache
      doctorsCache = doctors;
      lastFetchTime = now;
      
      logger.log(`✅ Fetched ${doctors.length} doctors from database`);
      return doctors;
      
    } catch (error) {
      logger.error('❌ Exception fetching doctors:', error);
      return this.getFallbackDoctors();
    }
  }

  // Get all doctors (cached)
  static async getAllDoctors(): Promise<DoctorInfo[]> {
    return this.fetchAllDoctors();
  }

  // Get doctors by department
  static async getDoctorsByDepartment(department: string): Promise<DoctorInfo[]> {
    const allDoctors = await this.fetchAllDoctors();
    return allDoctors.filter(doc => 
      doc.department.toLowerCase() === department.toLowerCase() || 
      doc.department === department
    );
  }

  // Get all unique departments
  static async getAllDepartments(): Promise<string[]> {
    const allDoctors = await this.fetchAllDoctors();
    const departments = [...new Set(allDoctors.map(doc => doc.department))].sort();
    return departments;
  }

  // Find doctor by name
  static async getDoctorByName(name: string): Promise<DoctorInfo | null> {
    const allDoctors = await this.fetchAllDoctors();
    const doctor = allDoctors.find(doc => 
      doc.name.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(doc.name.toLowerCase())
    );
    return doctor || null;
  }

  // Find doctor by ID
  static async getDoctorById(id: string): Promise<DoctorInfo | null> {
    const allDoctors = await this.fetchAllDoctors();
    return allDoctors.find(doc => doc.id === id) || null;
  }

  // Get fallback doctors (if database fails)
  private static getFallbackDoctors(): DoctorInfo[] {
    logger.log('🔄 Using fallback doctors data');
    return [
      { id: 'doc-1', name: 'DR. HEMANT KHAJJA', department: 'ORTHOPAEDIC', specialization: 'Orthopaedic Surgeon', fee: 800 },
      { id: 'doc-2', name: 'DR. LALITA SUWALKA', department: 'DIETICIAN', specialization: 'Clinical Dietician', fee: 500 },
      { id: 'doc-3', name: 'DR. MILIND KIRIT AKHANI', department: 'GASTRO', specialization: 'Gastroenterologist', fee: 1000 },
      { id: 'doc-4', name: 'DR MEETU BABLE', department: 'GYN.', specialization: 'Gynecologist', fee: 900 },
      { id: 'doc-5', name: 'DR. AMIT PATANVADIYA', department: 'NEUROLOGY', specialization: 'Neurologist', fee: 1200 },
      { id: 'doc-6', name: 'DR. KISHAN PATEL', department: 'UROLOGY', specialization: 'Urologist', fee: 1000 },
      { id: 'doc-7', name: 'DR. PARTH SHAH', department: 'SURGICAL ONCOLOGY', specialization: 'Surgical Oncologist', fee: 1500 },
      { id: 'doc-8', name: 'DR.RAJEEDP GUPTA', department: 'MEDICAL ONCOLOGY', specialization: 'Medical Oncologist', fee: 1500 },
      { id: 'doc-9', name: 'DR. KULDDEP VALA', department: 'NEUROSURGERY', specialization: 'Neurosurgeon', fee: 2000 },
      { id: 'doc-10', name: 'DR. KURNAL PATEL', department: 'UROLOGY', specialization: 'Urologist', fee: 1000 },
      { id: 'doc-11', name: 'DR. SAURABH GUPTA', department: 'ENDOCRINOLOGY', specialization: 'Endocrinologist', fee: 800 },
      { id: 'doc-12', name: 'DR. BATUL PEEPAWALA', department: 'GENERAL PHYSICIAN', specialization: 'General Physician', fee: 600 }
    ];
  }

  // Clear cache (useful after adding new doctors)
  static clearCache(): void {
    doctorsCache = null;
    lastFetchTime = 0;
    logger.log('🧹 Cleared doctors cache');
  }

  // Force refresh (clear cache and fetch fresh)
  static async refreshDoctors(): Promise<DoctorInfo[]> {
    this.clearCache();
    return this.fetchAllDoctors();
  }

  // Search doctors by name or department
  static async searchDoctors(query: string): Promise<DoctorInfo[]> {
    const searchTerm = query.toLowerCase();
    const allDoctors = await this.fetchAllDoctors();
    return allDoctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm) ||
      doctor.department.toLowerCase().includes(searchTerm) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm))
    );
  }
}

// Export both as named and default for compatibility
export { DoctorService };
export default DoctorService;