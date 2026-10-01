-- ==============================================================================
-- Migration: 001_initial_schema
-- Description: Foundation schema initialization for Building Passport Stage 2
-- ==============================================================================

-- Verify foundation and set timezone default
SET timezone = 'UTC';

-- Foundation check table for migration infrastructure verification
CREATE TABLE IF NOT EXISTS system_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert baseline version metadata if not exists
INSERT INTO system_metadata (key, value)
VALUES ('schema_version', '001_initial_schema')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();
