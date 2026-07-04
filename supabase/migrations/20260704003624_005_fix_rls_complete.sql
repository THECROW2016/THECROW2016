/*
# Fix auth schema error - drop all policies first then recreate
*/

-- Drop ALL RLS policies first (before dropping functions)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "departments_select" ON departments;
DROP POLICY IF EXISTS "departments_all" ON departments;
DROP POLICY IF EXISTS "authenticated_read_departments" ON departments;
DROP POLICY IF EXISTS "admins_manage_departments" ON departments;
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "visits_select" ON visits;
DROP POLICY IF EXISTS "visits_insert" ON visits;
DROP POLICY IF EXISTS "visits_update" ON visits;
DROP POLICY IF EXISTS "visit_steps_select" ON visit_steps;
DROP POLICY IF EXISTS "visit_steps_insert" ON visit_steps;
DROP POLICY IF EXISTS "visit_steps_update" ON visit_steps;
DROP POLICY IF EXISTS "queue_select" ON queue_entries;
DROP POLICY IF EXISTS "queue_insert" ON queue_entries;
DROP POLICY IF EXISTS "queue_update" ON queue_entries;
DROP POLICY IF EXISTS "queue_delete" ON queue_entries;
DROP POLICY IF EXISTS "staff_read_patients" ON patients;
DROP POLICY IF EXISTS "staff_write_patients" ON patients;
DROP POLICY IF EXISTS "staff_update_patients" ON patients;
DROP POLICY IF EXISTS "staff_read_visits" ON visits;
DROP POLICY IF EXISTS "staff_write_visits" ON visits;
DROP POLICY IF EXISTS "staff_update_visits" ON visits;
DROP POLICY IF EXISTS "staff_read_steps" ON visit_steps;
DROP POLICY IF EXISTS "staff_write_steps" ON visit_steps;
DROP POLICY IF EXISTS "staff_update_steps" ON visit_steps;
DROP POLICY IF EXISTS "staff_read_queue" ON queue_entries;
DROP POLICY IF EXISTS "staff_write_queue" ON queue_entries;
DROP POLICY IF EXISTS "staff_update_queue" ON queue_entries;
DROP POLICY IF EXISTS "staff_delete_queue" ON queue_entries;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON profiles;

-- Now drop functions
DROP FUNCTION IF EXISTS is_authenticated();
DROP FUNCTION IF EXISTS is_admin_user();

-- Recreate simple policies using only auth.uid() - no custom functions
-- Profiles: users can only access their own record
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- Departments: everyone can read
CREATE POLICY "departments_select" ON departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "departments_all" ON departments FOR ALL
  TO authenticated USING (true);

-- Patients: all authenticated users
CREATE POLICY "patients_select" ON patients FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "patients_insert" ON patients FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "patients_update" ON patients FOR UPDATE
  TO authenticated USING (true);

-- Visits: all authenticated users
CREATE POLICY "visits_select" ON visits FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "visits_insert" ON visits FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "visits_update" ON visits FOR UPDATE
  TO authenticated USING (true);

-- Visit steps: all authenticated users
CREATE POLICY "visit_steps_select" ON visit_steps FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "visit_steps_insert" ON visit_steps FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "visit_steps_update" ON visit_steps FOR UPDATE
  TO authenticated USING (true);

-- Queue entries: all authenticated users
CREATE POLICY "queue_select" ON queue_entries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "queue_insert" ON queue_entries FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "queue_update" ON queue_entries FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "queue_delete" ON queue_entries FOR DELETE
  TO authenticated USING (true);