-- Regulation Tables Schema for Supabase
-- This adds regulation storage tables to support Shield AI with Texas DFPS regulations

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Regulation Sections Table
-- Stores individual regulation sections from Texas DFPS Minimum Standards
CREATE TABLE IF NOT EXISTS regulation_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL DEFAULT 'TX',
  code_section VARCHAR(50) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  full_text TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- State Regulations Reference Table
-- Quick reference for common regulation topics
CREATE TABLE IF NOT EXISTS state_regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL DEFAULT 'TX',
  topic VARCHAR(255) NOT NULL,
  regulation_codes TEXT[] NOT NULL,
  quick_answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regulation Quick Reference Table
-- Common questions and their corresponding regulations
CREATE TABLE IF NOT EXISTS regulation_quick_refs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL DEFAULT 'TX',
  question TEXT NOT NULL,
  regulation_section_id UUID REFERENCES regulation_sections(id),
  quick_answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulation_sections_state ON regulation_sections(state_code);
CREATE INDEX IF NOT EXISTS idx_regulation_sections_category ON regulation_sections(category);
CREATE INDEX IF NOT EXISTS idx_regulation_sections_code ON regulation_sections(code_section);
CREATE INDEX IF NOT EXISTS idx_state_regulations_state ON state_regulations(state_code);
CREATE INDEX IF NOT EXISTS idx_state_regulations_topic ON state_regulations(topic);
CREATE INDEX IF NOT EXISTS idx_regulation_quick_refs_state ON regulation_quick_refs(state_code);

-- Full text search index for regulation text
CREATE INDEX IF NOT EXISTS idx_regulation_sections_text_search 
  ON regulation_sections USING gin(to_tsvector('english', title || ' ' || full_text));

-- Updated_at trigger function (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger
CREATE TRIGGER update_regulation_sections_updated_at 
  BEFORE UPDATE ON regulation_sections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE regulation_sections IS 'Texas DFPS Minimum Standards regulation sections';
COMMENT ON TABLE state_regulations IS 'Quick reference for common regulation topics';
COMMENT ON TABLE regulation_quick_refs IS 'Common questions mapped to regulations';
