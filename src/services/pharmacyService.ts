/**
 * Comprehensive Pharmacy Service
 * Hospital CRM Pro - Pharmacy Management System
 *
 * This service handles all pharmacy operations including:
 * - Inventory management
 * - Order processing & dispensing
 * - eMAR operations
 * - Billing
 * - Alerts & notifications
 * - Reports & analytics
 */

import axios from 'axios';
import type {
  EnhancedMedicine,
  PharmacyInventoryItem,
  PharmacyOrder,
  PharmacyOrderItem,
  PharmacyBill,
  ElectronicMAR,
  PatientAllergy,
  MedicationReconciliation,
  PharmacyReturnRecall,
  MedicationError,
  CrashCart,
  MedicalImplant,
  PharmacyReorderAlert,
  PharmacyExpiryAlert,
  PharmacyDashboardMetrics,
  CreateInventoryItemData,
  CreatePharmacyOrderData,
  CreatePharmacyBillData,
  InventoryFilters,
  OrderFilters,
  BillFilters,
  PaginatedResponse,
  PharmacyLocation,
  PharmacyConsumption,
} from '../types/pharmacy';

class PharmacyService {
  
  // =====================================================================
  // HELPERS
  // =====================================================================
  
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private getBaseUrl() {
    return import.meta.env.VITE_API_URL || '';
  }

  // =====================================================================
  // MEDICINE OPERATIONS
  // =====================================================================

