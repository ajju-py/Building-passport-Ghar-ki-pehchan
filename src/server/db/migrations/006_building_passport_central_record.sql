-- ==============================================================================
-- Migration: 006_building_passport_central_record
-- Description: Central Record expansion: Drawings, Statutory Approvals, Owner
--              Identity Verification, Audit Logs, and Extended Building Metadata
-- ==============================================================================

-- 1. EXTEND BUILDINGS TABLE WITH STRUCTURED CENTRAL RECORD FIELDS
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS plot_number TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS survey_number TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS built_up_area TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS occupancy_status TEXT DEFAULT 'Occupied';
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS construction_status TEXT DEFAULT 'Completed';
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS structural_engineer_name TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS structural_engineer_license TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS architect_name TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS architect_license TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS gis_polygon JSONB;

-- 2. DRAWINGS & BLUEPRINTS WITH REVISION TRACKING
CREATE TABLE IF NOT EXISTS drawings (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    drawing_type TEXT NOT NULL CHECK (drawing_type IN ('architectural', 'structural', 'electrical', 'plumbing', 'fire_safety', 'site_plan', 'as_built', 'other')),
    title TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    revision_code TEXT NOT NULL DEFAULT 'R0',
    is_latest_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approval_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (approval_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SUPERSEDED', 'REJECTED')),
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    storage_reference TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    mime_type TEXT NOT NULL,
    scale TEXT,
    sheet_number TEXT,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_drawings_building ON drawings(building_id);
CREATE INDEX IF NOT EXISTS idx_drawings_type ON drawings(drawing_type);
CREATE INDEX IF NOT EXISTS idx_drawings_latest ON drawings(building_id, drawing_type, is_latest_approved);

-- 3. REGULATORY APPROVALS / PERMISSIONS / NOCS
CREATE TABLE IF NOT EXISTS regulatory_approvals (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    approval_type TEXT NOT NULL CHECK (approval_type IN ('building_permission', 'fire_noc', 'completion_certificate', 'occupancy_certificate', 'structural_stability', 'environmental_clearance', 'heritage_noc', 'airport_authority_noc', 'other')),
    issuing_authority TEXT NOT NULL,
    approval_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'REVOKED', 'PROVISIONAL')),
    document_storage_ref TEXT,
    document_filename TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_approvals_building ON regulatory_approvals(building_id);
CREATE INDEX IF NOT EXISTS idx_reg_approvals_type ON regulatory_approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_reg_approvals_status ON regulatory_approvals(status);

-- 4. OWNER IDENTITY VERIFICATION (Extensible Sandbox / Authority Gateway)
CREATE TABLE IF NOT EXISTS owner_identity_verifications (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    owner_name TEXT NOT NULL,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('sandbox_aadhaar_otp', 'digilocker_sandbox', 'manual_authority_check', 'authorized_civil_id')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED', 'NOT_VERIFIED')),
    document_ref_type TEXT,
    document_masked_id TEXT, -- e.g. "XXXX-XXXX-1234" (NEVER store full Aadhaar number)
    provider_reference TEXT,
    consent_reference TEXT,
    verified_at TIMESTAMPTZ,
    verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_id_verif_building ON owner_identity_verifications(building_id);
CREATE INDEX IF NOT EXISTS idx_owner_id_verif_status ON owner_identity_verifications(status);

-- 5. AUDIT TRAIL LOG
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_name TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 6. EXTEND PHOTOGRAPH CATEGORIES
ALTER TABLE building_photographs DROP CONSTRAINT IF EXISTS building_photographs_category_check;
ALTER TABLE building_photographs ADD CONSTRAINT building_photographs_category_check 
    CHECK (category IN ('main', 'additional', 'construction', 'exterior', 'interior', 'elevation', 'structural', 'inspection', 'site'));
