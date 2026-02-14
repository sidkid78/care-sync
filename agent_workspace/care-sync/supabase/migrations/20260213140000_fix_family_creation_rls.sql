-- Fix RLS policies for family creation
-- The issue: INSERT policies need proper setup for authenticated users

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create families" ON families;

-- Recreate with proper INSERT policy
-- Allow any authenticated user to insert a family, but they must set themselves as created_by
CREATE POLICY "Users can create families"
ON families
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Ensure the policy for joining families is also correct
DROP POLICY IF EXISTS "Users can join families" ON family_members;

CREATE POLICY "Users can join families"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());
