-- IMMEDIATE FIX for 403 and 406 errors
-- Run this in Supabase SQL Editor NOW to fix both issues

-- Fix 1: Allow family creation (403 error)
DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "authenticated_users_can_create_families"
ON families FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Fix 2: Allow joining families
DROP POLICY IF EXISTS "Users can join families" ON family_members;
CREATE POLICY "users_can_add_themselves_to_families"
ON family_members FOR INSERT TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Fix 3: Fix embedded query support (406 error)
DROP POLICY IF EXISTS "Family members can view each other" ON family_members;
CREATE POLICY "users_can_view_family_members"
ON family_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_members.family_id
    AND fm.profile_id = auth.uid()
  )
);
