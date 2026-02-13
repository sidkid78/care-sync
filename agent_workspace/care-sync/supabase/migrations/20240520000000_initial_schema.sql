-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('senior', 'caregiver', 'admin');
CREATE TYPE family_role AS ENUM ('primary_caregiver', 'member', 'senior_member', 'pending');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'trialing', 'past_due');
CREATE TYPE post_type AS ENUM ('update', 'task_completed', 'vibe_check', 'alert');
CREATE TYPE shift_type AS ENUM ('general', 'medical', 'social', 'rest', 'admin');

-- 2. TABLES

-- Profiles: Extends auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'caregiver',
    subscription_status subscription_tier DEFAULT 'free',
    stripe_customer_id TEXT,
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Families: The Tenant Container
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Family Members: Junction Table for Multi-tenancy
CREATE TABLE family_members (
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_family family_role DEFAULT 'pending',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (family_id, profile_id)
);

-- Shifts: Coordination Data
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    assigned_to_user_id UUID REFERENCES profiles(id),
    created_by_user_id UUID REFERENCES profiles(id),
    shift_type shift_type DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed Posts: Real-time Activity Stream
CREATE TABLE feed_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'update',
    metadata JSONB DEFAULT '{}', -- For AI-generated summaries/tags
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vault Documents: Zero-Knowledge Metadata
CREATE TABLE vault_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size INT8,
    encryption_iv TEXT NOT NULL,      -- Base64 IV
    encryption_salt TEXT NOT NULL,    -- Base64 Salt
    checksum TEXT NOT NULL,           -- SHA256 of encrypted blob
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Consultations: Processed medical summaries (Doctor Digest)
CREATE TABLE medical_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  transcript TEXT,
  summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb, -- Array of { task: string, priority: string }
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Medications: User's verified medications (Med-Scanner context)
CREATE TABLE user_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUTOMATION: PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS) IMPLEMENTATION

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medications ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user belongs to the family
CREATE OR REPLACE FUNCTION is_member_of_family(f_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM family_members
        WHERE family_id = f_id AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- Profiles: Users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Families: Users can view families they are members of
CREATE POLICY "Family members can view family details" 
ON families FOR SELECT 
USING (EXISTS (SELECT 1 FROM family_members WHERE family_id = id AND profile_id = auth.uid()));

-- Family Members: Viewable by anyone in the same family
CREATE POLICY "Family members can view each other" 
ON family_members FOR SELECT 
USING (is_member_of_family(family_id));

-- Shifts: Isolated by family_id
CREATE POLICY "Family members can manage shifts" 
ON shifts FOR ALL 
USING (is_member_of_family(family_id));

-- Feed Posts: Isolated by family_id
CREATE POLICY "Family members can access feed" 
ON feed_posts FOR ALL 
USING (is_member_of_family(family_id));

-- Vault Documents: Isolated by family_id
CREATE POLICY "Family members can access vault metadata" 
ON vault_documents FOR ALL 
USING (is_member_of_family(family_id));

-- Medical Consultations: Isolated by family_id
CREATE POLICY "Family members can view consultations" 
ON medical_consultations FOR SELECT 
USING (is_member_of_family(family_id));

-- User Medications: Users can view/edit their own medications
CREATE POLICY "Users can manage own medications" 
ON user_medications FOR ALL 
USING (auth.uid() = profile_id);
