// Billing Service for managing OPD and IPD bills across components
import axios from 'axios';
import { logger } from '../utils/logger';

export interface OPDBill {
  id: string;
  billId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  services: string[];
  consultationFee: number;
  investigationCharges: number;
  medicineCharges: number;
  otherCharges: number;
  discount: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  billDate: string;
  paymentMode?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
}

export interface StaySegment {
  id: string;
  roomType: 'GENERAL_WARD' | 'ICU' | 'DELUXE_ROOM' | 'PRIVATE_ROOM' | 'SEMI_PRIVATE';
  startDate: string;
  endDate: string;
  bedCharge: number;
  rmoCharge: number;
  nursingCharge: number;
  days: number;
  totalCharge: number;
}

export interface IPDService {
  name: string;
  selected: boolean;
  amount: number;
}

export interface IPDBill {
  id: string;
  billId: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  dischargeDate: string;
  admissionCharges: number;
  staySegments: StaySegment[];
  services: IPDService[];
  totalStayCharges: number;
  totalServiceCharges: number;
  discount?: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  billDate: string;
  paymentMode?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
}

export interface RecentBill {
  id: string;
  billId: string;
  patientName: string;
  type: 'OPD' | 'IPD';
  amount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  date: string;
}

export interface BillingSummary {
  totalRevenue: number;
  opdBills: number;
  ipdBills: number;
  pendingBills: number;
}

class BillingService {
  
  // Helper methods
  private static getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private static getBaseUrl() {
    return import.meta.env.VITE_API_URL || '';
  }
  
  // Event listeners for bill updates
  private static listeners: Array<() => void> = [];

  // Subscribe to billing updates
  static subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of updates
  private static notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // OPD Bills Management
  static async getOPDBills(): Promise<OPDBill[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/billing/opd`, {
        headers: this.getHeaders()
      });
      
      return response.data || [];
    } catch (error) {
      logger.error('Failed to load OPD bills:', error);
      return [];
    }
  }

  static async saveOPDBill(bill: OPDBill): Promise<void> {
    try {
      if (bill.id) {
        // Update existing bill
        await axios.put(`${this.getBaseUrl()}/api/billing/opd/${bill.id}`, bill, {
          headers: this.getHeaders()
        });
        logger.log('📝 Updated existing OPD bill:', bill.billId);
      } else {
        // Create new bill
        await axios.post(`${this.getBaseUrl()}/api/billing/opd`, bill, {
          headers: this.getHeaders()
        });
        logger.log('➕ Added new OPD bill:', bill.billId);
      }
      
      this.notifyListeners();
      logger.log('📢 Notified listeners of OPD bill change');
    } catch (error) {
      logger.error('Failed to save OPD bill:', error);
      throw new Error('Failed to save OPD bill');
    }
  }

  static async deleteOPDBill(billId: string): Promise<void> {
    try {
      await axios.delete(`${this.getBaseUrl()}/api/billing/opd/${billId}`, {
        headers: this.getHeaders()
      });
      
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to delete OPD bill:', error);
      throw new Error('Failed to delete OPD bill');
    }
  }

  // IPD Bills Management
  static async getIPDBills(): Promise<IPDBill[]> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/billing/ipd`, {
        headers: this.getHeaders()
      });
      
      return response.data || [];
    } catch (error) {
      logger.error('Failed to load IPD bills:', error);
      return [];
    }
  }

  static async saveIPDBill(bill: IPDBill): Promise<void> {
    try {
      if (bill.id) {
        // Update existing bill
        await axios.put(`${this.getBaseUrl()}/api/billing/ipd/${bill.id}`, bill, {
          headers: this.getHeaders()
        });
      } else {
        // Create new bill
        await axios.post(`${this.getBaseUrl()}/api/billing/ipd`, bill, {
          headers: this.getHeaders()
        });
      }
      
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to save IPD bill:', error);
      throw new Error('Failed to save IPD bill');
    }
  }

  static async deleteIPDBill(billId: string): Promise<void> {
    try {
      await axios.delete(`${this.getBaseUrl()}/api/billing/ipd/${billId}`, {
        headers: this.getHeaders()
      });
      
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to delete IPD bill:', error);
      throw new Error('Failed to delete IPD bill');
    }
  }

  // Combined Bills Data
  static async getAllRecentBills(): Promise<RecentBill[]> {
    try {
      logger.log('🔍 Getting all recent bills from backend...');
      
      const response = await axios.get(`${this.getBaseUrl()}/api/billing/recent`, {
        headers: this.getHeaders()
      });

      const recentBills = response.data || [];
      logger.log('📋 Total recent bills:', recentBills.length);
      
      return recentBills;
    } catch (error) {
      logger.error('Failed to load recent bills:', error);
      return [];
    }
  }

  // Dashboard Summary
  static async getBillingSummary(): Promise<BillingSummary> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/billing/summary`, {
        headers: this.getHeaders()
      });

      return response.data || {
        totalRevenue: 0,
        opdBills: 0,
        ipdBills: 0,
        pendingBills: 0
      };
    } catch (error) {
      logger.error('Failed to load billing summary:', error);
      return {
        totalRevenue: 0,
        opdBills: 0,
        ipdBills: 0,
        pendingBills: 0
      };
    }
  }

  // Generate Bill ID
  static async generateOPDBillId(): Promise<string> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/billing/opd/next-id`, {
        headers: this.getHeaders()
      });
      
      return response.data.billId;
    } catch (error) {
      logger.error('Failed to generate OPD bill ID:', error);
      // Fallback
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000);
      return `OPD-${year}-${String(random).padStart(4, '0')}`;
    }
  }

  static async generateIPDBillId(): Promise<string> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/billing/ipd/next-id`, {
        headers: this.getHeaders()
      });
      
      return response.data.billId;
    } catch (error) {
      logger.error('Failed to generate IPD bill ID:', error);
      // Fallback
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000);
      return `IPD-${year}-${String(random).padStart(4, '0')}`;
    }
  }

  // Clear all bills (for development/testing)
  static async clearAllBills(): Promise<void> {
    try {
      await axios.delete(`${this.getBaseUrl()}/api/billing/clear-all`, {
        headers: this.getHeaders()
      });
      
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to clear all bills:', error);
      throw new Error('Failed to clear all bills');
    }
  }
}

export default BillingService;