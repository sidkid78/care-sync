-- ============================================================================
-- FINAL FIX: Eliminate infinite recursion completely
-- The problem: Even with SECURITY DEFINER, the policies are recursive
-- Solution: Use a different approach that doesn't query family_members from family_members
-- ============================================================================

-- Step 1: Drop ALL policies (clean slate)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on families
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'families')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON families';
    END LOOP;

    -- Drop all policies on family_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'family_members')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON family_members';
    END LOOP;
END $$;

-- Step 2: Create SIMPLE policies that don't cause recursion
-- ----------------------------------------------------------------------------

-- FAMILIES TABLE
-- --------------

-- INSERT: Allow authenticated users to create families where they are the creator
CREATE POLICY "families_insert"
ON families
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- SELECT: Allow ALL authenticated users to see all families
-- We'll restrict actual access through the application layer and family_members
CREATE POLICY "families_select"
ON families
FOR SELECT
TO authenticated
USING (true);

-- FAMILY_MEMBERS TABLE
-- --------------------

-- INSERT: Allow users to add themselves to any family
-- (Application logic should validate invite codes)
CREATE POLICY "family_members_insert"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- SELECT: Allow users to see ONLY their own family_members records
-- This is KEY - we don't check other family_members, avoiding recursion!
CREATE POLICY "family_members_select"
ON family_members
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Step 3: Verify the policies
-- ----------------------------------------------------------------------------
SELECT
    tablename,
    policyname,
    cmd,
    permissive,
    CASE
        WHEN qual::text LIKE '%family_members%' THEN '⚠️ RECURSIVE!'
        ELSE '✅ Safe'
    END as recursion_check
FROM pg_policies
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPLANATION:
--
-- The key change is in "family_members_select":
--   OLD (recursive): USING (family_id IN (SELECT ... FROM family_members WHERE ...))
--   NEW (safe):      USING (profile_id = auth.uid())
--
-- This means users can only see their OWN family_members records.
-- To see other members, the app will:
--   1. Get user's family_members record (safe, no recursion)
--   2. Use that family_id to query other members via application logic
--
-- The embedded query families(id,name,invite_code) will still work because
-- families has USING (true), which is non-recursive.
-- ============================================================================
