import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new Database(join(__dirname, 'hospital.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS hospital_settings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Hospital Management System',
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'receptionist',
    department_id TEXT,
    hospital_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    prefix TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    medical_record_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    blood_type TEXT,
    allergies TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    current_department_id TEXT,
    status TEXT DEFAULT 'waiting',
    priority TEXT DEFAULT 'normal',
    chief_complaint TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (current_department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS visit_steps (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    assigned_staff_id TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS queue_entries (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    is_called INTEGER DEFAULT 0,
    called_at DATETIME,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );
`);

// Add password column to profiles
try {
  db.exec('ALTER TABLE profiles ADD COLUMN password TEXT');
} catch (e) {
  // Column already exists
}

// Add hospital_id column to profiles
try {
  db.exec('ALTER TABLE profiles ADD COLUMN hospital_id TEXT');
} catch (e) {
  // Column already exists
}

// Seed initial data
const seedData = () => {
  // Seed hospital settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM hospital_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`INSERT INTO hospital_settings (id, name, address, phone, email, website) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'default',
      'General Hospital',
      '123 Medical Center Drive, Healthcare City',
      '+1-234-567-8900',
      'info@generalhospital.com',
      'www.generalhospital.com'
    );
  }

  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  if (profileCount.count === 0) {
    // Seed departments
    const departments = [
      { id: uuidv4(), name: 'Reception', code: 'RECEPTION', prefix: 'R', display_order: 1 },
      { id: uuidv4(), name: 'Triage', code: 'TRIAGE', prefix: 'T', display_order: 2 },
      { id: uuidv4(), name: 'Consultation', code: 'CONSULT', prefix: 'C', display_order: 3 },
      { id: uuidv4(), name: 'Laboratory', code: 'LAB', prefix: 'L', display_order: 4 },
      { id: uuidv4(), name: 'Pharmacy', code: 'PHARMACY', prefix: 'P', display_order: 5 },
    ];

    const insertDept = db.prepare('INSERT INTO departments (id, name, code, prefix, display_order) VALUES (?, ?, ?, ?, ?)');
    for (const dept of departments) {
      insertDept.run(dept.id, dept.name, dept.code, dept.prefix, dept.display_order);
    }

    // Seed profiles with passwords (in production, use bcrypt)
    const profiles = [
      { id: uuidv4(), email: 'admin@hospital.com', full_name: 'Admin User', role: 'admin', password: 'demo123' },
      { id: uuidv4(), email: 'superadmin@hospital.com', full_name: 'Super Admin', role: 'superadmin', password: 'demo123' },
      { id: uuidv4(), email: 'reception@hospital.com', full_name: 'Reception Staff', role: 'receptionist', password: 'demo123' },
      { id: uuidv4(), email: 'nurse@hospital.com', full_name: 'Nurse Jane', role: 'nurse', password: 'demo123' },
      { id: uuidv4(), email: 'doctor@hospital.com', full_name: 'Dr. Smith', role: 'doctor', password: 'demo123' },
      { id: uuidv4(), email: 'lab@hospital.com', full_name: 'Lab Technician', role: 'lab_tech', password: 'demo123' },
      { id: uuidv4(), email: 'pharmacy@hospital.com', full_name: 'Pharmacy Staff', role: 'pharmacist', password: 'demo123' },
    ];

    const insertProfile = db.prepare('INSERT INTO profiles (id, email, full_name, role, password) VALUES (?, ?, ?, ?, ?)');
    for (const profile of profiles) {
      insertProfile.run(profile.id, profile.email, profile.full_name, profile.role, profile.password);
    }
  }
};

seedData();

// API Routes

// Auth - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE email = ? AND is_active = 1').get(email) as any;

  if (!profile) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (profile.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Return user without password
  const { password: _, ...safeProfile } = profile;
  res.json({
    user: { id: profile.id, email: profile.email },
    profile: safeProfile
  });
});

