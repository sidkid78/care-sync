-- ============================================================================
-- COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR AND RUN IT
-- This will fix ALL your 403, 406, and 500 errors
-- ============================================================================

-- STEP 1: Clean up ALL existing policies (fresh start)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on families table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'families'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON families', pol.policyname);
    END LOOP;

    -- Drop all policies on family_members table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'family_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON family_members', pol.policyname);
    END LOOP;
END $$;

-- STEP 2: Create helper function (bypasses RLS to prevent recursion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This is KEY - it bypasses RLS
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT family_id
    FROM family_members
    WHERE profile_id = auth.uid();
END;
$$;

-- STEP 3: Create simple, working policies
-- ----------------------------------------------------------------------------

-- FAMILIES TABLE
-- Allow creating families
CREATE POLICY "families_insert"
ON families
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow viewing families you're a member of
CREATE POLICY "families_select"
ON families
FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_family_ids()));

-- FAMILY_MEMBERS TABLE
-- Allow adding yourself to families
CREATE POLICY "family_members_insert"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Allow viewing family members in your families
CREATE POLICY "family_members_select"
ON family_members
FOR SELECT
TO authenticated
USING (family_id IN (SELECT get_user_family_ids()));

-- STEP 4: Verify RLS is enabled (should already be, but let's be sure)
-- ----------------------------------------------------------------------------
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DONE! Your 403, 406, and 500 errors should now be fixed.
-- Test by trying to create a family in your app.
-- ============================================================================
