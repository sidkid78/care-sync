-- ============================================================================
-- DEFINITIVE FIX for "new row violates row-level security policy"
-- Copy this ENTIRE file into Supabase SQL Editor and run it
-- ============================================================================

-- Step 1: Check current policies (for debugging)
-- Run this first to see what's currently set:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('families', 'family_members')
-- ORDER BY tablename, policyname;

-- Step 2: Drop ALL policies on both tables (clean slate)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "authenticated_users_can_create_families" ON families;
DROP POLICY IF EXISTS "Family members can view family details" ON families;
DROP POLICY IF EXISTS "families_insert_policy" ON families;
DROP POLICY IF EXISTS "families_select_policy" ON families;
DROP POLICY IF EXISTS "families_insert" ON families;
DROP POLICY IF EXISTS "families_select" ON families;

DROP POLICY IF EXISTS "Users can join families" ON family_members;
DROP POLICY IF EXISTS "users_can_add_themselves_to_families" ON family_members;
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;
DROP POLICY IF EXISTS "users_can_view_family_members" ON family_members;
DROP POLICY IF EXISTS "family_members_insert_policy" ON family_members;
DROP POLICY IF EXISTS "family_members_select_own_policy" ON family_members;
DROP POLICY IF EXISTS "family_members_select_others_policy" ON family_members;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "family_members_select" ON family_members;

-- Step 3: Ensure RLS is enabled
-- ----------------------------------------------------------------------------
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Create or replace the helper function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT family_id
    FROM family_members
    WHERE profile_id = auth.uid();
END;
$$;

-- Step 5: Grant execute permission on the function
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION get_user_family_ids() TO authenticated;

-- Step 6: Create NEW policies with unique names
-- ----------------------------------------------------------------------------

-- FAMILIES TABLE
CREATE POLICY "allow_authenticated_insert_families"
ON families
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "allow_members_select_families"
ON families
FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_family_ids()));

-- FAMILY_MEMBERS TABLE
CREATE POLICY "allow_authenticated_insert_family_members"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "allow_members_select_family_members"
ON family_members
FOR SELECT
TO authenticated
USING (family_id IN (SELECT get_user_family_ids()));

-- Step 7: Verify the policies were created
-- ----------------------------------------------------------------------------
-- Run this to confirm:
SELECT
    tablename,
    policyname,
    cmd as operation,
    roles,
    CASE
        WHEN qual IS NOT NULL THEN 'USING clause set'
        ELSE 'No USING clause'
    END as using_check,
    CASE
        WHEN with_check IS NOT NULL THEN 'WITH CHECK clause set'
        ELSE 'No WITH CHECK clause'
    END as with_check_status
FROM pg_policies
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! Test by submitting the onboarding form again.
-- You should see a successful family creation.
-- ============================================================================