  /**
   * Get all medicines with enhanced pharmacy details
   */
  async getMedicines(searchTerm?: string): Promise<EnhancedMedicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/medicines`, {
        headers: this.getHeaders(),
        params: { search: searchTerm }
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw error;
    }
  }

  /**
   * Get high-alert medications
   */
  async getHighAlertMedications(): Promise<EnhancedMedicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/medicines/high-alert`, {
        headers: this.getHeaders()
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching high-alert medications:', error);
      throw error;
    }
  }

  /**
   * Get LASA (Look-Alike Sound-Alike) medications
   */
  async getLASAMedications(): Promise<EnhancedMedicine[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/medicines/lasa`, {
        headers: this.getHeaders()
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching LASA medications:', error);
      throw error;
    }
  }

  // =====================================================================
  // INVENTORY MANAGEMENT
  // =====================================================================

  /**
   * Get inventory items with filters
   */
  async getInventoryItems(filters: InventoryFilters = {}): Promise<PharmacyInventoryItem[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/inventory`, {
        headers: this.getHeaders(),
        params: filters
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  /**
   * Add inventory item
   */
  async addInventoryItem(itemData: CreateInventoryItemData): Promise<PharmacyInventoryItem> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/inventory`, itemData, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  /**
   * Update inventory quantity
   */
  async updateInventoryQuantity(
    inventoryItemId: string,
    newQuantity: number,
    reason: string,
    movementType: 'purchase' | 'dispense' | 'return' | 'transfer' | 'adjustment' | 'wastage' | 'recall' | 'expiry'
  ): Promise<PharmacyInventoryItem> {
    try {
      const response = await axios.put(`${this.getBaseUrl()}/api/pharmacy/inventory/${inventoryItemId}/quantity`, {
        quantity: newQuantity,
        reason,
        movement_type: movementType
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(): Promise<PharmacyInventoryItem[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/inventory/low-stock`, {
        headers: this.getHeaders()
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  /**
   * Get expiring soon items
   */
  async getExpiringSoonItems(days: number = 90): Promise<PharmacyInventoryItem[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/inventory/expiring-soon`, {
        headers: this.getHeaders(),
        params: { days }
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching expiring soon items:', error);
      throw error;
    }
  }

  // =====================================================================
  // PHARMACY LOCATIONS
  // =====================================================================

  /**
   * Get all pharmacy locations
   */
  async getPharmacyLocations(): Promise<PharmacyLocation[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/locations`, {
        headers: this.getHeaders()
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching pharmacy locations:', error);
      throw error;
    }
  }

  // =====================================================================
  // ORDER MANAGEMENT
  // =====================================================================

  /**
   * Create pharmacy order (prescription)
   */
  async createPharmacyOrder(orderData: CreatePharmacyOrderData): Promise<PharmacyOrder> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/orders`, orderData, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error creating pharmacy order:', error);
      throw error;
    }
  }

  /**
   * Get pharmacy orders with filters
   */
  async getPharmacyOrders(filters: OrderFilters = {}): Promise<PharmacyOrder[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/orders`, {
        headers: this.getHeaders(),
        params: filters
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching pharmacy orders:', error);
      throw error;
    }
  }

  /**
   * Dispense medication
   */
  async dispenseMedication(
    orderItemId: string,
    inventoryItemId: string,
    quantityDispensed: number,
    dispensedBy: string
  ): Promise<PharmacyOrderItem> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/orders/dispense`, {
        order_item_id: orderItemId,
        inventory_item_id: inventoryItemId,
        quantity_dispensed: quantityDispensed,
        dispensed_by: dispensedBy
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error dispensing medication:', error);
      throw error;
    }
  }

  /**
   * Verify order (for high-risk medications)
   */
  async verifyOrder(orderId: string, verifiedBy: string): Promise<PharmacyOrder> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/orders/${orderId}/verify`, {
        verified_by: verifiedBy
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error verifying order:', error);
      throw error;
    }
  }

  /**
   * Second verification (for high-risk medications)
   */
  async secondVerification(orderId: string, secondCheckerId: string): Promise<PharmacyOrder> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/orders/${orderId}/second-check`, {
        second_checker_id: secondCheckerId
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error performing second verification:', error);
      throw error;
    }
  }

  // =====================================================================
  // BILLING
  // =====================================================================

  /**
   * Create pharmacy bill
   */
  async createPharmacyBill(billData: CreatePharmacyBillData, billedBy: string): Promise<PharmacyBill> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/bills`, {
        ...billData,
        billed_by: billedBy
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error creating pharmacy bill:', error);
      throw error;
    }
  }

  /**
   * Get pharmacy bills
   */
  async getPharmacyBills(filters: BillFilters = {}): Promise<PharmacyBill[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/bills`, {
        headers: this.getHeaders(),
        params: filters
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching pharmacy bills:', error);
      throw error;
    }
  }

  /**
   * Update bill payment status
   */
  async updateBillPayment(
    billId: string,
    paidAmount: number,
    paymentMode: string,
    receivedBy: string
  ): Promise<PharmacyBill> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/bills/${billId}/payment`, {
        paid_amount: paidAmount,
        payment_mode: paymentMode,
        received_by: receivedBy
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error updating bill payment:', error);
      throw error;
    }
  }

  // =====================================================================
  // eMAR OPERATIONS
  // =====================================================================

  /**
   * Get eMAR records for a patient
   */
  async getEMARRecords(patientId: string, startDate?: string, endDate?: string): Promise<ElectronicMAR[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/emar/${patientId}`, {
        headers: this.getHeaders(),
        params: { start_date: startDate, end_date: endDate }
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching eMAR records:', error);
      throw error;
    }
  }

  /**
   * Record medication administration
   */
  async recordAdministration(emarId: string, administeredBy: string, administrationData: any): Promise<ElectronicMAR> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/emar/${emarId}/administer`, {
        administered_by: administeredBy,
        ...administrationData
      }, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error recording administration:', error);
      throw error;
    }
  }

  // =====================================================================
  // ALLERGY MANAGEMENT
  // =====================================================================

  /**
   * Get patient allergies
   */
  async getPatientAllergies(patientId: string): Promise<PatientAllergy[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/allergies/${patientId}`, {
        headers: this.getHeaders()
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching patient allergies:', error);
      throw error;
    }
  }

  /**
   * Check for allergies when prescribing
   */
  async checkPatientAllergies(patientId: string, medicineIds: string[]): Promise<PatientAllergy[]> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/allergies/${patientId}/check`, {
        medicine_ids: medicineIds
      }, {
        headers: this.getHeaders()
      });

      if (response.data && response.data.length > 0) {
        console.warn('⚠️ ALLERGY ALERT: Patient has allergies to prescribed medications', response.data);
      }

      return response.data || [];
    } catch (error) {
      console.error('Error checking patient allergies:', error);
      throw error;
    }
  }

  // =====================================================================
  // DASHBOARD & ANALYTICS
  // =====================================================================

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<PharmacyDashboardMetrics> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/dashboard/metrics`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // =====================================================================
  // HELPER FUNCTIONS
  // =====================================================================

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/orders/next-number`, {
        headers: this.getHeaders()
      });
      return response.data.order_number || `RX-${Date.now()}`;
    } catch (error) {
      return `RX-${Date.now()}`;
    }
  }

  /**
   * Generate unique bill number
   */
  private async generateBillNumber(): Promise<string> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/pharmacy/bills/next-number`, {
        headers: this.getHeaders()
      });
      return response.data.bill_number || `PH-${Date.now()}`;
    } catch (error) {
      return `PH-${Date.now()}`;
    }
  }

  /**
   * Check if medications are high-risk
   */
  private async checkHighRiskMedications(medicineIds: string[]): Promise<boolean> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/pharmacy/medicines/check-high-risk`, {
        medicine_ids: medicineIds
      }, {
        headers: this.getHeaders()
      });

      return response.data.is_high_risk || false;
    } catch (error) {
      console.error('Error checking high-risk medications:', error);
      return false;
    }
  }

  /**
   * Update order status based on items
   */
  private async updateOrderStatus(orderId: string): Promise<void> {
    try {
      await axios.post(`${this.getBaseUrl()}/api/pharmacy/orders/${orderId}/update-status`, {}, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  /**
   * Log stock movement
   */
  private async logStockMovement(movementData: any): Promise<void> {
    try {
      await axios.post(`${this.getBaseUrl()}/api/pharmacy/stock-movements`, movementData, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Error logging stock movement:', error);
    }
  }

  /**
   * Track consumption for analytics
   */
  private async trackConsumption(medicineId: string, quantity: number, locationId: string): Promise<void> {
    try {
      await axios.post(`${this.getBaseUrl()}/api/pharmacy/consumption`, {
        medicine_id: medicineId,
        quantity_consumed: quantity,
        location_id: locationId
      }, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Error tracking consumption:', error);
    }
  }
}

export const pharmacyService = new PharmacyService();
export default pharmacyService;