-- Migration: Add Nationwide State Support
-- Date: 2026-01-07
-- Description: Adds state_regulations table and state columns to facilities

-- Add state_code and state_name to facilities table (if not exists)
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS state_code VARCHAR(2) DEFAULT 'TX';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS state_name VARCHAR(100) DEFAULT 'Texas';

-- Create state_regulations table
CREATE TABLE IF NOT EXISTS state_regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    regulation_category VARCHAR(100) NOT NULL,
    requirement_text TEXT NOT NULL,
    violation_weight VARCHAR(20),
    citation_reference VARCHAR(200),
    inspection_frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_state_regs_state ON state_regulations(state_code);
CREATE INDEX IF NOT EXISTS idx_state_regs_category ON state_regulations(regulation_category);
