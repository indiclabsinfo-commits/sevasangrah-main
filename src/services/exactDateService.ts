import { getSupabase } from '../lib/supabaseClient';
import type { PatientWithRelations, PatientTransaction, PatientAdmission } from '../config/supabaseNew';

export class ExactDateService {

  static async getPatientsForExactDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      const supabase = await getSupabase();
      console.log('🔍 Getting patients for exact date via Supabase:', dateStr);

      // Start of day and end of day for the given date
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      // Query patients who were created on this date OR have transactions/admissions on this date
      // For simplicity/performance in this direct mode, let's primarily look at patients created or updated
      // But a comprehensive "Patient List" usually expects purely registration date or visit date.
      // Let's query patients created within the date range first, as that's the primary "List" view.

      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          *,
          patient_transactions!patient_transactions_patient_id_fkey (*),
          patient_admissions (*)
        `)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      console.log(`✅ Retrieved ${patients?.length || 0} patients for ${dateStr}`);

      return (patients || []).map(this.enhancePatientData);

    } catch (error: any) {
      console.error('❌ Error getting patients for exact date:', error);
      return [];
    }
  }

  static async getPatientsForDateRange(startDateStr: string, endDateStr: string): Promise<PatientWithRelations[]> {
    try {
      const supabase = await getSupabase();
      console.log('🔍 getPatientsForDateRange via Supabase:', { startDateStr, endDateStr });

      // Adjust end date to include the full day
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);

      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          *,
          patient_transactions!patient_transactions_patient_id_fkey (*),
          patient_admissions (*)
        `)
        .gte('created_at', new Date(startDateStr).toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`📊 Retrieved ${patients?.length || 0} patients for date range`);

      return (patients || []).map(this.enhancePatientData);

    } catch (error: any) {
      console.error('❌ Error getting patients for date range:', error);
      return [];
    }
  }

  static async getPatientRefunds(startDateStr: string, endDateStr: string): Promise<any[]> {
    try {
      const supabase = await getSupabase();
      console.log('🔍 getPatientRefunds via Supabase:', { startDateStr, endDateStr });

      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);

      const { data: refunds, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patients!patient_transactions_patient_id_fkey (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('transaction_type', 'REFUND')
        .gte('created_at', new Date(startDateStr).toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`💸 Retrieved ${refunds?.length || 0} refunds for date range`);
      return refunds || [];

    } catch (error: any) {
      console.error('❌ Error getting patient refunds:', error);
      return [];
    }
  }

  // Helper to enhance patient data with calculated fields
  private static enhancePatientData(patient: any): PatientWithRelations {
    const transactions = patient.patient_transactions || [];
    const admissions = patient.patient_admissions || [];

    // Only count completed transactions (exclude cancelled)
    const totalSpent = transactions
      .filter((t: any) => t.status !== 'CANCELLED')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    // Count patient entries/registrations and consultations
    const registrationVisits = transactions.filter((t: any) =>
      (t.transaction_type === 'ENTRY_FEE' ||
        t.transaction_type === 'entry_fee' ||
        t.transaction_type === 'CONSULTATION' ||
        t.transaction_type === 'consultation' ||
        t.transaction_type === 'LAB_TEST' ||
        t.transaction_type === 'XRAY' ||
        t.transaction_type === 'PROCEDURE') &&
      t.status !== 'CANCELLED'
    ).length;

    const visitCount = Math.max(registrationVisits, 1);

    // Get last transaction/visit date safely
    let lastTransactionDate: Date;
    try {
      const validDates = transactions
        .map((t: any) => t.created_at || t.transaction_date)
        .filter(Boolean)
        .map((d: string) => new Date(d).getTime())
        .filter(t => !isNaN(t));

      lastTransactionDate = validDates.length > 0
        ? new Date(Math.max(...validDates))
        : new Date(patient.created_at || new Date());
    } catch (e) {
      lastTransactionDate = new Date();
    }

    return {
      ...patient,
      transactions, // Keep raw relations if needed
      admissions,
      totalSpent,
      visitCount,
      lastVisit: lastTransactionDate.toISOString().split('T')[0],
      departmentStatus: patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' as const : 'OPD' as const
    };
  }
}