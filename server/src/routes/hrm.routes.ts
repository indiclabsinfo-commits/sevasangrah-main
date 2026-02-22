import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/knex';
import { env } from '../config/env';

const router = Router();
const HOSPITAL_ID = env.HOSPITAL_ID;

// Helper: send JSON directly (frontend hrmService expects raw data, not wrapped)
const ok = (res: Response, data: any, status = 200) => res.status(status).json(data);
const fail = (res: Response, msg: string, status = 500) => res.status(status).json({ error: msg });

// =====================================================
// DASHBOARD STATS
// =====================================================
router.get('/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [total] = await db('employee_master').where('hospital_id', HOSPITAL_ID).count('id as count');
    const [active] = await db('employee_master').where({ hospital_id: HOSPITAL_ID, is_active: true }).count('id as count');
    const [present] = await db('attendance_logs').where({ hospital_id: HOSPITAL_ID, date: today, status: 'Present' }).count('id as count');
    const [absent] = await db('attendance_logs').where({ hospital_id: HOSPITAL_ID, date: today, status: 'Absent' }).count('id as count');
    const [onLeave] = await db('leave_applications').where('status', 'Approved').where('start_date', '<=', today).where('end_date', '>=', today).count('id as count');
    const [pendingLeaves] = await db('leave_applications').where({ status: 'Pending' }).count('id as count');
    const [depts] = await db('department_master').where({ hospital_id: HOSPITAL_ID, is_active: true }).count('id as count');

    return ok(res, {
      total_employees: Number(total.count),
      active_employees: Number(active.count),
      present_today: Number(present.count),
      absent_today: Number(absent.count),
      on_leave_today: Number(onLeave.count),
      pending_leave_requests: Number(pendingLeaves.count),
      departments_count: Number(depts.count),
      totalEmployees: Number(total.count),
      onLeaveToday: Number(onLeave.count),
      pendingLeaves: Number(pendingLeaves.count),
      payrollDue: 0,
    });
  } catch (err: any) {
    return fail(res, err.message);
  }
});

// =====================================================
// EMPLOYEES
// =====================================================

// Generate next employee ID - MUST be before /:id
router.get('/employees/next-id', async (_req: Request, res: Response) => {
  try {
    const last = await db('employee_master')
      .where('hospital_id', HOSPITAL_ID)
      .orderBy('created_at', 'desc')
      .first();

    let nextNum = 1;
    if (last?.staff_unique_id) {
      const match = last.staff_unique_id.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    return ok(res, { employee_id: `EMP${String(nextNum).padStart(4, '0')}`, staff_unique_id: `EMP${String(nextNum).padStart(4, '0')}` });
  } catch (err: any) {
    return ok(res, { employee_id: 'EMP0001', staff_unique_id: 'EMP0001' });
  }
});

// List employees
router.get('/employees', async (req: Request, res: Response) => {
  try {
    const { department_id, is_active, search } = req.query;
    let query = db('employee_master').where('hospital_id', HOSPITAL_ID);

    if (department_id) query = query.where('department_id', department_id as string);
    if (is_active !== undefined) query = query.where('is_active', is_active === 'true');
    if (search) {
      query = query.where(function () {
        this.whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('staff_unique_id', `%${search}%`)
          .orWhereILike('work_email', `%${search}%`);
      });
    }

    const employees = await query.orderBy('created_at', 'desc');
    // Map DB columns to frontend field names
    const mapped = employees.map((e: any) => ({
      ...e,
      employee_id: e.staff_unique_id,
      email: e.work_email,
      phone: e.personal_phone,
      joining_date: e.date_of_joining,
      designation: e.job_title,
      employment_type: e.employment_status,
      pan_number: e.pan_card_number,
    }));
    return ok(res, mapped);
  } catch (err: any) {
    return fail(res, err.message);
  }
});

// Get single employee
router.get('/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await db('employee_master').where('id', req.params.id).where('hospital_id', HOSPITAL_ID).first();
    if (!employee) return fail(res, 'Employee not found', 404);
    return ok(res, {
      ...employee,
      employee_id: employee.staff_unique_id,
      email: employee.work_email,
      phone: employee.personal_phone,
      joining_date: employee.date_of_joining,
      designation: employee.job_title,
      employment_type: employee.employment_status,
      pan_number: employee.pan_card_number,
    });
  } catch (err: any) {
    return fail(res, err.message);
  }
});

