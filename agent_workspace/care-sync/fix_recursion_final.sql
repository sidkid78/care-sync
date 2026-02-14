-- FINAL FIX: Break infinite recursion in family_members policies
-- Root cause: Policies that query the same table they're protecting cause recursion
-- Solution: Use SECURITY DEFINER function to bypass RLS during the check

-- =============================================================================
-- STEP 1: Clean slate - drop ALL existing policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "authenticated_users_can_create_families" ON families;
DROP POLICY IF EXISTS "Family members can view family details" ON families;
DROP POLICY IF EXISTS "families_insert_policy" ON families;
DROP POLICY IF EXISTS "families_select_policy" ON families;

DROP POLICY IF EXISTS "Users can join families" ON family_members;
DROP POLICY IF EXISTS "users_can_add_themselves_to_families" ON family_members;
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;
DROP POLICY IF EXISTS "users_can_view_family_members" ON family_members;
DROP POLICY IF EXISTS "family_members_insert_policy" ON family_members;
DROP POLICY IF EXISTS "family_members_select_own_policy" ON family_members;
DROP POLICY IF EXISTS "family_members_select_others_policy" ON family_members;

-- =============================================================================
-- STEP 2: Create helper function (SECURITY DEFINER bypasses RLS)
-- =============================================================================

-- This function already exists from initial schema, but let's ensure it's correct
CREATE OR REPLACE FUNCTION is_member_of_family(f_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM family_members
        WHERE family_id = f_id AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new helper to get user's family IDs (also bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT family_id FROM family_members
    WHERE profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 3: Create NON-RECURSIVE policies using SECURITY DEFINER functions
-- =============================================================================

-- FAMILIES TABLE POLICIES
-- -----------------------

-- Allow authenticated users to INSERT families
CREATE POLICY "families_insert"
ON families FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to SELECT families they're members of
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "families_select"
ON families FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_family_ids()));

-- FAMILY_MEMBERS TABLE POLICIES
-- -----------------------------

-- Allow users to INSERT themselves as family members
CREATE POLICY "family_members_insert"
ON family_members FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Allow users to SELECT family_members in their families
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "family_members_select"
ON family_members FOR SELECT
TO authenticated
USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================================
-- VERIFICATION: Test the policies work
-- =============================================================================

-- You can test with:
-- SELECT * FROM family_members WHERE profile_id = auth.uid();
-- SELECT families.* FROM families INNER JOIN family_members ON families.id = family_members.family_id WHERE family_members.profile_id = auth.uid();