// Auth - Get session (check if logged in)
app.get('/api/auth/session', (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const profile = db.prepare('SELECT id, email, full_name, role, department_id, is_active, created_at, updated_at FROM profiles WHERE id = ?').get(userId) as any;

  if (!profile) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    user: { id: profile.id, email: profile.email },
    profile
  });
});

// Profiles
app.get('/api/profiles', (req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles ORDER BY created_at DESC').all();
  res.json(profiles);
});

app.post('/api/profiles', (req, res) => {
  const id = uuidv4();
  const { email, full_name, role, department_id } = req.body;

  try {
    const stmt = db.prepare('INSERT INTO profiles (id, email, full_name, role, department_id) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, email, full_name, role, department_id || null);
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
    res.status(201).json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/profiles/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, role, department_id, is_active } = req.body;

  try {
    const stmt = db.prepare('UPDATE profiles SET full_name = ?, role = ?, department_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(full_name, role, department_id || null, is_active ? 1 : 0, id);
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/profiles/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  res.status(204).send();
});

// Departments
app.get('/api/departments', (req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY display_order').all();
  res.json(departments);
});

app.post('/api/departments', (req, res) => {
  const id = uuidv4();
  const { name, code, prefix, display_order } = req.body;

  try {
    const stmt = db.prepare('INSERT INTO departments (id, name, code, prefix, display_order) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, code, prefix, display_order || 0);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.status(201).json(dept);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, prefix, display_order, is_active } = req.body;

  try {
    const stmt = db.prepare('UPDATE departments SET name = ?, code = ?, prefix = ?, display_order = ?, is_active = ? WHERE id = ?');
    stmt.run(name, code, prefix, display_order || 0, is_active ? 1 : 0, id);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.json(dept);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  res.status(204).send();
});

// Patients
app.get('/api/patients', (req, res) => {
  const patients = db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
  // Parse allergies JSON
  const parsed = patients.map((p: any) => ({ ...p, allergies: JSON.parse(p.allergies || '[]') }));
  res.json(parsed);
});

app.get('/api/patients/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id) as any;
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  patient.allergies = JSON.parse(patient.allergies || '[]');
  res.json(patient);
});

app.post('/api/patients', (req, res) => {
  const id = uuidv4();
  const mrn = 'MRN' + Date.now().toString().slice(-8);
  const { first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, blood_type, allergies } = req.body;

  try {
    const stmt = db.prepare(`INSERT INTO patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, blood_type, allergies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(id, mrn, first_name, last_name, date_of_birth || null, gender || null, phone || null, email || null, address || null, emergency_contact_name || null, emergency_contact_phone || null, blood_type || null, JSON.stringify(allergies || []));
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as any;
    patient.allergies = JSON.parse(patient.allergies || '[]');
    res.status(201).json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, blood_type, allergies } = req.body;

  try {
    const stmt = db.prepare(`UPDATE patients SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?, address = ?, emergency_contact_name = ?, emergency_contact_phone = ?, blood_type = ?, allergies = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(first_name, last_name, date_of_birth || null, gender || null, phone || null, email || null, address || null, emergency_contact_name || null, emergency_contact_phone || null, blood_type || null, JSON.stringify(allergies || []), id);
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as any;
    patient.allergies = JSON.parse(patient.allergies || '[]');
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Visits
app.get('/api/visits', (req, res) => {
  const visits = db.prepare(`
    SELECT v.*, p.first_name, p.last_name, p.medical_record_number, d.name as department_name, d.code as department_code
    FROM visits v
    LEFT JOIN patients p ON v.patient_id = p.id
    LEFT JOIN departments d ON v.current_department_id = d.id
    ORDER BY v.created_at DESC
  `).all();

  const formatted = visits.map((v: any) => ({
    ...v,
    patient: { first_name: v.first_name, last_name: v.last_name, medical_record_number: v.medical_record_number },
    department: v.department_name ? { name: v.department_name, code: v.department_code } : null
  }));

  res.json(formatted);
});

app.post('/api/visits', (req, res) => {
  const id = uuidv4();
  const { patient_id, priority, chief_complaint, created_by } = req.body;

  // Get triage department (first step after registration)
  const triage = db.prepare("SELECT * FROM departments WHERE code = 'TRIAGE'").get() as any;
  if (!triage) return res.status(400).json({ error: 'Triage department not found' });

  // Generate human-readable ticket number: T-001, T-002 (resets daily)
  const countToday = db.prepare("SELECT COUNT(*) as count FROM visits WHERE date(created_at) = date('now')").get() as { count: number };
  const ticketNumber = `T-${(countToday.count + 1).toString().padStart(3, '0')}`;

  try {
    const stmt = db.prepare('INSERT INTO visits (id, ticket_number, patient_id, current_department_id, status, priority, chief_complaint, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, ticketNumber, patient_id, triage.id, 'waiting', priority || 'normal', chief_complaint || null, created_by || null);

    // Create visit steps for all departments (straight workflow)
    const departments = db.prepare('SELECT * FROM departments WHERE code != ? ORDER BY display_order').all('RECEPTION') as any[];
    const insertStep = db.prepare('INSERT INTO visit_steps (id, visit_id, department_id, status) VALUES (?, ?, ?, ?)');
    departments.forEach((dept, index) => {
      insertStep.run(uuidv4(), id, dept.id, index === 0 ? 'in_progress' : 'pending');
    });

    // Add to queue for triage (first step)
    const queueCount = db.prepare("SELECT COUNT(*) as count FROM queue_entries WHERE department_id = ?").get(triage.id) as { count: number };
    const insertQueue = db.prepare('INSERT INTO queue_entries (id, visit_id, department_id, position) VALUES (?, ?, ?, ?)');
    insertQueue.run(uuidv4(), id, triage.id, queueCount.count + 1);

    const visit = db.prepare(`
      SELECT v.*, p.first_name, p.last_name, p.phone, p.medical_record_number
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `).get(id);

    res.status(201).json(visit);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/visits/:id', (req, res) => {
  const { id } = req.params;
  const { current_department_id, status, priority, notes, completed_at } = req.body;

  try {
    const stmt = db.prepare('UPDATE visits SET current_department_id = ?, status = ?, priority = ?, notes = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(current_department_id || null, status, priority, notes || null, completed_at || null, id);
    const visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
    res.json(visit);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Visit Steps
app.get('/api/visit-steps/:visitId', (req, res) => {
  const steps = db.prepare(`
    SELECT vs.*, d.name as department_name, d.code as department_code, d.prefix
    FROM visit_steps vs
    LEFT JOIN departments d ON vs.department_id = d.id
    WHERE vs.visit_id = ?
    ORDER BY d.display_order
  `).all(req.params.visitId);

  const formatted = steps.map((s: any) => ({
    ...s,
    department: { name: s.department_name, code: s.department_code, prefix: s.prefix }
  }));

  res.json(formatted);
});

app.put('/api/visit-steps/:id', (req, res) => {
  const { id } = req.params;
  const { status, started_at, completed_at, notes } = req.body;

  try {
    const stmt = db.prepare('UPDATE visit_steps SET status = ?, started_at = ?, completed_at = ?, notes = ? WHERE id = ?');
    stmt.run(status, started_at || null, completed_at || null, notes || null, id);
    const step = db.prepare('SELECT * FROM visit_steps WHERE id = ?').get(id);
    res.json(step);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Queue
app.get('/api/queue', (req, res) => {
  const { department_id } = req.query;

  let query = `
    SELECT q.*, v.ticket_number, v.status as visit_status, v.priority,
           p.first_name, p.last_name, p.medical_record_number,
           d.name as department_name, d.code as department_code
    FROM queue_entries q
    LEFT JOIN visits v ON q.visit_id = v.id
    LEFT JOIN patients p ON v.patient_id = p.id
    LEFT JOIN departments d ON q.department_id = d.id
  `;

  if (department_id) {
    query += ' WHERE q.department_id = ? ORDER BY q.position';
    const entries = db.prepare(query).all(department_id);
    const formatted = entries.map((e: any) => ({
      ...e,
      visit: { ticket_number: e.ticket_number, status: e.visit_status, priority: e.priority, patient: { first_name: e.first_name, last_name: e.last_name, medical_record_number: e.medical_record_number } },
      department: { name: e.department_name, code: e.department_code }
    }));
    res.json(formatted);
  } else {
    query += ' ORDER BY q.department_id, q.position';
    const entries = db.prepare(query).all();
    const formatted = entries.map((e: any) => ({
      ...e,
      visit: { ticket_number: e.ticket_number, status: e.visit_status, priority: e.priority, patient: { first_name: e.first_name, last_name: e.last_name, medical_record_number: e.medical_record_number } },
      department: { name: e.department_name, code: e.department_code }
    }));
    res.json(formatted);
  }
});

app.post('/api/queue', (req, res) => {
  const id = uuidv4();
  const { visit_id, department_id, room_number } = req.body;

  const count = db.prepare("SELECT COUNT(*) as count FROM queue_entries WHERE department_id = ?").get(department_id) as { count: number };

  try {
    const stmt = db.prepare('INSERT INTO queue_entries (id, visit_id, department_id, position, room_number) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, visit_id, department_id, count.count + 1, room_number || null);
    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id);
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/queue/:id', (req, res) => {
  const { id } = req.params;
  const { is_called, called_at, room_number } = req.body;

  try {
    const stmt = db.prepare('UPDATE queue_entries SET is_called = ?, called_at = ?, room_number = ? WHERE id = ?');
    stmt.run(is_called ? 1 : 0, called_at || null, room_number || null, id);
    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id);
    res.json(entry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/queue/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM queue_entries WHERE id = ?').run(id);
  res.status(204).send();
});

// Call next patient
app.post('/api/queue/call-next', (req, res) => {
  const { department_id, room_number } = req.body;

  // Get first waiting patient in queue
  const next = db.prepare(`
    SELECT q.* FROM queue_entries q
    JOIN visits v ON q.visit_id = v.id
    WHERE q.department_id = ? AND q.is_called = 0 AND v.status = 'waiting'
    ORDER BY q.position
    LIMIT 1
  `).get(department_id) as any;

  if (!next) {
    return res.status(404).json({ error: 'No patients waiting' });
  }

  // Mark as called
  db.prepare('UPDATE queue_entries SET is_called = 1, called_at = CURRENT_TIMESTAMP, room_number = ? WHERE id = ?').run(room_number || null, next.id);

  // Update visit status
  db.prepare("UPDATE visits SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(next.visit_id);

  const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(next.id);
  res.json(entry);
});

// Stats
app.get('/api/stats', (req, res) => {
  const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
  const waitingVisits = db.prepare("SELECT COUNT(*) as count FROM visits WHERE status = 'waiting'").get() as { count: number };
  const inProgressVisits = db.prepare("SELECT COUNT(*) as count FROM visits WHERE status = 'in_progress'").get() as { count: number };
  const completedToday = db.prepare("SELECT COUNT(*) as count FROM visits WHERE status = 'completed' AND date(completed_at) = date('now')").get() as { count: number };

  res.json({
    total_patients: totalPatients.count,
    waiting: waitingVisits.count,
    in_progress: inProgressVisits.count,
    completed_today: completedToday.count
  });
});

// Hospital Settings
app.get('/api/hospital-settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM hospital_settings LIMIT 1').get() as any;
  res.json(settings || null);
});

app.put('/api/hospital-settings', (req, res) => {
  const { name, address, phone, email, website, logo_url } = req.body;

  try {
    db.prepare(`UPDATE hospital_settings SET name = ?, address = ?, phone = ?, email = ?, website = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'default'`).run(
      name, address || null, phone || null, email || null, website || null, logo_url || null
    );
    const settings = db.prepare('SELECT * FROM hospital_settings LIMIT 1').get();
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hospitals (Superadmin)
app.get('/api/hospitals', (req, res) => {
  const hospitals = db.prepare('SELECT * FROM hospitals ORDER BY created_at DESC').all();
  res.json(hospitals);
});

app.post('/api/hospitals', (req, res) => {
  const id = uuidv4();
  const { name, code, address, phone, email } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Name and code are required' });
  }

  try {
    const stmt = db.prepare('INSERT INTO hospitals (id, name, code, address, phone, email) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, code, address || null, phone || null, email || null);
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
    res.status(201).json(hospital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/hospitals/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, address, phone, email, is_active } = req.body;

  try {
    const stmt = db.prepare('UPDATE hospitals SET name = ?, code = ?, address = ?, phone = ?, email = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(name, code, address || null, phone || null, email || null, is_active ? 1 : 0, id);
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
    res.json(hospital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/hospitals/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM hospitals WHERE id = ?').run(id);
  res.status(204).send();
});

// Hospital Logo Upload
app.post('/api/hospitals/:id/logo', (req, res) => {
  const { id } = req.params;
  const { logo_url } = req.body;

  if (!logo_url) {
    return res.status(400).json({ error: 'Logo URL is required' });
  }

  try {
    db.prepare('UPDATE hospitals SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(logo_url, id);
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
    res.json(hospital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hospital Settings Logo Upload
app.post('/api/hospital-settings/logo', (req, res) => {
  const { logo_url } = req.body;

  if (!logo_url) {
    return res.status(400).json({ error: 'Logo URL is required' });
  }

  try {
    db.prepare("UPDATE hospital_settings SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'default'").run(logo_url);
    const settings = db.prepare('SELECT * FROM hospital_settings LIMIT 1').get();
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// SMS Notification (simulated - logs to console)
app.post('/api/sms/send', (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message required' });
  }

  // In production, integrate with SMS provider (Twilio, Africa's Talking, etc.)
  console.log(`[SMS] To: ${phone}`);
  console.log(`[SMS] Message: ${message}`);

  res.json({
    success: true,
    message: 'SMS sent successfully (simulated)',
    phone,
    timestamp: new Date().toISOString()
  });
});

// Send patient notification
app.post('/api/notify/:visitId', (req, res) => {
  const { visitId } = req.params;
  const { type } = req.body; // 'called', 'next', 'reminder'

  const visit = db.prepare(`
    SELECT v.*, p.first_name, p.last_name, p.phone, d.name as department_name, d.code as department_code
    FROM visits v
    LEFT JOIN patients p ON v.patient_id = p.id
    LEFT JOIN departments d ON v.current_department_id = d.id
    WHERE v.id = ?
  `).get(visitId) as any;

  if (!visit) {
    return res.status(404).json({ error: 'Visit not found' });
  }

  let message = '';
  switch (type) {
    case 'called':
      message = `Hello ${visit.first_name}, your ticket ${visit.ticket_number} is now being called at ${visit.department_name}. Please proceed to the department immediately.`;
      break;
    case 'next':
      message = `Hello ${visit.first_name}, you are next in queue at ${visit.department_name}. Ticket: ${visit.ticket_number}. Please be ready.`;
      break;
    case 'reminder':
      message = `Reminder: Your visit ticket ${visit.ticket_number} is still in queue. Current department: ${visit.department_name}.`;
      break;
    default:
      message = `Hospital Update: Ticket ${visit.ticket_number} - ${visit.department_name}`;
  }

  console.log(`[NOTIFICATION] ${type} for ${visit.first_name} ${visit.last_name}`);
  console.log(`[NOTIFICATION] Phone: ${visit.phone}`);
  console.log(`[NOTIFICATION] Message: ${message}`);

  res.json({
    success: true,
    type,
    phone: visit.phone,
    message
  });
});

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback: route all non-API requests to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
