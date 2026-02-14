-- Seed Data for Care Sync
-- Corrected:
-- 1. Removed 'email' and 'created_at' from profiles table insert
-- 2. Updated 'shifts' table insert to match schema
-- 3. Updated 'role' in profiles to use valid enum values ('caregiver')

-- Create test users in auth.users
-- Note: We use specific UUIDs to make the seed reproducible
BEGIN;

-- 1. Create Test Users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'test_caregiver@example.com',
    '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHI', -- Dummy hash
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alice Caregiver"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'test_member@example.com',
    '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHI', -- Dummy hash
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bob Member"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Profiles
-- Removed email and created_at columns
-- Updated role to 'caregiver' (valid user_role enum)
INSERT INTO public.profiles (id, full_name, role, updated_at)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Alice Caregiver',
    'caregiver',
    now()
),
(
    '22222222-2222-2222-2222-222222222222',
    'Bob Member',
    'caregiver',
    now()
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 3. Create a Family
-- Alice creates "The Smith Family"
INSERT INTO public.families (id, name, created_by, invite_code, created_at)
VALUES
(
    '33333333-3333-3333-3333-333333333333',
    'The Smith Family',
    '11111111-1111-1111-1111-111111111111',
    'SMITH123',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Add Family Members
-- Alice is the Primary Caregiver
INSERT INTO public.family_members (family_id, profile_id, role_in_family, joined_at)
VALUES
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'primary_caregiver',
    now()
),
-- Bob is a Member
(
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'member',
    now()
)
ON CONFLICT (family_id, profile_id) DO NOTHING;

-- 5. Create some Shifts
-- Updated columns: added title, changed caregiver_id to assigned_to_user_id/created_by_user_id
INSERT INTO public.shifts (id, family_id, title, assigned_to_user_id, created_by_user_id, start_time, end_time, created_at)
VALUES
(
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'Morning Care',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    now() + interval '1 day',
    now() + interval '1 day 8 hours',
    now()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
