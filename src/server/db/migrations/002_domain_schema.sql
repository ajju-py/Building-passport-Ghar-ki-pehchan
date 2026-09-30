-- ==============================================================================
-- Migration: 002_domain_schema
-- Description: Complete normalized domain schema for Building Passport Stage 2
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'owner', 'public')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    passport_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    construction_date TEXT NOT NULL,
    
    -- Normalized Location
    location_address TEXT NOT NULL,
    location_city TEXT NOT NULL,
    location_state TEXT,
    location_postal_code TEXT,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),

    -- Capacity & Area
    total_area TEXT NOT NULL,
    floors INTEGER NOT NULL CHECK (floors >= 1),
    units INTEGER NOT NULL CHECK (units >= 1),
    usage TEXT NOT NULL,
    description TEXT,

    -- Normalized Structural Information
    frame_type TEXT NOT NULL,
    foundation TEXT NOT NULL,
    fire_rating TEXT NOT NULL,
    exterior_cladding TEXT NOT NULL,
    seismic_zone TEXT,

    -- Normalized Builder Information
    builder_company_name TEXT,
    builder_name TEXT,
    builder_contact TEXT,
    builder_details TEXT,

    -- Normalized Owner Information (protected from public QR view)
    owner_name TEXT,
    owner_contact TEXT,
    owner_email TEXT,
    owner_additional_info TEXT,

    -- Digital Identity & Status
    qr_code_data_url TEXT,
    condition TEXT NOT NULL DEFAULT 'Good',
    maintenance_status TEXT NOT NULL DEFAULT 'Up to Date',

    -- Audit Metadata
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_created_by ON buildings(created_by);
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type);
CREATE INDEX IF NOT EXISTS idx_buildings_city ON buildings(location_city);
CREATE INDEX IF NOT EXISTS idx_buildings_condition ON buildings(condition);
CREATE INDEX IF NOT EXISTS idx_buildings_maintenance_status ON buildings(maintenance_status);

-- 3. BUILDING PHOTOGRAPHS TABLE
CREATE TABLE IF NOT EXISTS building_photographs (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    category TEXT NOT NULL CHECK (category IN ('main', 'additional', 'construction')),
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_building_photographs_building_id ON building_photographs(building_id);
CREATE INDEX IF NOT EXISTS idx_building_photographs_category ON building_photographs(category);

-- 4. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    inspection_id TEXT NOT NULL UNIQUE,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    inspector_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    inspector_name TEXT NOT NULL,
    date DATE NOT NULL,
    observations TEXT NOT NULL,
    remarks TEXT,
    defects_count INTEGER NOT NULL DEFAULT 0 CHECK (defects_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_building_id ON inspections(building_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspection_id ON inspections(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date DESC);

-- 5. DEFECTS TABLE
CREATE TABLE IF NOT EXISTS defects (
    id TEXT PRIMARY KEY,
    defect_id TEXT NOT NULL UNIQUE,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    inspection_id TEXT REFERENCES inspections(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Remediated', 'Closed')),
    details TEXT NOT NULL,
    image_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defects_building_id ON defects(building_id);
CREATE INDEX IF NOT EXISTS idx_defects_defect_id ON defects(defect_id);
CREATE INDEX IF NOT EXISTS idx_defects_inspection_id ON defects(inspection_id);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);

-- 6. MAINTENANCE TABLE
CREATE TABLE IF NOT EXISTS maintenance (
    id TEXT PRIMARY KEY,
    maintenance_id TEXT NOT NULL UNIQUE,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    repair_type TEXT NOT NULL,
    repair_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(14, 2) NOT NULL CHECK (cost >= 0),
    status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Deferred')),
    contractor TEXT NOT NULL,
    warranty_details TEXT,
    expected_repairs TEXT,
    future_requirements TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_building_id ON maintenance(building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_maintenance_id ON maintenance(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_repair_date ON maintenance(repair_date DESC);

-- 7. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL UNIQUE,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('blueprint', 'structural', 'permit', 'report', 'other')),
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_reference TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    mime_type TEXT NOT NULL,
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_building_id ON documents(building_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
