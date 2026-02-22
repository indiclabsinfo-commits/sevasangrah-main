// =====================================================
// HRM SERVICE LAYER — Direct Supabase (no backend needed)
// Hospital CRM Pro - Human Resource Management
// =====================================================

import { getSupabase } from '../lib/supabaseClient';
import type {
  Employee,
  EmployeeFormData,
  EmployeeDepartment,
  EmployeeRole,
  EmployeeAttendance,
  AttendanceFormData,
  EmployeeLeave,
  LeaveFormData,
  LeaveType,
  EmployeeLeaveBalance,
  EmployeePayroll,
  PayrollFormData,
  EmployeePerformance,
  EmployeeSchedule,
  HRMDashboardStats,
  AttendanceSummary,
  EmployeeFilters,
  AttendanceFilters,
  LeaveFilters,
  PayrollFilters,
} from '../types/hrm';

const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';

class HRMService {

  private async sb() {
    return getSupabase();
  }

  // =====================================================
  // EMPLOYEE MANAGEMENT
  // =====================================================

  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    try {
      const supabase = await this.sb();
      let query = supabase
        .from('employee_master')
        .select('*, department:department_master(id, department_name, department_code)')
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false });

      if (filters?.department_id) query = query.eq('department_id', filters.department_id);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,work_email.ilike.%${filters.search}%,staff_unique_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(emp => ({
        ...emp,
        employee_id: emp.staff_unique_id,
        email: emp.work_email,
        phone: emp.personal_phone,
        joining_date: emp.date_of_joining,
        designation: emp.job_title,
        employment_type: emp.employment_status,
        pan_number: emp.pan_card_number,
      }));
    } catch (error: any) {
      console.warn('HRM: Employee fetch failed:', error.message);
      return [];
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_master')
        .select('*, department:department_master(id, department_name, department_code)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        employee_id: data.staff_unique_id,
        email: data.work_email,
        phone: data.personal_phone,
        joining_date: data.date_of_joining,
        designation: data.job_title,
        employment_type: data.employment_status,
        pan_number: data.pan_card_number,
      } as Employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async createEmployee(employeeData: EmployeeFormData): Promise<Employee> {
    const supabase = await this.sb();
    const dbData: any = {
      hospital_id: HOSPITAL_ID,
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      work_email: employeeData.email || employeeData.work_email,
      personal_phone: employeeData.phone || employeeData.personal_phone,
      date_of_joining: employeeData.joining_date || employeeData.date_of_joining,
      job_title: employeeData.designation || employeeData.job_title,
      department_id: employeeData.department_id,
      employment_status: employeeData.employment_type || employeeData.employment_status || 'Active',
      staff_unique_id: employeeData.employee_id || employeeData.staff_unique_id,
      gender: employeeData.gender,
      date_of_birth: employeeData.date_of_birth,
      aadhar_number: employeeData.aadhar_number,
      pan_card_number: employeeData.pan_number || employeeData.pan_card_number,
      bank_account_number: employeeData.bank_account_number,
      bank_name: employeeData.bank_name,
      ifsc_code: employeeData.ifsc_code,
      address: employeeData.address,
      city: employeeData.city,
      state: employeeData.state,
      pincode: employeeData.pincode,
      blood_group: employeeData.blood_group,
      emergency_contact_name: employeeData.emergency_contact_name,
      emergency_contact_phone: employeeData.emergency_contact_phone,
      emergency_contact_relation: employeeData.emergency_contact_relation,
      is_active: true,
    };

    // Remove undefined values
    Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

    const { data, error } = await supabase
      .from('employee_master')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data as Employee;
  }

  async updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Promise<Employee> {
    const supabase = await this.sb();
    const dbData: any = {};

    // Map frontend field names to DB column names
    const fieldMap: Record<string, string> = {
      email: 'work_email', phone: 'personal_phone', joining_date: 'date_of_joining',
      designation: 'job_title', employment_type: 'employment_status',
      pan_number: 'pan_card_number', employee_id: 'staff_unique_id',
    };

    for (const [key, value] of Object.entries(employeeData)) {
      if (value !== undefined) {
        dbData[fieldMap[key] || key] = value;
      }
    }

    const { data, error } = await supabase
      .from('employee_master')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Employee;
  }

  async deactivateEmployee(id: string, reason?: string): Promise<void> {
    const supabase = await this.sb();
    const { error } = await supabase
      .from('employee_master')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  }

  async generateEmployeeId(): Promise<string> {
    try {
      const supabase = await this.sb();
      const { data } = await supabase
        .from('employee_master')
        .select('staff_unique_id')
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].staff_unique_id) {
        const lastId = data[0].staff_unique_id;
        const num = parseInt(lastId.replace(/\D/g, '')) || 0;
        return `EMP${String(num + 1).padStart(4, '0')}`;
      }
      return 'EMP0001';
    } catch {
      return 'EMP0001';
    }
  }

  // =====================================================
  // DEPARTMENT MANAGEMENT
  // =====================================================

  async getDepartments(): Promise<EmployeeDepartment[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('department_master')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('department_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async createDepartment(department: Omit<EmployeeDepartment, 'id' | 'created_at' | 'updated_at' | 'hospital_id'>): Promise<EmployeeDepartment> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('department_master')
      .insert({
        ...department,
        hospital_id: HOSPITAL_ID,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeDepartment;
  }

  async deleteDepartment(id: string): Promise<void> {
    const supabase = await this.sb();
    const { error } = await supabase
      .from('department_master')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================

  async getRoles(): Promise<EmployeeRole[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_roles')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .order('role_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  async createRole(role: Omit<EmployeeRole, 'id' | 'created_at' | 'updated_at' | 'hospital_id'>): Promise<EmployeeRole> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_roles')
      .insert({ ...role, hospital_id: HOSPITAL_ID })
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeRole;
  }

  // =====================================================
  // ATTENDANCE MANAGEMENT
  // =====================================================

  async getAttendance(filters?: AttendanceFilters): Promise<EmployeeAttendance[]> {
    try {
      const supabase = await this.sb();
      let query = supabase
        .from('attendance_logs')
        .select('*, employee:employee_master(id, first_name, last_name, staff_unique_id, department_id)')
        .order('attendance_date', { ascending: false });

      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.date) query = query.eq('attendance_date', filters.date);
      if (filters?.start_date) query = query.gte('attendance_date', filters.start_date);
      if (filters?.end_date) query = query.lte('attendance_date', filters.end_date);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  }

  async markAttendance(attendanceData: AttendanceFormData): Promise<EmployeeAttendance> {
    if (!attendanceData.employee_id?.trim()) throw new Error('Employee ID is required');

    const supabase = await this.sb();
    const today = attendanceData.date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_logs')
      .upsert({
        employee_id: attendanceData.employee_id,
        attendance_date: today,
        status: attendanceData.status || 'Present',
        check_in_time: attendanceData.check_in_time ? `${today}T${attendanceData.check_in_time}` : null,
        check_out_time: attendanceData.check_out_time ? `${today}T${attendanceData.check_out_time}` : null,
        remarks: attendanceData.remarks,
      }, { onConflict: 'employee_id,attendance_date' })
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeAttendance;
  }

  async getAttendanceSummary(startDate: string, endDate: string): Promise<AttendanceSummary[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('attendance_date, status')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (error) throw error;
      // Group by date
      const grouped: Record<string, any> = {};
      (data || []).forEach((row: any) => {
        const d = row.attendance_date;
        if (!grouped[d]) grouped[d] = { date: d, present: 0, absent: 0, late: 0, half_day: 0 };
        const status = (row.status || '').toLowerCase();
        if (status === 'present') grouped[d].present++;
        else if (status === 'absent') grouped[d].absent++;
        else if (status === 'late') grouped[d].late++;
        else if (status === 'half day' || status === 'half_day') grouped[d].half_day++;
      });
      return Object.values(grouped);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      return [];
    }
  }

  async getAttendanceLogs(employeeId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .order('attendance_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      return [];
    }
  }

  async getRecentAttendance(employeeId: string, days: number = 7): Promise<any[]> {
    return this.getAttendanceLogs(employeeId);
  }

  // =====================================================
  // LEAVE MANAGEMENT
  // =====================================================

  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('leave_name');

      if (error) throw error;
      return (data || []).map((lt: any) => ({
        id: lt.id,
        code: lt.leave_code,
        name: lt.leave_name,
        description: lt.description,
        max_days: lt.max_days_per_year,
      }));
    } catch (error: any) {
      console.warn('HRM: Using mock leave types:', error.message);
      return [
        { id: '1', code: 'CL', name: 'Casual Leave', description: 'For personal work', max_days: 12 },
        { id: '2', code: 'SL', name: 'Sick Leave', description: 'Medical leave', max_days: 15 },
        { id: '3', code: 'EL', name: 'Earned Leave', description: 'Accumulated leave', max_days: 30 },
        { id: '4', code: 'ML', name: 'Maternity Leave', description: 'For pregnancy', max_days: 180 },
        { id: '5', code: 'PL', name: 'Paternity Leave', description: 'For new fathers', max_days: 15 },
      ];
    }
  }

  async getLeaves(filters?: LeaveFilters): Promise<EmployeeLeave[]> {
    try {
      const supabase = await this.sb();
      let query = supabase
        .from('leave_applications')
        .select('*, employee:employee_master(id, first_name, last_name, staff_unique_id), leave_type:leave_types(id, leave_name, leave_code)')
        .order('created_at', { ascending: false });

      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaves:', error);
      return [];
    }
  }

  async applyLeave(leaveData: LeaveFormData): Promise<EmployeeLeave> {
    if (!leaveData.employee_id?.trim()) throw new Error('Employee ID is required');
    if (!leaveData.leave_type_id?.trim()) throw new Error('Leave type is required');

    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('leave_applications')
      .insert({
        employee_id: leaveData.employee_id,
        leave_type_id: leaveData.leave_type_id,
        start_date: leaveData.start_date,
        end_date: leaveData.end_date,
        reason: leaveData.reason,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeLeave;
  }

  async updateLeaveStatus(leaveId: string, status: 'Approved' | 'Rejected', approverId: string, rejectionReason?: string): Promise<EmployeeLeave> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('leave_applications')
      .update({ status })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeLeave;
  }

  async getLeaveBalance(employeeId: string, year?: number): Promise<any> {
    try {
      const supabase = await this.sb();
      const currentYear = year || new Date().getFullYear();
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*, leave_type:leave_types(leave_code, leave_name)')
        .eq('employee_id', employeeId)
        .eq('year', currentYear);

      if (error) throw error;
      const balance: any = {};
      (data || []).forEach((item: any) => {
        if (item.leave_type?.leave_code) {
          balance[item.leave_type.leave_code] = (item.total_allocated || 0) - (item.used || 0);
        }
      });
      return Object.keys(balance).length > 0 ? balance : { CL: 12, SL: 15, EL: 30, ML: 180, PL: 15 };
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      return { CL: 12, SL: 15, EL: 30, ML: 180, PL: 15 };
    }
  }

  async createLeaveApplication(leaveData: any): Promise<any> {
    return this.applyLeave(leaveData);
  }

  async getRecentLeaves(employeeId: string, limit: number = 5): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('leave_applications')
        .select('*, leave_type:leave_types(leave_name, leave_code)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent leaves:', error);
      return [];
    }
  }

  async getHolidays(): Promise<any[]> {
    return [];
  }

  // =====================================================
  // SHIFT MANAGEMENT
  // =====================================================

  async getShifts(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('shift_master')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .order('shift_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shifts:', error);
      return [];
    }
  }

  async createShift(shiftData: any): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('shift_master')
      .insert({ ...shiftData, hospital_id: HOSPITAL_ID })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateShift(id: string, shiftData: any): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('shift_master')
      .update(shiftData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async requestShiftSwap(data: any): Promise<any> {
    const supabase = await this.sb();
    const { data: result, error } = await supabase
      .from('shift_swap_requests')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // =====================================================
  // PAYROLL MANAGEMENT
  // =====================================================

  async getPayroll(filters?: PayrollFilters): Promise<EmployeePayroll[]> {
    try {
      const supabase = await this.sb();
      let query = supabase
        .from('employee_payroll')
        .select('*, employee:employee_master(id, first_name, last_name, staff_unique_id)')
        .order('created_at', { ascending: false });

      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.month) query = query.eq('month', filters.month);
      if (filters?.year) query = query.eq('year', filters.year);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll:', error);
      return [];
    }
  }

  async generatePayroll(payrollData: PayrollFormData): Promise<EmployeePayroll> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_payroll')
      .insert(payrollData)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeePayroll;
  }

  async updatePayrollStatus(payrollId: string, status: 'Processed' | 'Paid', processedBy: string): Promise<EmployeePayroll> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_payroll')
      .update({ status })
      .eq('id', payrollId)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeePayroll;
  }

  async createPayrollCycle(month: number, year: number, workingDays: number): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('payroll_cycles')
      .insert({ month, year, working_days: workingDays, status: 'Draft', hospital_id: HOSPITAL_ID })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async processPayroll(cycleId: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('payroll_cycles')
      .update({ status: 'Processed' })
      .eq('id', cycleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPayrollCycles(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('payroll_cycles')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .order('year', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll cycles:', error);
      return [];
    }
  }

  async getEmployeePayrolls(cycleId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_payroll')
        .select('*, employee:employee_master(id, first_name, last_name, staff_unique_id)')
        .eq('cycle_id', cycleId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee payrolls:', error);
      return [];
    }
  }

  async generatePayslipData(payrollId: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_payroll')
      .select('*, employee:employee_master(*), cycle:payroll_cycles(*)')
      .eq('id', payrollId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUpcomingPayslips(employeeId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_payroll')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming payslips:', error);
      return [];
    }
  }

  // =====================================================
  // PERFORMANCE REVIEWS
  // =====================================================

  async getPerformanceReviews(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*, employee:employee_master(id, first_name, last_name, staff_unique_id)')
        .order('review_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      return [];
    }
  }

  // =====================================================
  // TRAINING
  // =====================================================

  async getTrainingPrograms(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching training programs:', error);
      return [];
    }
  }

  async registerForTraining(trainingId: string, employeeId: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('training_participants')
      .insert({ training_id: trainingId, employee_id: employeeId, status: 'Registered' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // RECRUITMENT
  // =====================================================

  async getJobPostings(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching job postings:', error);
      return [];
    }
  }

  async getCandidates(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  }

  // =====================================================
  // ANNOUNCEMENTS
  // =====================================================

  async getAnnouncements(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  async createAnnouncement(announcementData: any): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('announcements')
      .insert({ ...announcementData, hospital_id: HOSPITAL_ID })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // EXIT MANAGEMENT
  // =====================================================

  async getExitRequests(): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_exits')
        .select('*, employee:employee_master(id, first_name, last_name, staff_unique_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exit requests:', error);
      return [];
    }
  }

  async getExitChecklist(exitId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('exit_checklist')
        .select('*')
        .eq('exit_id', exitId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exit checklist:', error);
      return [];
    }
  }

  async initiateExit(exitData: any): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_exits')
      .insert(exitData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateExitStatus(exitId: string, status: string, userId?: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_exits')
      .update({ status })
      .eq('id', exitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateChecklistItem(itemId: string, status: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('exit_checklist')
      .update({ status })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // ONBOARDING
  // =====================================================

  async getEmployeeOnboarding(employeeId: string): Promise<any> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_onboarding')
        .select('*, tasks:onboarding_tasks(*)')
        .eq('employee_id', employeeId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error fetching onboarding:', error);
      return null;
    }
  }

  async initiateOnboarding(employeeId: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('employee_onboarding')
      .insert({
        employee_id: employeeId,
        start_date: new Date().toISOString().split('T')[0],
        status: 'In Progress',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOnboardingTask(taskId: string, status: string): Promise<any> {
    const supabase = await this.sb();
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // EMPLOYEE DETAILS (family, education, documents)
  // =====================================================

  async getEmployeeFamily(employeeId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_family')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee family:', error);
      return [];
    }
  }

  async getEmployeeEducation(employeeId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_education')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee education:', error);
      return [];
    }
  }

  async getEmployeeDocuments(employeeId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      return [];
    }
  }

  async addFamilyMember(memberData: any): Promise<any> {
    const supabase = await this.sb();
    const employeeId = memberData.employee_id || memberData.employeeId;
    const { data, error } = await supabase
      .from('employee_family')
      .insert({ ...memberData, employee_id: employeeId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addEducation(educationData: any): Promise<any> {
    const supabase = await this.sb();
    const employeeId = educationData.employee_id || educationData.employeeId;
    const { data, error } = await supabase
      .from('employee_education')
      .insert({ ...educationData, employee_id: employeeId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addDocument(documentData: any): Promise<any> {
    const supabase = await this.sb();
    const employeeId = documentData.employee_id || documentData.employeeId;
    const { data, error } = await supabase
      .from('employee_documents')
      .insert({ ...documentData, employee_id: employeeId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  async getNotifications(employeeId: string): Promise<any[]> {
    try {
      const supabase = await this.sb();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  async getDashboardStats(): Promise<HRMDashboardStats> {
    try {
      const supabase = await this.sb();
      const today = new Date().toISOString().split('T')[0];

      const [empResult, activeResult, presentResult, absentResult, leaveResult, pendingResult, deptResult] = await Promise.all([
        supabase.from('employee_master').select('id', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID),
        supabase.from('employee_master').select('id', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID).eq('is_active', true),
        supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('attendance_date', today).eq('status', 'Present'),
        supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('attendance_date', today).eq('status', 'Absent'),
        supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'Approved').lte('start_date', today).gte('end_date', today),
        supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('department_master').select('id', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID).eq('is_active', true),
      ]);

      return {
        total_employees: empResult.count || 0,
        active_employees: activeResult.count || 0,
        present_today: presentResult.count || 0,
        absent_today: absentResult.count || 0,
        on_leave: leaveResult.count || 0,
        pending_leaves: pendingResult.count || 0,
        departments: deptResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { total_employees: 0, active_employees: 0, present_today: 0, absent_today: 0, on_leave: 0, pending_leaves: 0, departments: 0 };
    }
  }

  // =====================================================
  // ALIASES (used by sub-components)
  // =====================================================

  async getEmployeeMasters(filters?: EmployeeFilters): Promise<Employee[]> { return this.getEmployees(filters); }
  async getEmployeeMasterById(id: string): Promise<Employee | null> { return this.getEmployeeById(id); }
  async updateEmployeeMaster(id: string, data: Partial<EmployeeFormData>): Promise<Employee> { return this.updateEmployee(id, data); }
  async createEmployeeMaster(data: EmployeeFormData): Promise<Employee> { return this.createEmployee(data); }
  async generateStaffUniqueId(): Promise<string> { return this.generateEmployeeId(); }
}

export const hrmService = new HRMService();
export default hrmService;
