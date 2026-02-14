-- ============================================================================
-- DIAGNOSTIC: Check what policies currently exist
-- Run this first to see what's wrong
-- ============================================================================

-- Show all policies on families and family_members tables
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename, policyname;

-- Check if the helper function exists
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'get_user_family_ids';

-- ============================================================================
-- After running this, look for:
-- 1. Does "families_insert" have a with_check clause?
-- 2. Does it say "created_by = auth.uid()" or something else?
-- 3. Is the helper function marked as SECURITY DEFINER?
-- ============================================================================
