-- Fix for both 403 (family creation) and 406 (embedded query) errors
-- This migration addresses the issues found in the network logs

-- =============================================================================
-- PART 1: Fix 403 - Family Creation RLS Policy
-- =============================================================================

-- Drop the incomplete policy from previous migration
DROP POLICY IF EXISTS "Users can create families" ON families;

-- Create proper INSERT policy for authenticated users
CREATE POLICY "authenticated_users_can_create_families"
ON families
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- =============================================================================
-- PART 2: Fix 406 - Family Members Embedded Query
-- =============================================================================

-- The 406 error occurs because family_members SELECT policy uses is_member_of_family()
-- which creates a circular dependency when embedding families(*)
-- We need to add a direct policy that doesn't rely on the helper function

-- Drop existing policy
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;

-- Create new policy that allows embedded queries
CREATE POLICY "users_can_view_family_members"
ON family_members
FOR SELECT
TO authenticated
USING (
  -- User can see family_members if they belong to that family
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_members.family_id
    AND fm.profile_id = auth.uid()
  )
);

-- =============================================================================
-- PART 3: Ensure families table SELECT policy exists
-- =============================================================================

-- The embedded query families(id,name,invite_code) also needs proper SELECT access
-- Verify the existing policy is sufficient (it should already exist from initial schema)

-- This policy should already exist from 20240520000000_initial_schema.sql:
-- CREATE POLICY "Family members can view family details"
-- ON families FOR SELECT
-- USING (EXISTS (SELECT 1 FROM family_members WHERE family_id = id AND profile_id = auth.uid()));

-- If for some reason it doesn't exist, create it:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'families'
    AND policyname = 'Family members can view family details'
  ) THEN
    CREATE POLICY "Family members can view family details"
    ON families FOR SELECT
    USING (EXISTS (SELECT 1 FROM family_members WHERE family_id = id AND profile_id = auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- PART 4: Fix INSERT policy for family_members (join families)
-- =============================================================================

-- Drop incomplete policy
DROP POLICY IF EXISTS "Users can join families" ON family_members;

-- Create proper INSERT policy
CREATE POLICY "users_can_add_themselves_to_families"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());
