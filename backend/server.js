const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Azure PostgreSQL connection
const pool = new Pool({
  host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
  port: process.env.AZURE_DB_PORT || 5432,
  database: process.env.AZURE_DB_NAME || 'postgres',
  user: process.env.AZURE_DB_USER || 'divyansh04',
  password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to Azure PostgreSQL database');
  release();
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ 401: No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ 403: Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    console.log('✅ Token verified for user:', user.email);
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if password is stored as plain text or bcrypt hash
    const passwordField = user.password || user.password_hash;

    let validPassword = false;

    // If password exists in database
    if (passwordField) {
      // First try bcrypt comparison (for hashed passwords)
      try {
        validPassword = await bcrypt.compare(password, passwordField);
      } catch (err) {
        // If bcrypt fails, might be plain text - try direct comparison
        validPassword = (password === passwordField);
      }
    }

    // Also accept temp password for admin users
    if (!validPassword &&
      (email === 'admin@indic.com' || email === 'admin@valant.com' || email === 'admin@hospital.com') &&
      password === 'admin123') {
      validPassword = true;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new user
app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    // Only admins can create new users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { email, password, first_name, last_name, role } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, role`,
      [email, password_hash, first_name, last_name, role]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// ==================== PATIENT ROUTES ====================

// Get all patients
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(SUM(CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN t.amount
          ELSE 0
        END), 0) as total_spent,
        COALESCE(COUNT(DISTINCT CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN DATE(t.transaction_date)
          ELSE NULL
        END), 0) as visit_count
      FROM patients p
      LEFT JOIN patient_transactions t ON p.patient_id = t.patient_id
      WHERE (p.is_active = true OR p.is_active IS NULL)
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    // Map database fields to match frontend expectations
    const patients = result.rows.map(row => ({
      ...row,
      totalSpent: parseFloat(row.total_spent) || 0,
      visitCount: parseInt(row.visit_count) || 0
    }));

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patients by date range
app.get('/api/patients/by-date-range', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await pool.query(
      `SELECT * FROM patients 
       WHERE date_of_entry >= $1 AND date_of_entry <= $2 
       AND (is_active = true OR is_active IS NULL)
       ORDER BY date_of_entry DESC`,
      [start_date + ' 00:00:00', end_date + ' 23:59:59']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients by date range:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patients by exact date
app.get('/api/patients/by-date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { limit } = req.query;

    let query = `
      SELECT
        p.*,
        COALESCE(SUM(CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN t.amount
          ELSE 0
        END), 0) as total_spent,
        COALESCE(COUNT(DISTINCT CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN DATE(t.transaction_date)
          ELSE NULL
        END), 0) as visit_count
      FROM patients p
      LEFT JOIN patient_transactions t ON p.patient_id = t.patient_id
      WHERE p.date_of_entry::date = $1
        AND (p.is_active = true OR p.is_active IS NULL)
      GROUP BY p.id
      ORDER BY p.date_of_entry DESC`;

    const params = [date];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await pool.query(query, params);

    // Map database fields to match frontend expectations
    const patients = result.rows.map(row => ({
      ...row,
      totalSpent: parseFloat(row.total_spent) || 0,
      visitCount: parseInt(row.visit_count) || 0
    }));

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients by date:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single patient
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(SUM(CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN t.amount
          ELSE 0
        END), 0) as total_spent,
        COALESCE(COUNT(DISTINCT CASE
          WHEN t.transaction_type IN ('SERVICE', 'MEDICINE') THEN DATE(t.transaction_date)
          ELSE NULL
        END), 0) as visit_count
      FROM patients p
      LEFT JOIN patient_transactions t ON p.patient_id = t.patient_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = {
      ...result.rows[0],
      totalSpent: parseFloat(result.rows[0].total_spent) || 0,
      visitCount: parseInt(result.rows[0].visit_count) || 0
    };

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new patient
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const {
      patient_id: providedPatientId,
      first_name,
      last_name,
      age,
      gender,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      current_medications,
      blood_group,
      notes,
      date_of_entry,
      assigned_doctor,
      assigned_department,
      prefix,
      patient_tag,
      date_of_birth
    } = req.body;

    // Generate UUID for id field
    const id = crypto.randomUUID();

    // Auto-generate patient_id if not provided
    let patient_id = providedPatientId;
    if (!patient_id) {
      // Get the count of existing patients to generate next ID
      const countResult = await pool.query('SELECT COUNT(*) FROM patients');
      const count = parseInt(countResult.rows[0].count) + 1;
      patient_id = `P${count.toString().padStart(6, '0')}`;
      console.log('📝 Auto-generated patient_id:', patient_id);
    }

    const result = await pool.query(
      `INSERT INTO patients (
        id, patient_id, prefix, first_name, last_name, age, gender, phone, email, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, blood_group, notes, date_of_entry,
        assigned_doctor, assigned_department, patient_tag, date_of_birth,
        created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        id, patient_id, prefix, first_name, last_name, age, gender, phone, email, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, blood_group, notes, date_of_entry,
        assigned_doctor, assigned_department, patient_tag, date_of_birth,
        req.user.id, true
      ]
    );

    console.log('✅ Patient created successfully:', {
      patient_id: result.rows[0].patient_id,
      name: `${result.rows[0].first_name} ${result.rows[0].last_name}`,
      assigned_doctor: result.rows[0].assigned_doctor,
      assigned_department: result.rows[0].assigned_department
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update patient
app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE patients SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete patient (soft delete by setting is_active to false)
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ DELETE request received for patient ID:', id);

    // Soft delete - set is_active to false instead of actually deleting
    const result = await pool.query(
      `UPDATE patients SET is_active = false WHERE id = $1 RETURNING *`,
      [id]
    );

    console.log('🗑️ Delete query result rows:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('❌ Patient not found with ID:', id);
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log('✅ Patient deleted successfully:', result.rows[0].first_name);
    res.json({ message: 'Patient deleted successfully', patient: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting patient:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patients by date range
app.get('/api/patients/by-date-range', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await pool.query(
      `SELECT * FROM patients 
       WHERE date_of_entry >= $1 AND date_of_entry <= $2 
       AND is_active = true 
       ORDER BY date_of_entry DESC`,
      [start_date + ' 00:00:00', end_date + ' 23:59:59']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients by date range:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patients by exact date
app.get('/api/patients/by-date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { limit } = req.query;

    let query = `SELECT * FROM patients 
                 WHERE date_of_entry::date = $1 
                 AND is_active = true 
                 ORDER BY date_of_entry DESC`;

    const params = [date];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients by date:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patient refunds
app.get('/api/patient_refunds', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT r.*, 
             json_build_object(
               'id', p.id,
               'patient_id', p.patient_id,
               'first_name', p.first_name,
               'last_name', p.last_name,
               'age', p.age,
               'gender', p.gender,
               'patient_tag', p.patient_tag,
               'assigned_doctor', p.assigned_doctor,
               'assigned_department', p.assigned_department,
               'date_of_entry', p.date_of_entry
             ) as patient
      FROM patient_refunds r
      LEFT JOIN patients p ON r.patient_id = p.patient_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND r.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND r.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TRANSACTION ROUTES ====================

// Get all transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { patient_id, start_date, end_date } = req.query;
    let query = 'SELECT * FROM patient_transactions WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (patient_id) {
      query += ` AND patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND transaction_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND transaction_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const {
      patient_id,
      transaction_type,
      amount,
      payment_mode,
      doctor_id,
      doctor_name,
      department,
      description,
      transaction_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO patient_transactions (
        patient_id, transaction_type, amount, payment_mode,
        doctor_id, doctor_name, department, description,
        transaction_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        patient_id, transaction_type, amount, payment_mode,
        doctor_id, doctor_name, department, description,
        transaction_date || new Date(), req.user.id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMISSION ROUTES ====================

// Get all admissions
app.get('/api/admissions', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM patient_admissions';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY admission_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create admission
app.post('/api/admissions', authenticateToken, async (req, res) => {
  try {
    const {
      patient_id,
      bed_number,
      room_type,
      department,
      daily_rate,
      admission_date,
      treating_doctor,
      history_present_illness
    } = req.body;

    // Start transaction
    await pool.query('BEGIN');

    // Create admission
    const admissionResult = await pool.query(
      `INSERT INTO patient_admissions (
        patient_id, bed_number, room_type, department,
        daily_rate, admission_date, treating_doctor,
        history_present_illness, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        patient_id, bed_number, room_type, department,
        daily_rate, admission_date, treating_doctor,
        history_present_illness, req.user.id
      ]
    );

    // Update bed status
    await pool.query(
      'UPDATE beds SET status = $1, patient_id = $2 WHERE bed_number = $3',
      ['occupied', patient_id, bed_number]
    );

    // Create admission transaction
    await pool.query(
      `INSERT INTO patient_transactions (
        patient_id, transaction_type, amount, payment_mode,
        department, description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        patient_id, 'admission', daily_rate, 'cash',
        department, `Admission to ${room_type} - Bed ${bed_number}`,
        req.user.id
      ]
    );

    await pool.query('COMMIT');
    res.json(admissionResult.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating admission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Discharge patient
app.post('/api/admissions/:id/discharge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { discharge_date, final_diagnosis, discharge_instructions } = req.body;

    await pool.query('BEGIN');

    // Update admission
    const admissionResult = await pool.query(
      `UPDATE patient_admissions 
       SET discharge_date = $1, status = $2
       WHERE id = $3
       RETURNING *`,
      [discharge_date, 'discharged', id]
    );

    if (admissionResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Admission not found' });
    }

    const admission = admissionResult.rows[0];

    // Free the bed
    await pool.query(
      'UPDATE beds SET status = $1, patient_id = NULL WHERE bed_number = $2',
      ['available', admission.bed_number]
    );

    // Create discharge summary
    await pool.query(
      `INSERT INTO discharge_summary (
        admission_id, patient_id, discharge_date,
        discharge_type, final_diagnosis, discharge_instructions,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id, admission.patient_id, discharge_date,
        'Regular', final_diagnosis, discharge_instructions,
        req.user.id
      ]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Patient discharged successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error discharging patient:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DOCTOR ROUTES ====================

// Get all doctors
app.get('/api/doctors', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM doctors WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== BED ROUTES ====================

// Get all beds
app.get('/api/beds', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM beds';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY bed_number';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARD ROUTES ====================

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get total patients
    const patientsResult = await pool.query(
      'SELECT COUNT(*) as count FROM patients WHERE is_active = true'
    );

    // Get active admissions
    const admissionsResult = await pool.query(
      'SELECT COUNT(*) as count FROM patient_admissions WHERE status = $1',
      ['active']
    );

    // Get today's revenue
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM patient_transactions 
       WHERE transaction_date = CURRENT_DATE`
    );

    // Get available beds
    const bedsResult = await pool.query(
      'SELECT COUNT(*) as count FROM beds WHERE status = $1',
      ['available']
    );

    res.json({
      totalPatients: parseInt(patientsResult.rows[0].count),
      activeAdmissions: parseInt(admissionsResult.rows[0].count),
      todayRevenue: parseFloat(revenueResult.rows[0].total),
      availableBeds: parseInt(bedsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== APPOINTMENT ROUTES ====================

// Get all appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, patient_id, date, status } = req.query;
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (doctor_id) {
      query += ` AND doctor_id = $${paramCount} `;
      params.push(doctor_id);
      paramCount++;
    }
    if (patient_id) {
      query += ` AND patient_id = $${paramCount} `;
      params.push(patient_id);
      paramCount++;
    }
    if (date) {
      query += ` AND DATE(scheduled_at) = $${paramCount} `;
      params.push(date);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount} `;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY scheduled_at ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const {
      patient_id, doctor_id, department_id, scheduled_at, duration,
      status, reason, appointment_type, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO appointments(
  patient_id, doctor_id, department_id, scheduled_at, duration,
  status, reason, appointment_type, notes, created_by
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING * `,
      [
        patient_id, doctor_id, department_id, scheduled_at, duration,
        status || 'SCHEDULED', reason, appointment_type, notes, req.user.id
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2} `)
      .join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE appointments SET ${setClause} WHERE id = $1 RETURNING * `,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DEPARTMENT ROUTES ====================

app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== USER ROUTES ====================

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== GENERIC CRUD ROUTES (for other tables) ====================

// Helper for generic CRUD
const createGenericRoutes = (tableName) => {
  // Get all
  app.get(`/ api / ${tableName} `, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (error) {
      console.error(`Error fetching ${tableName}: `, error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Create
  app.post(`/ api / ${tableName} `, authenticateToken, async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map((_, i) => `$${i + 1} `).join(', ');

      const result = await pool.query(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES(${placeholders}) RETURNING * `,
        values
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error creating ${tableName}: `, error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update
  app.put(`/ api / ${tableName}/:id`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = [id, ...Object.values(updates)];

      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = $1 RETURNING *`,
        values
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Delete
  app.delete(`/api/${tableName}/:id`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      res.status(500).json({ error: 'Server error' });
    }
  });
};

// Initialize generic routes for simple tables
['audit_logs', 'custom_services', 'daily_expenses', 'medicines', 'email_logs', 'hospitals'].forEach(table => {
  createGenericRoutes(table);
});

// OPD QUEUE ROUTES
app.get('/api/opd-queues', async (req, res) => {
  try {
    const { status, doctor_id, date } = req.query;
    console.log(`[OPD] Fetching queues with params:`, { status, doctor_id, date });

    let query = `
      SELECT q.*, 
             p.first_name, p.last_name, p.phone, p.patient_id as patient_code, p.age, p.gender,
             d.first_name as doctor_name, d.last_name as doctor_last_name
      FROM opd_queues q
      JOIN patients p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND q.status = $${paramIndex++}`;
      params.push(status);
    }

    if (doctor_id) {
      query += ` AND q.doctor_id = $${paramIndex++}`;
      params.push(doctor_id);
    }

    if (date) {
      query += ` AND DATE(q.created_at) = $${paramIndex++}`;
      params.push(date);
    } else {
      // Default to today if no date provided
      query += ` AND DATE(q.created_at) = CURRENT_DATE`;
    }

    query += ` ORDER BY q.priority DESC, q.token_number ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching OPD queues:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/opd-queues', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, priority, notes } = req.body;
    console.log(`[OPD] Creating queue entry for patient ${patient_id}`);

    // Get next token number for today
    const tokenResult = await pool.query(`
      SELECT COALESCE(MAX(token_number), 0) + 1 as next_token 
      FROM opd_queues 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    const nextToken = tokenResult.rows[0].next_token;

    const result = await pool.query(
      `INSERT INTO opd_queues (patient_id, doctor_id, appointment_id, token_number, priority, status)
       VALUES ($1, $2, $3, $4, $5, 'WAITING')
       RETURNING *`,
      [patient_id, doctor_id, appointment_id, nextToken, priority || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating OPD queue:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/opd-queues/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE opd_queues 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATIENT VITALS ROUTES
app.post('/api/patient-vitals', async (req, res) => {
  try {
    const {
      patient_id, queue_id, visit_id,
      blood_pressure, pulse, temperature, weight, height, spo2, respiratory_rate, bmi, notes, recorded_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO patient_vitals 
       (patient_id, queue_id, visit_id, blood_pressure, pulse, temperature, weight, height, spo2, respiratory_rate, bmi, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [patient_id, queue_id, visit_id, blood_pressure, pulse, temperature, weight, height, spo2, respiratory_rate, bmi, notes, recorded_by]
    );

    // Auto-update queue status if linked
    if (queue_id) {
      await pool.query(
        `UPDATE opd_queues SET status = 'VITALS_DONE' WHERE id = $1 AND status = 'WAITING'`,
        [queue_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient-vitals/latest/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT * FROM patient_vitals 
       WHERE patient_id = $1 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [patientId]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching latest vitals:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================================
// BILLING API ENDPOINTS
// =====================================================================

// Initialize billing tables (run once)
app.post('/api/billing/init-tables', authenticateToken, async (req, res) => {
  try {
    // Create OPD bills table (without foreign key - patients table doesn't have proper constraints)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opd_bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id UUID,
        patient_name VARCHAR(255) NOT NULL,
        doctor_id UUID,
        doctor_name VARCHAR(255),
        services JSONB DEFAULT '[]',
        consultation_fee DECIMAL(10,2) DEFAULT 0,
        investigation_charges DECIMAL(10,2) DEFAULT 0,
        medicine_charges DECIMAL(10,2) DEFAULT 0,
        other_charges DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_mode VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create IPD bills table (without foreign key)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ipd_bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id UUID,
        patient_name VARCHAR(255) NOT NULL,
        admission_date DATE,
        discharge_date DATE,
        admission_charges DECIMAL(10,2) DEFAULT 0,
        stay_segments JSONB DEFAULT '[]',
        services JSONB DEFAULT '[]',
        total_stay_charges DECIMAL(10,2) DEFAULT 0,
        total_service_charges DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_mode VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_opd_bills_patient ON opd_bills(patient_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_opd_bills_date ON opd_bills(bill_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ipd_bills_patient ON ipd_bills(patient_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ipd_bills_date ON ipd_bills(bill_date)');

    res.json({ message: 'Billing tables initialized successfully' });
  } catch (error) {
    console.error('Error initializing billing tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all OPD bills
app.get('/api/billing/opd', authenticateToken, async (req, res) => {
  try {
    const { patient_id, bill_type, payment_status, date_from, date_to } = req.query;

    let query = 'SELECT * FROM opd_bills WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (patient_id) {
      query += ` AND patient_id = $${paramCount++}`;
      params.push(patient_id);
    }
    if (payment_status) {
      query += ` AND status = $${paramCount++}`;
      params.push(payment_status);
    }
    if (date_from) {
      query += ` AND bill_date >= $${paramCount++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND bill_date <= $${paramCount++}`;
      params.push(date_to);
    }

    query += ' ORDER BY bill_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching OPD bills:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create OPD bill
app.post('/api/billing/opd', authenticateToken, async (req, res) => {
  try {
    const {
      bill_id, patient_id, patient_name, doctor_id, doctor_name,
      services, consultation_fee, investigation_charges, medicine_charges,
      other_charges, discount, total_amount, status, payment_mode
    } = req.body;

    const result = await pool.query(
      `INSERT INTO opd_bills (
        bill_id, patient_id, patient_name, doctor_id, doctor_name,
        services, consultation_fee, investigation_charges, medicine_charges,
        other_charges, discount, total_amount, status, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [bill_id, patient_id, patient_name, doctor_id, doctor_name,
        JSON.stringify(services || []), consultation_fee || 0, investigation_charges || 0,
        medicine_charges || 0, other_charges || 0, discount || 0,
        total_amount, status || 'PAID', payment_mode]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating OPD bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update OPD bill
app.put('/api/billing/opd/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.services) {
      updates.services = JSON.stringify(updates.services);
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE opd_bills SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'OPD bill not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating OPD bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete OPD bill
app.delete('/api/billing/opd/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM opd_bills WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'OPD bill not found' });
    }

    res.json({ message: 'OPD bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting OPD bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate next OPD bill ID
app.get('/api/billing/opd/next-id', authenticateToken, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const result = await pool.query(
      'SELECT bill_id FROM opd_bills WHERE bill_id LIKE $1 ORDER BY bill_id DESC LIMIT 1',
      [`OPD-${year}-%`]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0].bill_id;
      const lastSequence = parseInt(lastId.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const billId = `OPD-${year}-${String(sequence).padStart(4, '0')}`;
    res.json({ billId });
  } catch (error) {
    console.error('Error generating OPD bill ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all IPD bills
app.get('/api/billing/ipd', authenticateToken, async (req, res) => {
  try {
    const { patient_id, bill_type, payment_status, date_from, date_to } = req.query;

    let query = 'SELECT * FROM ipd_bills WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (patient_id) {
      query += ` AND patient_id = $${paramCount++}`;
      params.push(patient_id);
    }
    if (payment_status) {
      query += ` AND status = $${paramCount++}`;
      params.push(payment_status);
    }
    if (date_from) {
      query += ` AND bill_date >= $${paramCount++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND bill_date <= $${paramCount++}`;
      params.push(date_to);
    }

    query += ' ORDER BY bill_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching IPD bills:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create IPD bill
app.post('/api/billing/ipd', authenticateToken, async (req, res) => {
  try {
    const {
      bill_id, patient_id, patient_name, admission_date, discharge_date,
      admission_charges, stay_segments, services, total_stay_charges,
      total_service_charges, discount, total_amount, status, payment_mode
    } = req.body;

    const result = await pool.query(
      `INSERT INTO ipd_bills (
        bill_id, patient_id, patient_name, admission_date, discharge_date,
        admission_charges, stay_segments, services, total_stay_charges,
        total_service_charges, discount, total_amount, status, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [bill_id, patient_id, patient_name, admission_date, discharge_date,
        admission_charges || 0, JSON.stringify(stay_segments || []),
        JSON.stringify(services || []), total_stay_charges || 0,
        total_service_charges || 0, discount || 0, total_amount,
        status || 'PAID', payment_mode]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating IPD bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update IPD bill
app.put('/api/billing/ipd/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.stay_segments) {
      updates.stay_segments = JSON.stringify(updates.stay_segments);
    }
    if (updates.services) {
      updates.services = JSON.stringify(updates.services);
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE ipd_bills SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IPD bill not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating IPD bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete IPD bill
app.delete('/api/billing/ipd/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ipd_bills WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IPD bill not found' });
    }

    res.json({ message: 'IPD bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting IPD bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate next IPD bill ID
app.get('/api/billing/ipd/next-id', authenticateToken, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const result = await pool.query(
      'SELECT bill_id FROM ipd_bills WHERE bill_id LIKE $1 ORDER BY bill_id DESC LIMIT 1',
      [`IPD-${year}-%`]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0].bill_id;
      const lastSequence = parseInt(lastId.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const billId = `IPD-${year}-${String(sequence).padStart(4, '0')}`;
    res.json({ billId });
  } catch (error) {
    console.error('Error generating IPD bill ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent bills (combined OPD + IPD)
app.get('/api/billing/recent', authenticateToken, async (req, res) => {
  try {
    const opdResult = await pool.query(
      `SELECT id, bill_id as "billId", patient_name as "patientName", 
              'OPD' as type, total_amount as amount, status, bill_date as date
       FROM opd_bills 
       ORDER BY bill_date DESC 
       LIMIT 50`
    );

    const ipdResult = await pool.query(
      `SELECT id, bill_id as "billId", patient_name as "patientName", 
              'IPD' as type, total_amount as amount, status, bill_date as date
       FROM ipd_bills 
       ORDER BY bill_date DESC 
       LIMIT 50`
    );

    const combined = [...opdResult.rows, ...ipdResult.rows]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 100);

    res.json(combined);
  } catch (error) {
    console.error('Error fetching recent bills:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get billing summary
app.get('/api/billing/summary', authenticateToken, async (req, res) => {
  try {
    // Get OPD stats
    const opdStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'PAID'), 0) as revenue
      FROM opd_bills
    `);

    // Get IPD stats
    const ipdStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'PAID'), 0) as revenue
      FROM ipd_bills
    `);

    const opdData = opdStats.rows[0];
    const ipdData = ipdStats.rows[0];

    res.json({
      totalRevenue: parseFloat(opdData.revenue) + parseFloat(ipdData.revenue),
      opdBills: parseInt(opdData.total),
      ipdBills: parseInt(ipdData.total),
      pendingBills: parseInt(opdData.pending) + parseInt(ipdData.pending),
      totalDeposits: parseFloat(opdData.revenue) + parseFloat(ipdData.revenue)
    });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all bills (development/testing only)
app.delete('/api/billing/clear-all', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM opd_bills');
    await pool.query('DELETE FROM ipd_bills');
    res.json({ message: 'All bills cleared successfully' });
  } catch (error) {
    console.error('Error clearing bills:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== MODULE ACCESS CONTROL ROUTES ====================
// Import and use module routes
const moduleRoutes = require('./routes/modules');
app.use('/api/modules', moduleRoutes(pool));

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
