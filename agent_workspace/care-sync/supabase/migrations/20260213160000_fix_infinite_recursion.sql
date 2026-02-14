-- Fix infinite recursion in family_members RLS policies
-- Issue: Policies that query the same table they protect cause recursion
-- Solution: Use SECURITY DEFINER functions that bypass RLS during checks

-- Drop all potentially conflicting policies
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

-- Helper function to get user's family IDs (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT family_id FROM family_members
    WHERE profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FAMILIES: Allow INSERT and SELECT
CREATE POLICY "families_insert"
ON families FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "families_select"
ON families FOR SELECT TO authenticated
USING (id IN (SELECT get_user_family_ids()));

-- FAMILY_MEMBERS: Allow INSERT and SELECT
CREATE POLICY "family_members_insert"
ON family_members FOR INSERT TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "family_members_select"
ON family_members FOR SELECT TO authenticated
USING (family_id IN (SELECT get_user_family_ids()));
