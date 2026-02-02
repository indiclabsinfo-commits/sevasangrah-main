const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Force Vercel redeploy - Updated: 2026-02-01 CORS FIX v3

// CORS Configuration - Single unified approach for Vercel serverless
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    // Allow all Vercel preview/production deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }

    // Allow any origin (for maximum compatibility)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware FIRST - before any routes
app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight requests (Vercel serverless compatibility)
app.options('*', cors(corsOptions));

// Increase body size limit to 50MB to support base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the dist directory (only for local development)
// Commented out for Vercel deployment where frontend is separate
// app.use(express.static(path.join(__dirname, '../dist')));

// Database connection
// Prefer DATABASE_URL for Supabase, fallback to individual params
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  : new Pool({
    host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
    port: parseInt(process.env.AZURE_DB_PORT || '5432'),
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
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const bypassUser = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'admin@hospital.com',
    role: 'ADMIN',
    first_name: 'Dev',
    last_name: 'Admin',
    is_active: true
  };

  // Case 1: No Token -> Force Bypass
  if (!token) {
    console.log('🔓 [DEV] No token provided - performing HARDCODED Admin bypass');
    req.user = bypassUser;
    return next();
  }

  // Case 2: Token Present -> Verify
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('⚠️ [Auth] Token verification failed:', err.message);
      console.log('🔓 [DEV] Invalid token - performing HARDCODED Admin bypass');
      req.user = bypassUser;
      return next();
    }
    // Token Valid
    req.user = user;
    next();
  });
};

// ==================== HEALTH & INFO ROUTES ====================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Hospital CRM API',
    version: '1.0.0',
    status: 'running'
  });
});

