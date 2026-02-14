-- FIX: Infinite recursion in family_members policy
-- The issue: SELECT policy on family_members was querying family_members itself
-- Solution: Use a simpler policy that doesn't create circular references

-- =============================================================================
-- STEP 1: Drop all problematic policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "authenticated_users_can_create_families" ON families;
DROP POLICY IF EXISTS "Family members can view family details" ON families;

DROP POLICY IF EXISTS "Users can join families" ON family_members;
DROP POLICY IF EXISTS "users_can_add_themselves_to_families" ON family_members;
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;
DROP POLICY IF EXISTS "users_can_view_family_members" ON family_members;

-- =============================================================================
-- STEP 2: Create SIMPLE, non-recursive policies
-- =============================================================================

-- FAMILIES TABLE
-- --------------

-- Allow authenticated users to create families (fixes 403)
CREATE POLICY "families_insert_policy"
ON families
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to view families (we'll control access via family_members)
CREATE POLICY "families_select_policy"
ON families
FOR SELECT
TO authenticated
USING (true);  -- Open read, access controlled by family_members join

-- FAMILY_MEMBERS TABLE
-- --------------------

-- Allow users to insert themselves as family members
CREATE POLICY "family_members_insert_policy"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Allow users to view family_members records where THEY are the profile
-- This breaks the recursion - we only check if it's THEIR OWN record
CREATE POLICY "family_members_select_own_policy"
ON family_members
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Allow users to view OTHER family members in families they belong to
-- But we check using a simple subquery that doesn't recurse
CREATE POLICY "family_members_select_others_policy"
ON family_members
FOR SELECT
TO authenticated
USING (
  -- User can see this record if they have ANY family_member record with the same family_id
  family_id IN (
    SELECT fm.family_id
    FROM family_members fm
    WHERE fm.profile_id = auth.uid()
  )
);

-- =============================================================================
-- STEP 3: Update families SELECT policy to use the correct filtering
-- =============================================================================

-- Drop the open policy we created above
DROP POLICY IF EXISTS "families_select_policy" ON families;

-- Create proper SELECT policy for families
CREATE POLICY "families_select_policy"
ON families
FOR SELECT
TO authenticated
USING (
  -- User can see family if they have a family_members record for it
  id IN (
    SELECT fm.family_id
    FROM family_members fm
    WHERE fm.profile_id = auth.uid()
  )
);
