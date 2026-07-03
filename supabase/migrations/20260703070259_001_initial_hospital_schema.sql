/*
# Hospital Management System - Initial Schema

1. New Tables
- `profiles` - User profiles with role-based access (superadmin, admin, doctor, nurse, receptionist, lab_tech, pharmacist)
- `departments` - Hospital departments (reception, triage, consultation, lab, pharmacy)
- `patients` - Patient records
- `visits` - Patient visits/tickets with workflow tracking
- `visit_steps` - Individual steps in the patient workflow
- `queue_entries` - Active queue for display screens

2. Security
- Enable RLS on all tables
- Owner-scoped policies for authenticated users based on role
- Admin/superadmin have broader access

3. Important Notes
1) Profile roles: 'superadmin', 'admin', 'receptionist', 'nurse', 'doctor', 'lab_tech', 'pharmacist'
2) Visit status flow: 'waiting', 'in_progress', 'completed', 'transferred'
3) Every visit tracks current department and position in queue
4) Queue display shows only active patients waiting
*/

-- Extend auth.users with a profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'receptionist' CHECK (role IN ('superadmin', 'admin', 'receptionist', 'nurse', 'doctor', 'lab_tech', 'pharmacist')),
  department_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  prefix text NOT NULL, -- For ticket numbering (R, T, C, L, P)
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_number text UNIQUE DEFAULT 'MRN' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  blood_type text,
  allergies text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visits (tickets) table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  current_department_id uuid REFERENCES departments(id),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'transferred', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  chief_complaint text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Visit steps (workflow tracking)
CREATE TABLE IF NOT EXISTS visit_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  assigned_staff_id uuid REFERENCES profiles(id),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Queue entries for display screen
CREATE TABLE IF NOT EXISTS queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id),
  position int NOT NULL,
  is_called boolean NOT NULL DEFAULT false,
  called_at timestamptz,
  room_number text,
  created_at timestamptz DEFAULT now()
);

-- Insert default departments
INSERT INTO departments (name, code, prefix, display_order) VALUES
  ('Reception', 'RECEPTION', 'R', 1),
  ('Triage', 'TRIAGE', 'T', 2),
  ('Consultation', 'CONSULTATION', 'C', 3),
  ('Laboratory', 'LAB', 'L', 4),
  ('Pharmacy', 'PHARMACY', 'P', 5)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can read own profile, admins can read all)
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('superadmin', 'admin')));

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "admins_insert_profiles" ON profiles;
CREATE POLICY "admins_insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('superadmin', 'admin')));

-- Departments policies (all authenticated can read)
DROP POLICY IF EXISTS " authenticated_read_departments" ON departments;
CREATE POLICY "authenticated_read_departments" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admins_manage_departments" ON departments;
CREATE POLICY "admins_manage_departments" ON departments FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('superadmin', 'admin')));

-- Patients policies
DROP POLICY IF EXISTS "staff_read_patients" ON patients;
CREATE POLICY "staff_read_patients" ON patients FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_write_patients" ON patients;
CREATE POLICY "staff_write_patients" ON patients FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_update_patients" ON patients;
CREATE POLICY "staff_update_patients" ON patients FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

-- Visits policies
DROP POLICY IF EXISTS "staff_read_visits" ON visits;
CREATE POLICY "staff_read_visits" ON visits FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_write_visits" ON visits;
CREATE POLICY "staff_write_visits" ON visits FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_update_visits" ON visits;
CREATE POLICY "staff_update_visits" ON visits FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

-- Visit steps policies
DROP POLICY IF EXISTS "staff_read_steps" ON visit_steps;
CREATE POLICY "staff_read_steps" ON visit_steps FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_write_steps" ON visit_steps;
CREATE POLICY "staff_write_steps" ON visit_steps FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_update_steps" ON visit_steps;
CREATE POLICY "staff_update_steps" ON visit_steps FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

-- Queue entries policies
DROP POLICY IF EXISTS "staff_read_queue" ON queue_entries;
CREATE POLICY "staff_read_queue" ON queue_entries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_write_queue" ON queue_entries;
CREATE POLICY "staff_write_queue" ON queue_entries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_update_queue" ON queue_entries;
CREATE POLICY "staff_update_queue" ON queue_entries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "staff_delete_queue" ON queue_entries;
CREATE POLICY "staff_delete_queue" ON queue_entries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits(current_department_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_queue_department ON queue_entries(department_id);
CREATE INDEX IF NOT EXISTS idx_queue_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_steps_visit ON visit_steps(visit_id);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number(dept_prefix text)
RETURNS text AS $$
DECLARE
  today_count int;
  ticket_num text;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM visits v
  JOIN departments d ON v.current_department_id = d.id
  WHERE d.prefix = dept_prefix
    AND DATE(v.created_at) = CURRENT_DATE;
  
  ticket_num := dept_prefix || to_char(CURRENT_DATE, 'YYMMDD') || '-' || lpad(today_count::text, 3, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();