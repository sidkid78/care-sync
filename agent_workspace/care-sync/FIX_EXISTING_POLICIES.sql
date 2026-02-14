-- ============================================================================
-- FIX for "policy already exists" - Updates existing policies instead
-- Copy this ENTIRE file into Supabase SQL Editor and run it
-- ============================================================================

-- Step 1: Drop existing policies (they exist but might be wrong)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "families_insert" ON families;
DROP POLICY IF EXISTS "families_select" ON families;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "family_members_select" ON family_members;

-- Also drop any other variants that might exist
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "authenticated_users_can_create_families" ON families;
DROP POLICY IF EXISTS "Family members can view family details" ON families;
DROP POLICY IF EXISTS "allow_authenticated_insert_families" ON families;
DROP POLICY IF EXISTS "allow_members_select_families" ON families;

DROP POLICY IF EXISTS "Users can join families" ON family_members;
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;
DROP POLICY IF EXISTS "allow_authenticated_insert_family_members" ON family_members;
DROP POLICY IF EXISTS "allow_members_select_family_members" ON family_members;

-- Step 2: Recreate the helper function (in case it's missing or wrong)
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

-- Step 3: Grant permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION get_user_family_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_family_ids() TO anon;

-- Step 4: Create the correct policies with the right names
-- ----------------------------------------------------------------------------

-- FAMILIES: Allow INSERT
CREATE POLICY "families_insert"
ON families
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- FAMILIES: Allow SELECT
CREATE POLICY "families_select"
ON families
FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_family_ids()));

-- FAMILY_MEMBERS: Allow INSERT
CREATE POLICY "family_members_insert"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- FAMILY_MEMBERS: Allow SELECT
CREATE POLICY "family_members_select"
ON family_members
FOR SELECT
TO authenticated
USING (family_id IN (SELECT get_user_family_ids()));

-- Step 5: Verify everything is correct
-- ----------------------------------------------------------------------------
SELECT
    tablename,
    policyname,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- Expected output from verification query:
--
-- tablename       | policyname              | cmd    | has_using | has_with_check
-- ----------------+-------------------------+--------+-----------+----------------
-- families        | families_insert         | INSERT | false     | true
-- families        | families_select         | SELECT | true      | false
-- family_members  | family_members_insert   | INSERT | false     | true
-- family_members  | family_members_select   | SELECT | true      | false
--
-- This is correct! ✅
-- ============================================================================
