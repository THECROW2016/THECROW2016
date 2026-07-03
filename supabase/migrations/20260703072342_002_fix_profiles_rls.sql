/*
# Fix infinite recursion in profiles RLS policies

1. Problem
- The SELECT policy on profiles was referencing profiles table itself
- This caused infinite recursion when checking admin role

2. Solution
- Create a security definer function to check admin role
- Simplify policies to avoid self-referencing
- Use the function instead of direct table query

3. Changes
- Drop the problematic SELECT policy
- Create helper function `is_admin()` with SECURITY DEFINER
- Recreate policies using the helper function
*/

-- Create a helper function to check if user is admin (runs with elevated privileges)
CREATE OR REPLACE FUNCTION is_admin()
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

-- Drop the problematic policies
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON profiles;

-- Recreate with non-recursive approach
CREATE POLICY "users_read_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin());

CREATE POLICY "admins_insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

-- Update and delete policies for admins
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR is_admin());

-- Add delete policy for admins
CREATE POLICY "admins_delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (is_admin());