import axios from 'axios';

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  is_active: boolean;
  is_custom: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateMedicineData {
  name: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  is_custom?: boolean;
}

class MedicineService {
  
  // =====================================================
  // HELPERS
  // =====================================================
  
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private getBaseUrl() {
    return import.meta.env.VITE_API_URL || '';
  }

  /**
   * Get all active medicines with search functionality
   */
  async getMedicines(searchTerm?: string): Promise<Medicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/medicines`, {
        headers: this.getHeaders(),
        params: { search: searchTerm }
      });

      return response.data || [];
    } catch (error) {
      console.error('Exception in getMedicines:', error);
      throw error;
    }
  }

  /**
   * Search medicines by name (for dropdown filtering)
   */
  async searchMedicines(searchTerm: string, limit = 50): Promise<Medicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/medicines/search`, {
        headers: this.getHeaders(),
        params: { q: searchTerm, limit }
      });

      return response.data || [];
    } catch (error) {
      console.error('Exception in searchMedicines:', error);
      throw error;
    }
  }

  /**
   * Get most used medicines (for quick access)
   */
  async getPopularMedicines(limit = 20): Promise<Medicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/medicines/popular`, {
        headers: this.getHeaders(),
        params: { limit }
      });

      return response.data || [];
    } catch (error) {
      console.error('Exception in getPopularMedicines:', error);
      throw error;
    }
  }

  /**
   * Create a new medicine (auto-save custom entries)
   */
  async createMedicine(medicineData: CreateMedicineData): Promise<Medicine> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/medicines`, {
        ...medicineData,
        category: medicineData.category || 'general',
        is_custom: medicineData.is_custom ?? true,
        usage_count: 1
      }, {
        headers: this.getHeaders()
      });

      console.log('✅ Medicine created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Exception in createMedicine:', error);
      throw error;
    }
  }

  /**
   * Increment usage count for a medicine
   */
  async incrementUsageCount(medicineId: string): Promise<void> {
    try {
      await axios.post(`${this.getBaseUrl()}/api/medicines/${medicineId}/increment-usage`, {}, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Exception in incrementUsageCount:', error);
      // Don't throw error for usage count update failures
    }
  }

  /**
   * Check if medicine exists by name
   */
  async medicineExists(name: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/medicines/exists`, {
        headers: this.getHeaders(),
        params: { name }
      });

      return response.data.exists || false;
    } catch (error) {
      console.error('Exception in medicineExists:', error);
      return false;
    }
  }

  /**
   * Get medicine by name (case insensitive)
   */
  async getMedicineByName(name: string): Promise<Medicine | null> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/medicines/by-name`, {
        headers: this.getHeaders(),
        params: { name }
      });

      return response.data || null;
    } catch (error: any) {
      console.error('Exception in getMedicineByName:', error);
      // Return null if not found
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update medicine
   */
  async updateMedicine(id: string, updates: Partial<CreateMedicineData>): Promise<Medicine> {
    try {
      const response = await axios.put(`${this.getBaseUrl()}/api/medicines/${id}`, updates, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Exception in updateMedicine:', error);
      throw error;
    }
  }

  /**
   * Deactivate medicine (soft delete)
   */
  async deactivateMedicine(id: string): Promise<void> {
    try {
      await axios.delete(`${this.getBaseUrl()}/api/medicines/${id}`, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Exception in deactivateMedicine:', error);
      throw error;
    }
  }

  /**
   * Get medicines by category
   */
  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/medicines/category/${category}`, {
        headers: this.getHeaders()
      });

      return response.data || [];
    } catch (error) {
      console.error('Exception in getMedicinesByCategory:', error);
      throw error;
    }
  }
}

export const medicineService = new MedicineService();
export default medicineService;