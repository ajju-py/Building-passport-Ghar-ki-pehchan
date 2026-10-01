-- ==============================================================================
-- Migration: 003_health_assessments
-- Description: Historical AI Health & Risk Assessments for Building Passport Stage 3
-- ==============================================================================

CREATE TABLE IF NOT EXISTS health_assessments (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Master Health Metric
    overall_score NUMERIC(5, 2) NOT NULL CHECK (overall_score >= 0.00 AND overall_score <= 100.00),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Moderate', 'Elevated', 'High', 'Critical')),
    
    -- Subcategory Breakdown (JSONB)
    -- Expected keys: structural, defect_burden, maintenance, safety, lifecycle, documentation (each 0-100)
    category_scores JSONB NOT NULL,
    
    -- Contributing Factors & Explanations (JSONB)
    -- Array of objects: [{"category": "defect_burden", "factor": "Open high severity defects", "impact": -12}, ...]
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Actionable Recommendations (JSONB)
    -- Array of strings: ["Immediate structural crack repair on Column C-4", ...]
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Data Confidence / Completeness (0-100)
    data_completeness_score NUMERIC(5, 2) NOT NULL CHECK (data_completeness_score >= 0.00 AND data_completeness_score <= 100.00),
    
    -- Engine & Audit Provenance
    model_version TEXT NOT NULL DEFAULT 'bp-rules-v1.0',
    engine_type TEXT NOT NULL DEFAULT 'rule_based_deterministic',
    summary_explanation TEXT NOT NULL,
    
    -- Audit Metadata
    assessed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_health_assessments_building_id ON health_assessments(building_id);
CREATE INDEX IF NOT EXISTS idx_health_assessments_date ON health_assessments(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_assessments_risk_level ON health_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_health_assessments_bld_date ON health_assessments(building_id, assessment_date DESC);

