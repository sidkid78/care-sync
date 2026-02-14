-- ============================================================================
-- SMART FIX: Break recursion while maintaining embedded query support
-- Strategy: Use a MATERIALIZED helper that pre-computes family access
-- ============================================================================

-- Step 1: Drop all existing policies
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'families')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON families';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'family_members')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON family_members';
    END LOOP;
END $$;

-- Step 2: Drop and recreate helper function with STABLE (not VOLATILE)
-- This tells Postgres it can cache the result during a query
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_user_family_ids();

CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS TABLE(family_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT fm.family_id
    FROM family_members fm
    WHERE fm.profile_id = auth.uid();
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_family_ids() TO authenticated;

-- Step 3: Create non-recursive policies
-- ----------------------------------------------------------------------------

-- FAMILIES
CREATE POLICY "families_insert"
ON families
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Important: Use the function result, not a subquery
CREATE POLICY "families_select"
ON families
FOR SELECT
TO authenticated
USING (
    -- This uses the SECURITY DEFINER function which bypasses RLS
    id = ANY(ARRAY(SELECT get_user_family_ids()))
);

-- FAMILY_MEMBERS
CREATE POLICY "family_members_insert"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- This is the critical one - must not recurse
CREATE POLICY "family_members_select"
ON family_members
FOR SELECT
TO authenticated
USING (
    -- Use the pre-computed function result
    family_id = ANY(ARRAY(SELECT get_user_family_ids()))
);

-- Step 4: Test the configuration
-- ----------------------------------------------------------------------------
-- This should show no recursive references in the policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    length(qual::text) as using_length,
    length(with_check::text) as check_length
FROM pg_policies
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- Why this works:
--
-- 1. The function is SECURITY DEFINER - it runs with elevated privileges
--    and BYPASSES RLS when querying family_members
--
-- 2. The function is STABLE - Postgres can cache the result for the duration
--    of a single query, improving performance
--
-- 3. We use ARRAY(SELECT ...) instead of IN (SELECT ...) to help Postgres
--    optimize the query plan
--
-- 4. When PostgREST does the embedded query families(...), it:
--    - Calls family_members policy (uses get_user_family_ids())
--    - The function queries family_members with RLS BYPASSED
--    - No recursion occurs!
--    - Then embeds families data (also uses get_user_family_ids())
--    - Still no recursion!
-- ============================================================================
