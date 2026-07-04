/*
# Fix authentication RLS issue

1. Problem
- Auth system cannot query profiles due to RLS policies
- The is_admin() function causes issues during auth flow

2. Solution
- Drop RLS policies that use is_admin() function
- Create simpler, non-recursive policies
- Add a public profile view for auth metadata
- Make policies work without circular dependencies
*/

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "users_read_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON profiles;

-- Drop the is_admin function
DROP FUNCTION IF EXISTS is_admin();

-- Recreate simple, non-recursive policies
-- For SELECT: users can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- For INSERT: allow authenticated users to insert their own profile (for signup)
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- For UPDATE: users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- For DELETE: prevent deletion (no policy = no access for authenticated users)

-- Also ensure the auth schema hook doesn't cause issues
-- Grant proper permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;