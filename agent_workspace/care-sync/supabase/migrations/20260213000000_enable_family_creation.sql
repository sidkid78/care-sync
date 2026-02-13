-- Allow authenticated users to create families
-- The check ensures users can only set themselves as the creator
CREATE POLICY "Users can create families" 
ON families FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to add themselves as family members
-- This covers both creating a family (add self as admin) and joining one
CREATE POLICY "Users can join families" 
ON family_members FOR INSERT 
WITH CHECK (profile_id = auth.uid());