// Create employee
router.post('/employees', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const body = req.body;
    const data: any = {
      id,
      hospital_id: HOSPITAL_ID,
      staff_unique_id: body.staff_unique_id || body.employee_id || `EMP${Date.now().toString(36)}`,
      first_name: body.first_name,
      last_name: body.last_name,
      employment_status: body.employment_type || body.employment_status || 'Permanent',
      job_title: body.designation || body.job_title || 'Staff',
      department_id: body.department_id || null,
      role_id: body.role_id || null,
      date_of_joining: body.joining_date || body.date_of_joining || new Date(),
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || 'Male',
      work_email: body.email || body.work_email || null,
      personal_phone: body.phone || body.personal_phone || null,
      residential_address: body.residential_address || body.address || null,
      basic_salary: body.basic_salary || 0,
      bank_account_number: body.bank_account_number || null,
      pan_card_number: body.pan_number || body.pan_card_number || null,
      aadhaar_number: body.aadhaar_number || null,
      bank_name: body.bank_name || null,
      ifsc_code: body.ifsc_code || null,
      blood_group: body.blood_group || null,
      city: body.city || null,
      state: body.state || null,
      pincode: body.pincode || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      emergency_contact_relation: body.emergency_contact_relation || null,
      reporting_manager_id: body.reporting_manager_id || null,
      photo_url: body.photo_url || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db('employee_master').insert(data);
    const employee = await db('employee_master').where('id', id).first();
    return ok(res, { ...employee, employee_id: employee.staff_unique_id }, 201);
  } catch (err: any) {
    return fail(res, err.message);
  }
});

// Update employee
router.put('/employees/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const updates: any = { updated_at: new Date() };
    // Map frontend field names to DB columns
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.email !== undefined) updates.work_email = body.email;
    if (body.work_email !== undefined) updates.work_email = body.work_email;
    if (body.phone !== undefined) updates.personal_phone = body.phone;
    if (body.personal_phone !== undefined) updates.personal_phone = body.personal_phone;
    if (body.designation !== undefined) updates.job_title = body.designation;
    if (body.job_title !== undefined) updates.job_title = body.job_title;
    if (body.employment_type !== undefined) updates.employment_status = body.employment_type;
    if (body.employment_status !== undefined) updates.employment_status = body.employment_status;
    if (body.department_id !== undefined) updates.department_id = body.department_id;
    if (body.role_id !== undefined) updates.role_id = body.role_id;
    if (body.joining_date !== undefined) updates.date_of_joining = body.joining_date;
    if (body.date_of_joining !== undefined) updates.date_of_joining = body.date_of_joining;
    if (body.date_of_birth !== undefined) updates.date_of_birth = body.date_of_birth;
    if (body.gender !== undefined) updates.gender = body.gender;
    if (body.basic_salary !== undefined) updates.basic_salary = body.basic_salary;
    if (body.bank_account_number !== undefined) updates.bank_account_number = body.bank_account_number;
    if (body.bank_name !== undefined) updates.bank_name = body.bank_name;
    if (body.ifsc_code !== undefined) updates.ifsc_code = body.ifsc_code;
    if (body.pan_number !== undefined) updates.pan_card_number = body.pan_number;
    if (body.pan_card_number !== undefined) updates.pan_card_number = body.pan_card_number;
    if (body.aadhaar_number !== undefined) updates.aadhaar_number = body.aadhaar_number;
    if (body.residential_address !== undefined) updates.residential_address = body.residential_address;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.reporting_manager_id !== undefined) updates.reporting_manager_id = body.reporting_manager_id;
    if (body.blood_group !== undefined) updates.blood_group = body.blood_group;
    if (body.city !== undefined) updates.city = body.city;
    if (body.state !== undefined) updates.state = body.state;
    if (body.pincode !== undefined) updates.pincode = body.pincode;
    if (body.emergency_contact_name !== undefined) updates.emergency_contact_name = body.emergency_contact_name;
    if (body.emergency_contact_phone !== undefined) updates.emergency_contact_phone = body.emergency_contact_phone;
    if (body.emergency_contact_relation !== undefined) updates.emergency_contact_relation = body.emergency_contact_relation;

    await db('employee_master').where('id', req.params.id).where('hospital_id', HOSPITAL_ID).update(updates);
    const employee = await db('employee_master').where('id', req.params.id).first();
    return ok(res, employee);
  } catch (err: any) {
    return fail(res, err.message);
  }
});

