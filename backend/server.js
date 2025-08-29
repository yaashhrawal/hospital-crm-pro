const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Azure PostgreSQL connection
const pool = new Pool({
  host: process.env.AZURE_DB_HOST || 'valantdb.postgres.database.azure.com',
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
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
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
    
    // For admin user with temp password, accept 'admin123'
    if (email === 'admin@hospital.com' && password === 'admin123') {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    }

    // For other users, check bcrypt password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
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
    const result = await pool.query(
      'SELECT * FROM patients WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Server error' });
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
      patient_id,
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
      date_of_entry
    } = req.body;

    const result = await pool.query(
      `INSERT INTO patients (
        patient_id, first_name, last_name, age, gender, phone, email, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, blood_group, notes, date_of_entry, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        patient_id, first_name, last_name, age, gender, phone, email, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, blood_group, notes, date_of_entry, req.user.id
      ]
    );

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hospital CRM API is running' });
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});