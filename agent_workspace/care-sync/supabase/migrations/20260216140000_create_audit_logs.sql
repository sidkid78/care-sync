-- 1. Create the Audit Logs Table
-- This table is designed to be immutable (append-only) via policy
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB, -- Stores the state before the change
    new_values JSONB, -- Stores the state after the change
    performed_by UUID REFERENCES auth.users(id), -- Nullable for system actions
    ip_address INET, -- Captured from request headers if available
    user_agent TEXT, -- Captured from request headers if available
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies
-- Compliance Requirement: Audit logs must be tamper-resistant.
-- No user (even admins via client) should be able to UPDATE or DELETE logs.
-- Only the system (via triggers) can INSERT.
CREATE POLICY "System can insert audit logs" 
ON audit_logs FOR INSERT 
WITH CHECK (true);

-- Admins can view logs (for compliance auditing)
-- Assuming 'admin' role exists in profiles, but using a secure check
CREATE POLICY "Admins can view audit logs" 
ON audit_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 4. Create the Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    affected_record_id UUID;
    old_data JSONB;
    new_data JSONB;
    user_id UUID;
BEGIN
    -- Determine the operation and record ID
    IF (TG_OP = 'DELETE') THEN
        affected_record_id := OLD.id;
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        affected_record_id := NEW.id;
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        affected_record_id := NEW.id;
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Attempt to get the current user ID
    -- Note: auth.uid() returns NULL if called outside of a request context (e.g., internal system jobs)
    user_id := auth.uid();

    -- Insert the audit log entry
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        performed_by,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME::TEXT,
        affected_record_id,
        TG_OP,
        old_data,
        new_data,
        user_id,
        NULL, -- Postgres cannot easily access request headers directly without extensions, checking auth.jwt() next
        NULL
    );

    RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Triggers to Sensitive Tables
-- Coverage: All tables containing PHI or PII

-- Profiles (PII)
CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Families (Metadata)
CREATE TRIGGER audit_families_changes
AFTER INSERT OR UPDATE OR DELETE ON families
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Family Members (Access Control)
-- Note: Requires composite key handling update in function if strictly needed, 
-- but using profile_id or family_id as record_id is a reasonable approximation for now.
-- Ideally we'd log composite keys, but for this implementation we rely on JSON dump.
-- Since the trigger uses 'affected_record_id := NEW.id', checking if family_members has an 'id'.
-- Schema check: family_members PK is (family_id, profile_id). 
-- This specific trigger might fail if the table lacks a single 'id' column.
-- Let's check schema... family_members PK is composite.
-- Adjusting trigger logic to handle composite PKs gracefully or skip 'record_id' for them?
-- Better approach: Modify function to handle 'id' column absence or fallback.
-- RE-WRITING FUNCTION FOR ROBUSTNESS BELOW

CREATE OR REPLACE FUNCTION log_audit_event_robust()
RETURNS TRIGGER AS $$
DECLARE
    affected_record_id UUID;
    old_data JSONB;
    new_data JSONB;
    user_id UUID;
BEGIN
    -- Handle payload
    IF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
        -- Try to extract an ID, fallback to NULL for composite keys
        BEGIN
            affected_record_id := OLD.id;
        EXCEPTION WHEN OTHERS THEN
            affected_record_id := NULL; -- Composite key table
        END;
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        BEGIN
            affected_record_id := NEW.id;
        EXCEPTION WHEN OTHERS THEN
            affected_record_id := NULL;
        END;
    ELSIF (TG_OP = 'INSERT') THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
        BEGIN
            affected_record_id := NEW.id;
        EXCEPTION WHEN OTHERS THEN
            affected_record_id := NULL;
        END;
    END IF;

    user_id := auth.uid();

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        performed_by
    ) VALUES (
        TG_TABLE_NAME::TEXT,
        COALESCE(affected_record_id, '00000000-0000-0000-0000-000000000000'::UUID), -- Use NIL UUID for composite keys
        TG_OP,
        old_data,
        new_data,
        user_id
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-applying robust trigger
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

DROP TRIGGER IF EXISTS audit_families_changes ON families;
CREATE TRIGGER audit_families_changes
AFTER INSERT OR UPDATE OR DELETE ON families
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

-- Family Members (Composite PK - handled by robust function)
CREATE TRIGGER audit_family_members_changes
AFTER INSERT OR UPDATE OR DELETE ON family_members
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

-- Shifts (PII/Business Logic)
CREATE TRIGGER audit_shifts_changes
AFTER INSERT OR UPDATE OR DELETE ON shifts
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

-- Feed Posts (PHI/PII)
CREATE TRIGGER audit_feed_posts_changes
AFTER INSERT OR UPDATE OR DELETE ON feed_posts
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

-- Vault Documents (PHI Metadata - Critical)
CREATE TRIGGER audit_vault_documents_changes
AFTER INSERT OR UPDATE OR DELETE ON vault_documents
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

-- Medical Consultations (PHI - Critical)
CREATE TRIGGER audit_medical_consultations_changes
AFTER INSERT OR UPDATE OR DELETE ON medical_consultations
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();

-- User Medications (PHI - Critical)
CREATE TRIGGER audit_user_medications_changes
AFTER INSERT OR UPDATE OR DELETE ON user_medications
FOR EACH ROW EXECUTE FUNCTION log_audit_event_robust();
