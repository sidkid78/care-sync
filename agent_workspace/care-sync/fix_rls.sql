-- Comprehensive RLS fix for family creation
-- Run this SQL in your Supabase SQL Editor or via CLI

-- 1. Drop existing policies on families table
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family members can view family details" ON families;

-- 2. Create new policies with proper permissions

-- Allow authenticated users to INSERT families (they must be the creator)
CREATE POLICY "authenticated_users_can_create_families"
ON families
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to SELECT families they are members of
CREATE POLICY "users_can_view_their_families"
ON families
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = families.id
    AND profile_id = auth.uid()
  )
);

-- 3. Fix family_members policies
DROP POLICY IF EXISTS "Users can join families" ON family_members;
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;

-- Allow authenticated users to add themselves to families
CREATE POLICY "users_can_add_themselves_to_families"
ON family_members
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Allow users to view members of families they belong to
CREATE POLICY "users_can_view_family_members"
ON family_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_members.family_id
    AND fm.profile_id = auth.uid()
  )
);
