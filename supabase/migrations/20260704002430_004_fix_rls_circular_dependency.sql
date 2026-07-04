/*
# Fix RLS circular dependency issue

1. Problem
- All RLS policies check: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
- This fails for the first user (no profile exists yet)
- Login fails because auth queries are blocked

2. Solution
- Remove circular profile checks
- Use a simpler approach: just check auth.uid() exists
- For admin operations, use a helper function with SECURITY DEFINER
*/

-- Drop all existing policies that have circular dependencies
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_manage_departments" ON departments;
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

-- Simple helper: check if user is authenticated
-- (no profile lookup needed)
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin check helper (with SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('superadmin', 'admin');
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles policies (no circular dependency)
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin_user());

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id OR is_admin_user());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR is_admin_user()) WITH CHECK (auth.uid() = id OR is_admin_user());

-- Departments policies
CREATE POLICY "departments_select" ON departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "departments_all" ON departments FOR ALL
  TO authenticated USING (is_admin_user());

-- Patients policies
CREATE POLICY "patients_select" ON patients FOR SELECT
  TO authenticated USING (is_authenticated());

CREATE POLICY "patients_insert" ON patients FOR INSERT
  TO authenticated WITH CHECK (is_authenticated());

CREATE POLICY "patients_update" ON patients FOR UPDATE
  TO authenticated USING (is_authenticated());

-- Visits policies
CREATE POLICY "visits_select" ON visits FOR SELECT
  TO authenticated USING (is_authenticated());

CREATE POLICY "visits_insert" ON visits FOR INSERT
  TO authenticated WITH CHECK (is_authenticated());

CREATE POLICY "visits_update" ON visits FOR UPDATE
  TO authenticated USING (is_authenticated());

-- Visit steps policies
CREATE POLICY "visit_steps_select" ON visit_steps FOR SELECT
  TO authenticated USING (is_authenticated());

CREATE POLICY "visit_steps_insert" ON visit_steps FOR INSERT
  TO authenticated WITH CHECK (is_authenticated());

CREATE POLICY "visit_steps_update" ON visit_steps FOR UPDATE
  TO authenticated USING (is_authenticated());

-- Queue entries policies
CREATE POLICY "queue_select" ON queue_entries FOR SELECT
  TO authenticated USING (is_authenticated());

CREATE POLICY "queue_insert" ON queue_entries FOR INSERT
  TO authenticated WITH CHECK (is_authenticated());

CREATE POLICY "queue_update" ON queue_entries FOR UPDATE
  TO authenticated USING (is_authenticated());

CREATE POLICY "queue_delete" ON queue_entries FOR DELETE
  TO authenticated USING (is_authenticated());