// Root path handler (to avoid "Not Found" on home page)
app.get('/', (req, res) => {
  res.json({
    message: 'Hospital CRM Backend is Running',
    endpoints: {
      health: '/api/health',
      api_info: '/api'
    }
  });
});

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
    // Fetch patients with transactions and admissions using subqueries
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          (SELECT json_agg(row_to_json(pt.*))
           FROM patient_transactions pt
           WHERE pt.patient_id = p.id),
          '[]'::json
        ) as transactions,
        COALESCE(
          (SELECT json_agg(row_to_json(pa.*))
           FROM patient_admissions pa
           WHERE pa.patient_id = p.id),
          '[]'::json
        ) as admissions
      FROM patients p
      WHERE (p.is_active = true OR p.is_active IS NULL)
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get patients by date range
app.get('/api/patients/by-date-range', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          (SELECT json_agg(row_to_json(pt.*))
           FROM patient_transactions pt
           WHERE pt.patient_id = p.id),
          '[]'::json
        ) as transactions,
        COALESCE(
          (SELECT json_agg(row_to_json(pa.*))
           FROM patient_admissions pa
           WHERE pa.patient_id = p.id),
          '[]'::json
        ) as admissions
      FROM patients p
      WHERE p.date_of_entry >= $1 AND p.date_of_entry <= $2
        AND (p.is_active = true OR p.is_active IS NULL)
      ORDER BY p.date_of_entry DESC
    `, [start_date, end_date]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients by date range:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
        COALESCE(
          (SELECT json_agg(row_to_json(pt.*))
           FROM patient_transactions pt
           WHERE pt.patient_id = p.id),
          '[]'::json
        ) as transactions,
        COALESCE(
          (SELECT json_agg(row_to_json(pa.*))
           FROM patient_admissions pa
           WHERE pa.patient_id = p.id),
          '[]'::json
        ) as admissions
      FROM patients p
      WHERE p.date_of_entry::date = $1
        AND (p.is_active = true OR p.is_active IS NULL)
      ORDER BY p.date_of_entry DESC
    `;

    const params = [date];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients by date:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get single patient
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new patient
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const {
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
      photo_url,
      patient_tag,
      prefix,
      date_of_birth,
      assigned_doctor,
      assigned_department,
      has_reference,
      reference_details,
      abha_id,
      aadhaar_number,
      has_pending_appointment
    } = req.body;

    // Auto-generate patient_id in format M000001, M000002, etc.
    let generatedPatientId;

    // Get the last patient_id from the database
    const lastPatientResult = await pool.query(
      `SELECT patient_id FROM patients
       WHERE patient_id LIKE 'M%'
       ORDER BY patient_id DESC
       LIMIT 1`
    );

    if (lastPatientResult.rows.length > 0 && lastPatientResult.rows[0].patient_id) {
      // Extract the numeric part from the last patient_id (e.g., M000010 -> 10)
      const lastId = lastPatientResult.rows[0].patient_id;
      const numericPart = parseInt(lastId.substring(1)) || 0;
      const nextNumber = numericPart + 1;

      // Format as M + 6-digit zero-padded number
      generatedPatientId = 'M' + nextNumber.toString().padStart(6, '0');
      console.log(`📝 Last patient ID: ${lastId}, Generated new ID: ${generatedPatientId}`);
    } else {
      // No patients yet, start with M000001
      generatedPatientId = 'M000001';
      console.log(`📝 First patient, Generated ID: ${generatedPatientId}`);
    }

    // Auto-generate queue number (resets daily)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get the last queue number for today
    const lastQueueResult = await pool.query(
      `SELECT queue_no FROM patients
       WHERE queue_date = $1
       ORDER BY queue_no DESC
       LIMIT 1`,
      [today]
    );

    let queueNumber;
    if (lastQueueResult.rows.length > 0 && lastQueueResult.rows[0].queue_no) {
      queueNumber = lastQueueResult.rows[0].queue_no + 1;
      console.log(`🎫 Last queue number for today: ${lastQueueResult.rows[0].queue_no}, Generated new queue: ${queueNumber}`);
    } else {
      queueNumber = 1;
      console.log(`🎫 First patient for today, Generated queue: ${queueNumber}`);
    }

    const result = await pool.query(
      `INSERT INTO patients (
        id, patient_id, prefix, first_name, last_name, age, gender, phone, email, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, blood_group, notes, date_of_entry, date_of_birth,
        photo_url, patient_tag, abha_id, aadhaar_number, assigned_doctor, assigned_department,
        has_reference, reference_details, created_by, is_active,
        queue_no, queue_status, queue_date, has_pending_appointment
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING *`,
      [
        generatedPatientId, prefix || 'Mr', first_name || '', last_name || '', age || '0', gender ? gender.toUpperCase() : 'MALE', phone || '', email, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, blood_group, notes, date_of_entry, date_of_birth,
        photo_url, patient_tag, abha_id, aadhaar_number, assigned_doctor, assigned_department,
        has_reference, reference_details, req.user.id, true,
        queueNumber, 'waiting', today, has_pending_appointment || false
      ]
    );

    console.log(`✅ Patient created with ID: ${generatedPatientId}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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

// Delete patient
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting patient with ID:', id);

    // First, delete related records to avoid foreign key constraints
    // Delete patient transactions
    await pool.query('DELETE FROM patient_transactions WHERE patient_id = $1', [id]);
    console.log('✅ Deleted patient transactions');

    // Delete patient admissions
    await pool.query('DELETE FROM patient_admissions WHERE patient_id = $1', [id]);
    console.log('✅ Deleted patient admissions');

    // Delete patient refunds
    await pool.query('DELETE FROM patient_refunds WHERE patient_id = $1', [id]);
    console.log('✅ Deleted patient refunds');

    // Delete complete patient record related data if exists
    try {
      await pool.query('DELETE FROM patient_high_risk WHERE patient_id = $1', [id]);
      await pool.query('DELETE FROM patient_chief_complaints WHERE patient_id = $1', [id]);
      await pool.query('DELETE FROM patient_examination WHERE patient_id = $1', [id]);
      await pool.query('DELETE FROM patient_investigation WHERE patient_id = $1', [id]);
      await pool.query('DELETE FROM patient_diagnosis WHERE patient_id = $1', [id]);
      await pool.query('DELETE FROM patient_enhanced_prescription WHERE patient_id = $1', [id]);
      await pool.query('DELETE FROM patient_record_summary WHERE patient_id = $1', [id]);
      console.log('✅ Deleted patient record data');
    } catch (err) {
      // Tables might not exist, continue
      console.log('⚠️ Some patient record tables not found, continuing...');
    }

    // Finally, delete the patient
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log('✅ Patient deleted successfully');
    res.json({ message: 'Patient deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('❌ Error deleting patient:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Queue Management Endpoints

// Get OPD Queues (with filters)
app.get('/api/opd-queues', authenticateToken, async (req, res) => {
  try {
    const { date, status, doctor_id } = req.query;

    // Default to today if no date provided
    const queryDate = date || new Date().toISOString().split('T')[0];
    const params = [queryDate];
    let paramIndex = 2;

    let query = `
      SELECT
        id,
        patient_id,
        first_name,
        last_name,
        age,
        gender,
        phone,
        patient_id as patient_code,
        queue_no,
        COALESCE(queue_status, 'waiting') as queue_status,
        queue_date,
        assigned_doctor,
        created_at
      FROM patients
      WHERE queue_date = $1
    `;

    if (status) {
      query += ` AND queue_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (doctor_id) {
      // If sorting by doctor, we might need to join or just filter by assigned_doctor name/id combo. 
      // For now, let's assume filtering isn't strictly enforced on ID vs Name mixed types, 
      // or we just don't filter if it's complex. 
      // But let's try to match assigned_doctor column.
      // query += ` AND assigned_doctor = $${paramIndex}`;
      // params.push(doctor_id);
      // paramIndex++;
    }

    query += ` ORDER BY queue_no ASC`;

    const result = await pool.query(query, params);

    // Ensure all rows have required fields with defaults
    const sanitizedRows = result.rows.map(row => ({
      ...row,
      queue_status: row.queue_status || 'waiting',
      queue_no: row.queue_no || 0,
      assigned_doctor: row.assigned_doctor || 'Unassigned'
    }));

    res.json(sanitizedRows);
  } catch (error) {
    console.error('Error fetching OPD queues:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get today's queue (Legacy)
app.get('/api/queue/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        id, patient_id, first_name, last_name, age, gender, phone,
        queue_no, queue_status, queue_date, created_at
      FROM patients
      WHERE queue_date = $1
      ORDER BY queue_no ASC`,
      [today]
    );

    console.log(`📋 Retrieved ${result.rows.length} patients in today's queue`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Add to OPD Queue (Manual Add)
app.post('/api/opd-queues', authenticateToken, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, priority, notes } = req.body;

    // Logic:
    // 1. We are "queueing" the patient, which in this system means updating their queue_no, queue_date, and queue_status in the 'patients' table.
    // 2. We should also generate a new queue number for today.

    const today = new Date().toISOString().split('T')[0];

    // Get last queue number for today
    const lastQueueResult = await pool.query(
      `SELECT queue_no FROM patients
       WHERE queue_date = $1
       ORDER BY queue_no DESC
       LIMIT 1`,
      [today]
    );

    let queueNumber = 1;
    if (lastQueueResult.rows.length > 0 && lastQueueResult.rows[0].queue_no) {
      queueNumber = lastQueueResult.rows[0].queue_no + 1;
    }

    // Resolve Doctor ID to Name (Legacy Compatibility)
    let doctorName = null;
    if (doctor_id) {
      try {
        const docResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [doctor_id]);
        if (docResult.rows.length > 0) {
          const doc = docResult.rows[0];
          doctorName = `Dr. ${doc.first_name} ${doc.last_name}`;
        }
      } catch (err) {
        console.warn('Could not resolve doctor name from ID:', doctor_id);
      }
    }

    // Use doctorName if resolved, otherwise if doctor_id doesn't look like UUID, maybe it's a name? 
    const finalDoctorValue = doctorName || (doctor_id && !doctor_id.match(/^[0-9a-fA-F-]{36}$/) ? doctor_id : null);

    // Update patient record
    // We update assigned_doctor if provided, else keep existing.
    // We set status to 'waiting'.
    // We update queue_no and queue_date.

    const updateQuery = `
      UPDATE patients
      SET 
        queue_no = $1,
        queue_status = 'waiting',
        queue_date = $2,
        assigned_doctor = COALESCE($3, assigned_doctor),
        has_pending_appointment = false, -- If they are in queue, they are arrived
        is_active = true
      WHERE id = $4
      RETURNING *
    `;

    // Note: We are using COALESCE for doctor_id so we don't overwrite if null, 
    // though usually frontend forces selection. 
    // If 'notes' are provided, we could append or replace. For now let's leave notes alone or update if critical.
    // The prompt implementation didn't specify notes field in database schema check, 
    // but patients table has 'notes'. Let's not overwrite main medical notes with queue notes unless intended.
    // We'll skip notes update for now to be safe, or append to a queue-specific log if we had one.

    const result = await pool.query(updateQuery, [queueNumber, today, finalDoctorValue, patient_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log(`✅ Manually added patient ${patient_id} to queue. Token: ${queueNumber}`);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error adding to OPD queue:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update queue status
app.put('/api/opd-queues/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let { queue_status } = req.body;

    // Normalize status to lowercase and map common values
    const statusMap = {
      'WAITING': 'waiting',
      'waiting': 'waiting',
      'IN_CONSULTATION': 'called',
      'called': 'called',
      'COMPLETED': 'completed',
      'completed': 'completed',
      'VITALS_DONE': 'waiting' // Map VITALS_DONE to waiting
    };

    queue_status = statusMap[queue_status] || queue_status.toLowerCase();

    if (!['waiting', 'called', 'completed'].includes(queue_status)) {
      return res.status(400).json({ error: 'Invalid queue status', received: queue_status });
    }

    const result = await pool.query(
      `UPDATE patients
       SET queue_status = $1
       WHERE id = $2
       RETURNING id, patient_id, first_name, last_name, queue_no, queue_status`,
      [queue_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log(`🎫 Updated queue status for patient ${result.rows[0].patient_id} to ${queue_status}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Reorder OPD Queue
app.post('/api/opd-queues/reorder', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid request: items array required' });
    }

    // Update queue_no for each patient based on new order
    const updatePromises = items.map(item =>
      pool.query(
        'UPDATE patients SET queue_no = $1 WHERE id = $2',
        [item.order, item.id]
      )
    );

    await Promise.all(updatePromises);

    console.log(`🔄 Reordered ${items.length} queue items`);
    res.json({ success: true, message: 'Queue reordered successfully' });
  } catch (error) {
    console.error('Error reordering queue:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Accept appointment - moves patient from pending to patient list
app.put('/api/patients/:id/accept-appointment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE patients
       SET has_pending_appointment = false,
           queue_status = 'waiting'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log(`✅ Appointment accepted for patient ${result.rows[0].patient_id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error accepting appointment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Reject appointment - cancels appointment and optionally keeps patient hidden
app.put('/api/patients/:id/reject-appointment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { keep_patient } = req.body; // If true, keep patient but mark as rejected

    if (keep_patient) {
      // Just set is_active to false to hide patient
      const result = await pool.query(
        `UPDATE patients
         SET has_pending_appointment = false,
             is_active = false
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      console.log(`❌ Appointment rejected for patient ${result.rows[0].patient_id} (patient deactivated)`);
      res.json(result.rows[0]);
    } else {
      // Delete patient completely
      await pool.query('DELETE FROM patient_transactions WHERE patient_id = $1', [id]);
      const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING patient_id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      console.log(`❌ Appointment rejected and patient ${result.rows[0].patient_id} deleted`);
      res.json({ message: 'Appointment rejected and patient removed', patient_id: result.rows[0].patient_id });
    }
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.log('patient_refunds table does not exist, returning empty array');
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TRANSACTION ROUTES ====================

// Get transactions for operations ledger (with patient info)
app.get('/api/transactions/for-ledger', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get transactions with patient info, filtered by transaction_date
    const result = await pool.query(`
      SELECT
        t.*,
        json_build_object(
          'id', p.id,
          'patient_id', p.patient_id,
          'first_name', p.first_name,
          'last_name', p.last_name,
          'age', p.age,
          'gender', p.gender,
          'phone', p.phone,
          'patient_tag', p.patient_tag,
          'assigned_doctor', p.assigned_doctor,
          'assigned_department', p.assigned_department,
          'date_of_entry', p.date_of_entry
        ) as patient
      FROM patient_transactions t
      LEFT JOIN patients p ON t.patient_id = p.id
      WHERE (
        (t.transaction_date IS NOT NULL AND t.transaction_date >= $1 AND t.transaction_date <= $2)
        OR
        (t.transaction_date IS NULL AND DATE(t.created_at) >= $1 AND DATE(t.created_at) <= $2)
      )
      ORDER BY t.created_at DESC
    `, [start_date, end_date]);

    console.log(`✅ Found ${result.rows.length} transactions for ledger between ${start_date} and ${end_date}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions for ledger:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

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
      transaction_date,
      discount_type,
      discount_value,
      discount_reason,
      online_payment_method,
      rghs_number, // Added RGHS number
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO patient_transactions (
        patient_id, transaction_type, amount, payment_mode,
        doctor_id, doctor_name, department, description,
        transaction_date, rghs_number, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        patient_id,
        (transaction_type || 'consultation').toLowerCase(),
        amount || 0,
        (payment_mode || 'cash').toLowerCase(),
        doctor_id,
        doctor_name || 'Unassigned',
        department || 'General',
        description || `${transaction_type || 'consultation'} - ${doctor_name || 'Unassigned'}`,
        transaction_date || new Date(),
        rghs_number || null,
        req.user.id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
    // Return hardcoded doctors (matching dataService.ts)
    const hardcodedDoctors = [
      {
        id: 'hemant-khajja',
        name: 'DR. HEMANT KHAJJA',
        first_name: 'HEMANT',
        last_name: 'KHAJJA',
        department: 'ORTHOPAEDIC',
        specialization: 'Orthopaedic Surgeon',
        fee: 800,
        is_active: true
      },
      {
        id: 'lalita-suwalka',
        name: 'DR. LALITA SUWALKA',
        first_name: 'LALITA',
        last_name: 'SUWALKA',
        department: 'DIETICIAN',
        specialization: 'Clinical Dietician',
        fee: 500,
        is_active: true
      },
      {
        id: 'poonam-jain-physiotherapy',
        name: 'DR. POONAM JAIN',
        first_name: 'POONAM',
        last_name: 'JAIN',
        department: 'PHYSIOTHERAPY',
        specialization: 'Physiotherapist',
        fee: 600,
        is_active: true
      }
    ];
    res.json(hardcodedDoctors);
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

// Get single bed by ID
app.get('/api/beds/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM beds WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update bed (for admissions, discharges, status changes)
app.put('/api/beds/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      patient_id,
      ipd_number,
      admission_date,
      admission_id,
      tat_status,
      tat_remaining_seconds,
      consent_form_submitted,
      clinical_record_submitted,
      progress_sheet_submitted,
      nurses_orders_submitted
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (patient_id !== undefined) {
      updates.push(`patient_id = $${paramCount}`);
      values.push(patient_id);
      paramCount++;
    }
    if (ipd_number !== undefined) {
      updates.push(`ipd_number = $${paramCount}`);
      values.push(ipd_number);
      paramCount++;
    }
    if (admission_date !== undefined) {
      updates.push(`admission_date = $${paramCount}`);
      values.push(admission_date);
      paramCount++;
    }
    if (admission_id !== undefined) {
      updates.push(`admission_id = $${paramCount}`);
      values.push(admission_id);
      paramCount++;
    }
    if (tat_status !== undefined) {
      updates.push(`tat_status = $${paramCount}`);
      values.push(tat_status);
      paramCount++;
    }
    if (tat_remaining_seconds !== undefined) {
      updates.push(`tat_remaining_seconds = $${paramCount}`);
      values.push(tat_remaining_seconds);
      paramCount++;
    }
    if (consent_form_submitted !== undefined) {
      updates.push(`consent_form_submitted = $${paramCount}`);
      values.push(consent_form_submitted);
      paramCount++;
    }
    if (clinical_record_submitted !== undefined) {
      updates.push(`clinical_record_submitted = $${paramCount}`);
      values.push(clinical_record_submitted);
      paramCount++;
    }
    if (progress_sheet_submitted !== undefined) {
      updates.push(`progress_sheet_submitted = $${paramCount}`);
      values.push(progress_sheet_submitted);
      paramCount++;
    }
    if (nurses_orders_submitted !== undefined) {
      updates.push(`nurses_orders_submitted = $${paramCount}`);
      values.push(nurses_orders_submitted);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE beds SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    console.log(`✅ Bed ${id} updated successfully`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
// Create appointment with Recurrence Support
app.post('/api/appointments', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      patient_id, doctor_id, department_id, scheduled_at, duration,
      status, reason, appointment_type, notes, recurrence
      // recurrence: { frequency: 'daily' | 'weekly' | 'monthly', endDate: string }
    } = req.body;

    const baseDate = new Date(scheduled_at);
    const appointmentsToCreate = [];
    const recurringGroupId = recurrence ? crypto.randomUUID() : null;

    // Helper to add days
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    // Helper to add months
    const addMonths = (date, months) => {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    };

    if (recurrence && recurrence.endDate) {
      const endDate = new Date(recurrence.endDate);
      let currentDate = baseDate;
      const MAX_OCCURRENCES = 52; // Safety limit
      let count = 0;

      while (currentDate <= endDate && count < MAX_OCCURRENCES) {
        appointmentsToCreate.push(new Date(currentDate));

        if (recurrence.frequency === 'daily') {
          currentDate = addDays(currentDate, 1);
        } else if (recurrence.frequency === 'weekly') {
          currentDate = addDays(currentDate, 7);
        } else if (recurrence.frequency === 'monthly') {
          currentDate = addMonths(currentDate, 1);
        } else {
          break; // Unknown frequency
        }
        count++;
      }
    } else {
      // Single appointment
      appointmentsToCreate.push(baseDate);
    }

    let firstCreatedAppointment = null;

    for (const aptDate of appointmentsToCreate) {
      const result = await client.query(
        `INSERT INTO appointments(
            patient_id, doctor_id, department_id, scheduled_at, duration,
            status, reason, appointment_type, notes, created_by, recurring_group_id
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING * `,
        [
          patient_id, doctor_id, department_id, aptDate.toISOString(), duration,
          status || 'SCHEDULED', reason, appointment_type, notes, req.user.id, recurringGroupId
        ]
      );
      if (!firstCreatedAppointment) firstCreatedAppointment = result.rows[0];
    }

    await client.query('COMMIT');
    res.json(firstCreatedAppointment);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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


// ==================== UHID ROUTES ====================

// Get UHID configuration
app.get('/api/uhid/config', authenticateToken, async (req, res) => {
  try {
    const hospitalId = req.query.hospital_id || '550e8400-e29b-41d4-a716-446655440000';

    const result = await pool.query(
      'SELECT * FROM uhid_config WHERE hospital_id = $1',
      [hospitalId]
    );

    if (result.rows.length === 0) {
      // Return default config if not exists
      return res.json({
        prefix: 'MH',
        year_format: 'YYYY',
        current_sequence: 0,
        hospital_id: hospitalId
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching UHID config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate new UHID
app.post('/api/uhid/generate', authenticateToken, async (req, res) => {
  try {
    const hospitalId = req.body.hospital_id || '550e8400-e29b-41d4-a716-446655440000';

    // Try using the database function first
    try {
      const result = await pool.query(
        'SELECT generate_uhid($1) as uhid',
        [hospitalId]
      );
      return res.json({ uhid: result.rows[0].uhid });
    } catch (funcError) {
      // Function might not exist, fall back to manual generation
      console.log('generate_uhid function not found, using manual generation');
    }

    // Manual UHID generation with atomic update
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create config with row lock
      let configResult = await client.query(
        'SELECT * FROM uhid_config WHERE hospital_id = $1 FOR UPDATE',
        [hospitalId]
      );

      let prefix, sequence;

      if (configResult.rows.length === 0) {
        // Create config if not exists
        const insertResult = await client.query(
          `INSERT INTO uhid_config (prefix, year_format, current_sequence, hospital_id)
           VALUES ('MH', 'YYYY', 1, $1)
           RETURNING prefix, current_sequence`,
          [hospitalId]
        );
        prefix = insertResult.rows[0].prefix;
        sequence = insertResult.rows[0].current_sequence;
      } else {
        // Update sequence
        const updateResult = await client.query(
          `UPDATE uhid_config 
           SET current_sequence = current_sequence + 1, updated_at = NOW()
           WHERE hospital_id = $1
           RETURNING prefix, current_sequence`,
          [hospitalId]
        );
        prefix = updateResult.rows[0].prefix;
        sequence = updateResult.rows[0].current_sequence;
      }

      await client.query('COMMIT');

      // Format UHID: MH-2026-000001
      const year = new Date().getFullYear();
      const uhid = `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;

      res.json({ uhid });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating UHID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update UHID configuration
app.put('/api/uhid/config', authenticateToken, async (req, res) => {
  try {
    // Only admins can update config
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { prefix, year_format, hospital_id } = req.body;
    const hospitalId = hospital_id || '550e8400-e29b-41d4-a716-446655440000';

    const result = await pool.query(
      `INSERT INTO uhid_config (prefix, year_format, hospital_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (hospital_id) DO UPDATE
       SET prefix = $1, year_format = $2, updated_at = NOW()
       RETURNING *`,
      [prefix || 'MH', year_format || 'YYYY', hospitalId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating UHID config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current UHID sequence (for display purposes)
app.get('/api/uhid/next', authenticateToken, async (req, res) => {
  try {
    const hospitalId = req.query.hospital_id || '550e8400-e29b-41d4-a716-446655440000';

    const result = await pool.query(
      'SELECT prefix, current_sequence FROM uhid_config WHERE hospital_id = $1',
      [hospitalId]
    );

    let prefix = 'MH';
    let nextSequence = 1;

    if (result.rows.length > 0) {
      prefix = result.rows[0].prefix;
      nextSequence = result.rows[0].current_sequence + 1;
    }

    const year = new Date().getFullYear();
    const nextUhid = `${prefix}-${year}-${String(nextSequence).padStart(6, '0')}`;

    res.json({ next_uhid: nextUhid, sequence: nextSequence });
  } catch (error) {
    console.error('Error getting next UHID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler: send back React's index.html file for client-side routing
// DISABLED FOR VERCEL: Frontend is deployed separately, backend only serves API routes
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

// ==================== ICD-10 ROUTES ====================

// Search ICD-10 codes
app.get('/api/icd10', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const query = `
      SELECT code, description 
      FROM icd10_codes 
      WHERE (code ILIKE $1 OR description ILIKE $1) AND active = true
      ORDER BY 
        CASE 
          WHEN code ILIKE $2 THEN 1 
          WHEN description ILIKE $2 THEN 2 
          ELSE 3 
        END,
        code ASC
      LIMIT 20
    `;

    const searchTerm = `%${q}%`;
    const startTerm = `${q}%`;

    const result = await pool.query(query, [searchTerm, startTerm]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching ICD-10 codes:', error);
    res.status(500).json({ error: 'Failed to search ICD-10 codes' });
  }
});

// ==================== DAILY EXPENSES ROUTES ====================

// Get daily expenses with date range filter
app.get('/api/daily_expenses', authenticateToken, async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    let query = 'SELECT * FROM daily_expenses';
    const params = [];
    let paramCount = 1;

    if (start_date && end_date) {
      query += ` WHERE expense_date >= $${paramCount} AND expense_date <= $${paramCount + 1}`;
      params.push(start_date, end_date);
      paramCount += 2;
    } else if (date) {
      query += ` WHERE expense_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.log('daily_expenses table does not exist, returning empty array');
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create daily expense
app.post('/api/daily_expenses', authenticateToken, async (req, res) => {
  try {
    const {
      expense_date,
      expense_category,
      description,
      amount,
      payment_mode,
      receipt_number,
      hospital_id,
      approved_by,
      notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO daily_expenses (
        expense_date, expense_category, description, amount,
        payment_mode, receipt_number, hospital_id, approved_by, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        expense_date || new Date().toISOString().split('T')[0],
        expense_category || 'GENERAL',
        description || '',
        amount || 0,
        (payment_mode || 'CASH').toUpperCase(),
        receipt_number || null,
        hospital_id || '550e8400-e29b-41d4-a716-446655440000',
        approved_by || req.user.email,
        notes || '',
        req.user.id
      ]
    );

    console.log('✅ Daily expense created:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    // If table doesn't exist, create it first
    if (error.code === '42P01') {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS daily_expenses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
            expense_category VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            payment_mode VARCHAR(50) DEFAULT 'CASH',
            receipt_number VARCHAR(100),
            hospital_id UUID,
            approved_by VARCHAR(255),
            notes TEXT,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        // Retry the insert
        const { expense_date, expense_category, description, amount, payment_mode, receipt_number, hospital_id, approved_by, notes } = req.body;
        const result = await pool.query(
          `INSERT INTO daily_expenses (expense_date, expense_category, description, amount, payment_mode, receipt_number, hospital_id, approved_by, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            expense_date || new Date().toISOString().split('T')[0],
            expense_category || 'GENERAL',
            description || '',
            amount || 0,
            (payment_mode || 'CASH').toUpperCase(),
            receipt_number || null,
            hospital_id || '550e8400-e29b-41d4-a716-446655440000',
            approved_by || req.user.email,
            notes || '',
            req.user.id
          ]
        );
        return res.json(result.rows[0]);
      } catch (createError) {
        console.error('Error creating table and expense:', createError);
        return res.status(500).json({ error: 'Server error', details: createError.message });
      }
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete daily expense
app.delete('/api/daily_expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM daily_expenses WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// ==================== SAAS ORGANIZATION ROUTES ====================

// Get organization details
app.get('/api/saas/organizations/:orgId', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params;

    // Return basic organization info
    const organization = {
      id: orgId,
      name: 'VALANT Hospital',
      status: 'active',
      subscription: 'premium',
      created_at: new Date().toISOString()
    };

    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get subscription details for an organization
app.get('/api/saas/subscriptions/:orgId', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params;

    // Return subscription configuration
    // In a real SaaS app, this would come from a database
    const subscription = {
      orgId: orgId,
      isOpdEnabled: true,
      isIpdEnabled: true,
      isHrmEnabled: true,
      isTallyEnabled: true,
      isPharmaEnabled: true,
      isLabEnabled: true,
      maxUsers: 50,
      maxBeds: 100
    };

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


// ==================== SCHEDULER: APPOINTMENT REMINDERS ====================
const checkAppointmentReminders = async () => {
  try {
    console.log('⏰ Checking for appointment reminders...');

    // Find appointments in the next 24 hours that haven't had a reminder sent
    const result = await pool.query(
      `SELECT * FROM appointments 
             WHERE scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
             AND (reminder_sent IS NULL OR reminder_sent = false)
             AND status = 'CONFIRMED'`
    );

    if (result.rows.length > 0) {
      console.log(`Found ${result.rows.length} appointments needing reminders.`);

      for (const apt of result.rows) {
        // Mock sending reminder (SMS/Email)
        console.log(`🔔 SENT REMINDER: Appointment for Patient ${apt.patient_id} at ${apt.scheduled_at}`);

        // Mark reminder as sent
        await pool.query(
          `UPDATE appointments SET reminder_sent = true WHERE id = $1`,
          [apt.id]
        );
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};


// Run scheduler every 10 minutes (600000 ms) and once on startup
setInterval(checkAppointmentReminders, 600000);
setTimeout(checkAppointmentReminders, 5000); // Initial check after 5s

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