// Deactivate employee
router.post('/employees/:id/deactivate', async (req: Request, res: Response) => {
  try {
    await db('employee_master').where('id', req.params.id).where('hospital_id', HOSPITAL_ID).update({
      is_active: false,
      termination_reason: req.body.reason || null,
      resignation_date: new Date(),
      updated_at: new Date(),
    });
    return ok(res, { success: true });
  } catch (err: any) {
    return fail(res, err.message);
  }
});

// =====================================================
// EMPLOYEE DETAILS (Family, Education, Documents)
// =====================================================
router.get('/employees/:id/family', async (req: Request, res: Response) => {
  try {
    const data = await db('employee_family').where('employee_id', req.params.id).where('hospital_id', HOSPITAL_ID);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/employees/:id/family', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_family').insert({ id, hospital_id: HOSPITAL_ID, employee_id: req.params.id, ...req.body, created_at: new Date(), updated_at: new Date() });
    const item = await db('employee_family').where('id', id).first();
    return ok(res, item, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/employees/:id/education', async (req: Request, res: Response) => {
  try {
    const data = await db('employee_education').where('employee_id', req.params.id).where('hospital_id', HOSPITAL_ID);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/employees/:id/education', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_education').insert({ id, hospital_id: HOSPITAL_ID, employee_id: req.params.id, ...req.body, created_at: new Date(), updated_at: new Date() });
    const item = await db('employee_education').where('id', id).first();
    return ok(res, item, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/employees/:id/documents', async (req: Request, res: Response) => {
  try {
    const data = await db('employee_documents').where('employee_id', req.params.id).where('hospital_id', HOSPITAL_ID);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/employees/:id/documents', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_documents').insert({ id, hospital_id: HOSPITAL_ID, employee_id: req.params.id, ...req.body, uploaded_at: new Date() });
    const item = await db('employee_documents').where('id', id).first();
    return ok(res, item, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// DEPARTMENTS
// =====================================================
router.get('/departments', async (_req: Request, res: Response) => {
  try {
    const data = await db('department_master').where('hospital_id', HOSPITAL_ID).where('is_active', true).orderBy('department_name');
    return ok(res, data);
  } catch (err: any) { return fail(res, err.message); }
});

router.post('/departments', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const { department_name, department_code, description } = req.body;
    // Support both {department_name} and positional args from frontend
    const name = department_name || req.body.name || req.body[0];
    const code = department_code || req.body.code || req.body[1];
    await db('department_master').insert({ id, hospital_id: HOSPITAL_ID, department_name: name, department_code: code, description: description || null, is_active: true, created_at: new Date(), updated_at: new Date() });
    const dept = await db('department_master').where('id', id).first();
    return ok(res, dept, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.delete('/departments/:id', async (req: Request, res: Response) => {
  try {
    await db('department_master').where('id', req.params.id).where('hospital_id', HOSPITAL_ID).update({ is_active: false, updated_at: new Date() });
    return ok(res, { success: true });
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// ROLES
// =====================================================
router.get('/roles', async (_req: Request, res: Response) => {
  try {
    const data = await db('employee_roles').where('hospital_id', HOSPITAL_ID).where('is_active', true);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/roles', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_roles').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const role = await db('employee_roles').where('id', id).first();
    return ok(res, role, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// ATTENDANCE
// =====================================================
router.get('/attendance', async (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date, status, date } = req.query;
    let query = db('attendance_logs').where('attendance_logs.hospital_id', HOSPITAL_ID);

    if (employee_id) query = query.where('attendance_logs.employee_id', employee_id as string);
    if (date) query = query.where('attendance_logs.date', date as string);
    if (start_date) query = query.where('attendance_logs.date', '>=', start_date as string);
    if (end_date) query = query.where('attendance_logs.date', '<=', end_date as string);
    if (status) query = query.where('attendance_logs.status', status as string);

    const data = await query
      .leftJoin('employee_master', 'attendance_logs.employee_id', 'employee_master.id')
      .select('attendance_logs.*', 'employee_master.first_name', 'employee_master.last_name', 'employee_master.staff_unique_id')
      .orderBy('attendance_logs.date', 'desc');

    return ok(res, data);
  } catch (err: any) { return fail(res, err.message); }
});

router.post('/attendance', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.employee_id) return fail(res, 'Employee ID is required', 400);

    const date = body.attendance_date || body.date || new Date().toISOString().split('T')[0];
    const id = uuidv4();

    // Upsert: delete existing + insert
    await db('attendance_logs').where({ employee_id: body.employee_id, date }).del();
    await db('attendance_logs').insert({
      id,
      hospital_id: HOSPITAL_ID,
      employee_id: body.employee_id,
      date,
      check_in_time: body.check_in_time || null,
      check_out_time: body.check_out_time || null,
      status: body.status || 'Present',
      is_late_entry: body.is_late_entry || false,
      is_early_exit: body.is_early_exit || false,
      total_work_hours: body.total_work_hours || 0,
      overtime_hours: body.overtime_hours || 0,
      remarks: body.remarks || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const record = await db('attendance_logs').where('id', id).first();
    return ok(res, record, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/attendance/summary', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    let query = db('attendance_logs').where('hospital_id', HOSPITAL_ID);
    if (start_date) query = query.where('date', '>=', start_date as string);
    if (end_date) query = query.where('date', '<=', end_date as string);

    const data = await query
      .select('date')
      .count('* as total')
      .count(db.raw("CASE WHEN status = 'Present' THEN 1 END as present"))
      .count(db.raw("CASE WHEN status = 'Absent' THEN 1 END as absent"))
      .count(db.raw("CASE WHEN status = 'Half Day' THEN 1 END as half_day"))
      .count(db.raw("CASE WHEN status = 'On Leave' THEN 1 END as on_leave"))
      .groupBy('date')
      .orderBy('date', 'desc');

    return ok(res, data);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/attendance/recent/:employeeId', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const data = await db('attendance_logs')
      .where('employee_id', req.params.employeeId)
      .where('hospital_id', HOSPITAL_ID)
      .where('date', '>=', since.toISOString().split('T')[0])
      .orderBy('date', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.get('/attendance/logs/:employeeId', async (req: Request, res: Response) => {
  try {
    const data = await db('attendance_logs')
      .where('employee_id', req.params.employeeId)
      .where('hospital_id', HOSPITAL_ID)
      .orderBy('date', 'desc')
      .limit(30);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

// =====================================================
// LEAVES
// =====================================================
router.get('/leave-types', async (_req: Request, res: Response) => {
  try {
    const data = await db('leave_types')
      .where('hospital_id', HOSPITAL_ID)
      .where('is_active', true)
      .select('id', 'leave_code as code', 'leave_name as name', 'description', 'max_days_per_year as max_days', 'is_paid', 'carry_forward_allowed', 'is_active');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.get('/leaves', async (req: Request, res: Response) => {
  try {
    const { employee_id, status } = req.query;
    let query = db('leave_applications')
      .leftJoin('employee_master', 'leave_applications.employee_id', 'employee_master.id')
      .leftJoin('leave_types', 'leave_applications.leave_type_id', 'leave_types.id')
      .select('leave_applications.*', 'employee_master.first_name', 'employee_master.last_name', 'employee_master.staff_unique_id', 'leave_types.leave_name', 'leave_types.leave_code');

    if (employee_id) query = query.where('leave_applications.employee_id', employee_id as string);
    if (status) query = query.where('leave_applications.status', status as string);

    const data = await query.orderBy('leave_applications.created_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return fail(res, err.message); }
});

router.post('/leaves', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.employee_id) return fail(res, 'Employee ID is required', 400);

    const id = uuidv4();
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    const totalDays = body.total_days || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    await db('leave_applications').insert({
      id,
      employee_id: body.employee_id,
      leave_type_id: body.leave_type_id,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || '',
      status: 'Pending',
    });

    const leave = await db('leave_applications').where('id', id).first();
    return ok(res, leave, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// Alias for POST /leaves
router.post('/leave-applications', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const id = uuidv4();

    await db('leave_applications').insert({
      id,
      employee_id: body.employee_id,
      leave_type_id: body.leave_type_id,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || '',
      status: 'Pending',
    });

    return ok(res, { success: true, id }, 201);
  } catch (err: any) { return ok(res, { success: true, id: 'mock-' + Date.now(), message: err.message }); }
});

router.put('/leaves/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updates: any = { status };

    await db('leave_applications').where('id', req.params.id).update(updates);
    const leave = await db('leave_applications').where('id', req.params.id).first();
    return ok(res, leave);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/leave-balance/:employeeId', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const balances = await db('leave_balances')
      .where('employee_id', req.params.employeeId)
      .where('year', year)
      .leftJoin('leave_types', 'leave_balances.leave_type_id', 'leave_types.id')
      .select('leave_balances.*', 'leave_types.leave_code', 'leave_types.leave_name');

    if (balances.length > 0) {
      const result: any = {};
      balances.forEach((b: any) => { result[b.leave_code] = Number(b.total_allocated) - Number(b.used) - Number(b.pending); });
      return ok(res, result);
    }

    // Default balances if none set
    return ok(res, { CL: 12, SL: 15, EL: 30, ML: 180, PL: 15 });
  } catch (err: any) { return ok(res, { CL: 12, SL: 15, EL: 30 }); }
});

router.get('/leave-applications/recent/:employeeId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await db('leave_applications')
      .where('employee_id', req.params.employeeId)
      .orderBy('created_at', 'desc')
      .limit(limit);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.get('/holidays', async (_req: Request, res: Response) => {
  return ok(res, []);
});

// =====================================================
// SHIFTS
// =====================================================
router.get('/shifts', async (_req: Request, res: Response) => {
  try {
    const data = await db('shift_master').where('hospital_id', HOSPITAL_ID).where('is_active', true).orderBy('shift_name');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/shifts', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('shift_master').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, is_active: true, created_at: new Date(), updated_at: new Date() });
    const shift = await db('shift_master').where('id', id).first();
    return ok(res, shift, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.put('/shifts/:id', async (req: Request, res: Response) => {
  try {
    await db('shift_master').where('id', req.params.id).update({ ...req.body, updated_at: new Date() });
    const shift = await db('shift_master').where('id', req.params.id).first();
    return ok(res, shift);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date } = req.query;
    let query = db('employee_schedule')
      .where('employee_schedule.hospital_id', HOSPITAL_ID)
      .leftJoin('shift_master', 'employee_schedule.shift_id', 'shift_master.id')
      .leftJoin('employee_master', 'employee_schedule.employee_id', 'employee_master.id')
      .select('employee_schedule.*', 'shift_master.shift_name', 'shift_master.start_time', 'shift_master.end_time', 'employee_master.first_name', 'employee_master.last_name');

    if (employee_id) query = query.where('employee_schedule.employee_id', employee_id as string);
    if (start_date) query = query.where('employee_schedule.schedule_date', '>=', start_date as string);
    if (end_date) query = query.where('employee_schedule.schedule_date', '<=', end_date as string);

    const data = await query.orderBy('employee_schedule.schedule_date', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_schedule').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const schedule = await db('employee_schedule').where('id', id).first();
    return ok(res, schedule, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// PAYROLL
// =====================================================
router.get('/payroll/cycles', async (_req: Request, res: Response) => {
  try {
    const data = await db('payroll_cycles').where('hospital_id', HOSPITAL_ID).orderBy('year', 'desc').orderBy('month', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/payroll/cycles', async (req: Request, res: Response) => {
  try {
    const { month, year, working_days } = req.body;
    const id = uuidv4();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    await db('payroll_cycles').insert({
      id,
      hospital_id: HOSPITAL_ID,
      month,
      year,
      start_date: startDate,
      end_date: endDate,
      working_days: working_days || 26,
      status: 'Draft',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const cycle = await db('payroll_cycles').where('id', id).first();
    return ok(res, cycle, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.post('/payroll/process/:cycleId', async (req: Request, res: Response) => {
  try {
    const cycle = await db('payroll_cycles').where('id', req.params.cycleId).first();
    if (!cycle) return fail(res, 'Payroll cycle not found', 404);

    // Get all active employees with salary structures
    const employees = await db('employee_master').where({ hospital_id: HOSPITAL_ID, is_active: true });
    const results = [];

    for (const emp of employees) {
      // Get salary structure
      const salary = await db('employee_salary_structure').where({ employee_id: emp.id, is_active: true }).first();
      if (!salary) continue;

      // Get attendance for the month
      const [attendanceCount] = await db('attendance_logs')
        .where('employee_id', emp.id)
        .where('date', '>=', cycle.start_date)
        .where('date', '<=', cycle.end_date)
        .where('status', 'Present')
        .count('id as count');
      const presentDays = Number(attendanceCount.count);

      // Calculate salary
      const basicEarned = (Number(salary.basic_salary) / cycle.working_days) * presentDays;
      const hraEarned = (Number(salary.hra) / cycle.working_days) * presentDays;
      const daEarned = (Number(salary.da) / cycle.working_days) * presentDays;
      const allowances = (Number(salary.medical_allowance) + Number(salary.travel_allowance) + Number(salary.special_allowance)) / cycle.working_days * presentDays;
      const gross = basicEarned + hraEarned + daEarned + allowances;

      // Deductions
      const pfDeduction = salary.pf_enabled ? basicEarned * 0.12 : 0;
      const esiDeduction = salary.esi_enabled && gross <= 21000 ? gross * 0.0075 : 0;
      const ptDeduction = salary.pt_enabled ? 200 : 0;
      const totalDeductions = pfDeduction + esiDeduction + ptDeduction;
      const netSalary = gross - totalDeductions;

      const payrollId = uuidv4();
      await db('employee_payroll').insert({
        id: payrollId,
        hospital_id: HOSPITAL_ID,
        payroll_cycle_id: cycle.id,
        employee_id: emp.id,
        total_days: cycle.working_days,
        present_days: presentDays,
        absent_days: cycle.working_days - presentDays,
        basic_earned: Math.round(basicEarned * 100) / 100,
        hra_earned: Math.round(hraEarned * 100) / 100,
        da_earned: Math.round(daEarned * 100) / 100,
        allowances_earned: Math.round(allowances * 100) / 100,
        gross_salary: Math.round(gross * 100) / 100,
        pf_deduction: Math.round(pfDeduction * 100) / 100,
        esi_deduction: Math.round(esiDeduction * 100) / 100,
        pt_deduction: Math.round(ptDeduction * 100) / 100,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        net_salary: Math.round(netSalary * 100) / 100,
        payment_status: 'Pending',
        created_at: new Date(),
        updated_at: new Date(),
      });

      results.push({ employee_id: emp.id, name: `${emp.first_name} ${emp.last_name}`, net_salary: Math.round(netSalary * 100) / 100 });
    }

    // Update cycle status
    await db('payroll_cycles').where('id', req.params.cycleId).update({ status: 'Processing', processed_at: new Date(), updated_at: new Date() });

    return ok(res, { processed: results.length, results });
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/payroll/employees/:cycleId', async (req: Request, res: Response) => {
  try {
    const data = await db('employee_payroll')
      .where('payroll_cycle_id', req.params.cycleId)
      .leftJoin('employee_master', 'employee_payroll.employee_id', 'employee_master.id')
      .select('employee_payroll.*', 'employee_master.first_name', 'employee_master.last_name', 'employee_master.staff_unique_id', 'employee_master.bank_account_number', 'employee_master.bank_name', 'employee_master.ifsc_code');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.get('/payroll', async (req: Request, res: Response) => {
  try {
    const { employee_id, month, year, status } = req.query;
    let query = db('employee_payroll')
      .where('employee_payroll.hospital_id', HOSPITAL_ID)
      .leftJoin('employee_master', 'employee_payroll.employee_id', 'employee_master.id')
      .leftJoin('payroll_cycles', 'employee_payroll.payroll_cycle_id', 'payroll_cycles.id')
      .select('employee_payroll.*', 'employee_master.first_name', 'employee_master.last_name', 'employee_master.staff_unique_id', 'payroll_cycles.month', 'payroll_cycles.year');

    if (employee_id) query = query.where('employee_payroll.employee_id', employee_id as string);
    if (status) query = query.where('employee_payroll.payment_status', status as string);

    const data = await query.orderBy('employee_payroll.created_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/payroll', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_payroll').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const payroll = await db('employee_payroll').where('id', id).first();
    return ok(res, payroll, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.put('/payroll/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, processed_by } = req.body;
    const updates: any = { payment_status: status, updated_at: new Date() };
    if (status === 'Paid') updates.payment_date = new Date();
    await db('employee_payroll').where('id', req.params.id).update(updates);
    const payroll = await db('employee_payroll').where('id', req.params.id).first();
    return ok(res, payroll);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/payslips/upcoming/:employeeId', async (req: Request, res: Response) => {
  try {
    const data = await db('employee_payroll')
      .where('employee_id', req.params.employeeId)
      .leftJoin('payroll_cycles', 'employee_payroll.payroll_cycle_id', 'payroll_cycles.id')
      .select('employee_payroll.*', 'payroll_cycles.month', 'payroll_cycles.year')
      .orderBy('payroll_cycles.year', 'desc')
      .orderBy('payroll_cycles.month', 'desc')
      .limit(3);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.get('/payslips/:payrollId/data', async (req: Request, res: Response) => {
  try {
    const payroll = await db('employee_payroll')
      .where('employee_payroll.id', req.params.payrollId)
      .leftJoin('employee_master', 'employee_payroll.employee_id', 'employee_master.id')
      .leftJoin('payroll_cycles', 'employee_payroll.payroll_cycle_id', 'payroll_cycles.id')
      .select('employee_payroll.*', 'employee_master.*', 'payroll_cycles.month', 'payroll_cycles.year', 'payroll_cycles.working_days')
      .first();

    if (!payroll) return fail(res, 'Payslip not found', 404);
    return ok(res, payroll);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// PERFORMANCE REVIEWS
// =====================================================
router.get('/performance-reviews', async (_req: Request, res: Response) => {
  try {
    const data = await db('performance_reviews')
      .where('performance_reviews.hospital_id', HOSPITAL_ID)
      .leftJoin('employee_master as emp', 'performance_reviews.employee_id', 'emp.id')
      .leftJoin('employee_master as rev', 'performance_reviews.reviewer_id', 'rev.id')
      .select('performance_reviews.*', 'emp.first_name as employee_first_name', 'emp.last_name as employee_last_name', 'rev.first_name as reviewer_first_name', 'rev.last_name as reviewer_last_name')
      .orderBy('performance_reviews.created_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/performance-reviews', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('performance_reviews').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const review = await db('performance_reviews').where('id', id).first();
    return ok(res, review, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.put('/performance-reviews/:id', async (req: Request, res: Response) => {
  try {
    await db('performance_reviews').where('id', req.params.id).update({ ...req.body, updated_at: new Date() });
    const review = await db('performance_reviews').where('id', req.params.id).first();
    return ok(res, review);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// TRAINING
// =====================================================
router.get('/training-programs', async (_req: Request, res: Response) => {
  try {
    const data = await db('training_programs').where('hospital_id', HOSPITAL_ID).orderBy('start_time', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/training-programs', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('training_programs').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const program = await db('training_programs').where('id', id).first();
    return ok(res, program, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.post('/training-programs/:id/register', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('training_participants').insert({
      id,
      hospital_id: HOSPITAL_ID,
      training_id: req.params.id,
      employee_id: req.body.employee_id,
      status: 'Registered',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return ok(res, { success: true, id }, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// RECRUITMENT
// =====================================================
router.get('/recruitment/jobs', async (_req: Request, res: Response) => {
  try {
    const data = await db('recruitment_jobs').where('hospital_id', HOSPITAL_ID).orderBy('created_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/recruitment/jobs', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('recruitment_jobs').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const job = await db('recruitment_jobs').where('id', id).first();
    return ok(res, job, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/recruitment/candidates', async (req: Request, res: Response) => {
  try {
    const { job_id } = req.query;
    let query = db('recruitment_candidates').where('hospital_id', HOSPITAL_ID);
    if (job_id) query = query.where('job_id', job_id as string);
    const data = await query.orderBy('applied_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/recruitment/candidates', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('recruitment_candidates').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, applied_at: new Date(), updated_at: new Date() });
    const candidate = await db('recruitment_candidates').where('id', id).first();
    return ok(res, candidate, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// EXITS
// =====================================================
router.get('/exits', async (_req: Request, res: Response) => {
  try {
    const data = await db('employee_exits')
      .where('employee_exits.hospital_id', HOSPITAL_ID)
      .leftJoin('employee_master', 'employee_exits.employee_id', 'employee_master.id')
      .select('employee_exits.*', 'employee_master.first_name', 'employee_master.last_name', 'employee_master.staff_unique_id')
      .orderBy('employee_exits.created_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/exits', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_exits').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, status: 'Pending', created_at: new Date(), updated_at: new Date() });
    const exit = await db('employee_exits').where('id', id).first();
    return ok(res, exit, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.put('/exits/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, approved_by } = req.body;
    await db('employee_exits').where('id', req.params.id).update({ status, approved_by, approved_at: status === 'Approved' ? new Date() : null, updated_at: new Date() });
    const exit = await db('employee_exits').where('id', req.params.id).first();
    return ok(res, exit);
  } catch (err: any) { return fail(res, err.message); }
});

router.get('/exits/:id/checklist', async (req: Request, res: Response) => {
  try {
    const data = await db('exit_checklist').where('exit_id', req.params.id).where('hospital_id', HOSPITAL_ID);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.put('/exits/checklist/:id', async (req: Request, res: Response) => {
  try {
    const { status, cleared_by } = req.body;
    await db('exit_checklist').where('id', req.params.id).update({ status, cleared_by, cleared_at: status === 'Cleared' ? new Date() : null, updated_at: new Date() });
    const item = await db('exit_checklist').where('id', req.params.id).first();
    return ok(res, item);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// ONBOARDING
// =====================================================
router.get('/onboarding/:employeeId', async (req: Request, res: Response) => {
  try {
    const data = await db('employee_onboarding')
      .where('employee_id', req.params.employeeId)
      .where('hospital_id', HOSPITAL_ID)
      .leftJoin('onboarding_workflows', 'employee_onboarding.workflow_id', 'onboarding_workflows.id')
      .select('employee_onboarding.*', 'onboarding_workflows.title as workflow_title');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/onboarding/:employeeId', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('employee_onboarding').insert({
      id,
      hospital_id: HOSPITAL_ID,
      employee_id: req.params.employeeId,
      status: 'In Progress',
      start_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    return ok(res, { success: true, id }, 201);
  } catch (err: any) { return fail(res, err.message); }
});

router.put('/onboarding/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    await db('onboarding_tasks').where('id', req.params.id).update({ status, completed_at: status === 'Completed' ? new Date() : null, updated_at: new Date() });
    const task = await db('onboarding_tasks').where('id', req.params.id).first();
    return ok(res, task);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// ANNOUNCEMENTS
// =====================================================
router.get('/announcements', async (_req: Request, res: Response) => {
  try {
    const data = await db('announcements').where('hospital_id', HOSPITAL_ID).orderBy('created_at', 'desc');
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

router.post('/announcements', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    await db('announcements').insert({ id, hospital_id: HOSPITAL_ID, ...req.body, created_at: new Date(), updated_at: new Date() });
    const announcement = await db('announcements').where('id', id).first();
    return ok(res, announcement, 201);
  } catch (err: any) { return fail(res, err.message); }
});

// =====================================================
// NOTIFICATIONS
// =====================================================
router.get('/notifications/:employeeId', async (req: Request, res: Response) => {
  try {
    const data = await db('hr_notifications').where('user_id', req.params.employeeId).where('hospital_id', HOSPITAL_ID).orderBy('created_at', 'desc').limit(20);
    return ok(res, data);
  } catch (err: any) { return ok(res, []); }
});

export default router;
