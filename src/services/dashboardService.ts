import axios from 'axios';
import type { DashboardStats, ChartData } from '../config/supabase';
import type { HospitalStats, RevenueBreakdown, DashboardMetrics, PaymentModeBreakdown, TransactionBreakdown } from '../types/api';

export interface KPIMetrics {
  patientGrowthRate: number;
  appointmentCompletionRate: number;
  averageWaitTime: number;
  revenueGrowthRate: number;
  patientSatisfactionScore: number;
  doctorUtilizationRate: number;
  billCollectionRate: number;
  averageConsultationTime: number;
}

export interface TopPerformers {
  topDoctors: Array<{
    id: string;
    name: string;
    appointmentsCompleted: number;
    revenue: number;
  }>;
  topDepartments: Array<{
    id: string;
    name: string;
    revenue: number;
    appointmentCount: number;
  }>;
}

class DashboardService {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private getBaseUrl() {
    return import.meta.env.VITE_API_URL || '';
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<HospitalStats> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/dashboard/stats`, {
        headers: this.getHeaders()
      });

      return response.data as HospitalStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get chart data for dashboard
   */
  async getChartData(): Promise<ChartData> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/dashboard/charts`, {
        headers: this.getHeaders()
      });

      return response.data as any;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  /**
   * Get KPI metrics
   */
  async getKPIMetrics(): Promise<KPIMetrics> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/dashboard/kpi`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  }

  /**
   * Get top performers
   */
  async getTopPerformers(): Promise<TopPerformers> {
    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/dashboard/top-performers`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time dashboard updates (DISABLED for REST API)
   */
  subscribeToUpdates(callback: () => void) {
    console.warn('⚠️ Real-time subscriptions not supported with REST API');
    console.log('💡 Consider implementing polling or WebSocket connections');
    
    // Optional: Implement polling
    const pollInterval = setInterval(() => {
      callback();
    }, 30000); // Poll every 30 seconds

    // Return cleanup function
    return () => {
      clearInterval(pollInterval);
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;