-- ============================================
-- TRAINING HUB DATABASE FOUNDATION
-- Stage 1: Tables, Indexes, and Seed Data
-- ============================================

-- ============================================
-- MONTHLY CURRICULUM TABLES
-- ============================================

-- Training modules (12 per year, structure only for now)
CREATE TABLE IF NOT EXISTS training_modules_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    theme VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'available',
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(month, year)
);

-- Shield Champion training content (text-based educational content)
CREATE TABLE IF NOT EXISTS training_champion_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    section_number INTEGER NOT NULL,
    section_title VARCHAR(200) NOT NULL,
    section_content TEXT NOT NULL,
    weight_percentage INTEGER DEFAULT 25,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team communication messages (ready-to-copy messages)
CREATE TABLE IF NOT EXISTS training_team_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    message_title VARCHAR(200) NOT NULL,
    message_content TEXT NOT NULL,
    customization_tips TEXT,
    weight_percentage INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff response tracking (who responded to team message)
CREATE TABLE IF NOT EXISTS training_staff_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    responded BOOLEAN DEFAULT true,
    emoji_used VARCHAR(10),
    responded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, module_id, staff_id)
);

-- Staff acknowledgment tracking (manual checklist)
CREATE TABLE IF NOT EXISTS training_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    acknowledged BOOLEAN DEFAULT true,
    acknowledged_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, module_id, staff_id)
);

-- Monthly audit questions (4 per module)
CREATE TABLE IF NOT EXISTS training_audit_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_category VARCHAR(100),
    weight_percentage INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Facility audit responses (Yes/No/Other + optional photo)
CREATE TABLE IF NOT EXISTS training_audit_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    question_id UUID REFERENCES training_audit_questions(id) ON DELETE CASCADE,
    answer VARCHAR(50) NOT NULL,
    other_text TEXT,
    photo_url TEXT,
    photo_filename VARCHAR(255),
    answered_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, module_id, question_id)
);

-- SafeGrowth Accelerator content (4-week social media plans)
CREATE TABLE IF NOT EXISTS training_social_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    week_title VARCHAR(200) NOT NULL,
    week_theme VARCHAR(100),
    visual_idea TEXT,
    sample_caption TEXT,
    hashtags TEXT,
    weight_percentage INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Facility social content completions (which weeks posted)
CREATE TABLE IF NOT EXISTS training_social_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, module_id, week_number)
);

-- Component progress tracking (for weighted completion)
CREATE TABLE IF NOT EXISTS training_component_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, module_id, component_type)
);

-- Overall module progress (calculated from components)
CREATE TABLE IF NOT EXISTS training_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules_new(id) ON DELETE CASCADE,
    overall_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, module_id)
);

-- ============================================
-- REQUIRED CERTIFICATIONS TABLES
-- ============================================

-- Certification types (pre-populated by state)
CREATE TABLE IF NOT EXISTS certification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    state_code VARCHAR(2),
    typical_duration_years INTEGER,
    required_hours DECIMAL(4,2),
    description TEXT,
    category VARCHAR(100),
    is_common BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff certifications (logged by facility)
CREATE TABLE IF NOT EXISTS staff_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    certification_type VARCHAR(200) NOT NULL,
    completion_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    training_provider VARCHAR(200),
    training_hours DECIMAL(4,2),
    certificate_file_url TEXT,
    certificate_file_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Annual training hours tracking (per staff member per year)
CREATE TABLE IF NOT EXISTS staff_annual_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_hours DECIMAL(5,2) DEFAULT 0,
    required_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, staff_id, year)
);

-- State training requirements (annual hours by state)
CREATE TABLE IF NOT EXISTS state_training_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(2) NOT NULL UNIQUE,
    state_name VARCHAR(100) NOT NULL,
    annual_hours_required DECIMAL(4,2) NOT NULL,
    director_hours_required DECIMAL(4,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Monthly Curriculum indexes
CREATE INDEX IF NOT EXISTS idx_training_modules_new_month_year ON training_modules_new(month, year);
CREATE INDEX IF NOT EXISTS idx_champion_content_module ON training_champion_content(module_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_module ON training_team_messages(module_id);
CREATE INDEX IF NOT EXISTS idx_staff_responses_facility_module ON training_staff_responses(facility_id, module_id);
CREATE INDEX IF NOT EXISTS idx_staff_responses_staff ON training_staff_responses(staff_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_facility_module ON training_acknowledgments(facility_id, module_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_staff ON training_acknowledgments(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_questions_module ON training_audit_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_audit_responses_facility_module ON training_audit_responses(facility_id, module_id);
CREATE INDEX IF NOT EXISTS idx_social_content_module ON training_social_content(module_id);
CREATE INDEX IF NOT EXISTS idx_social_completions_facility_module ON training_social_completions(facility_id, module_id);
CREATE INDEX IF NOT EXISTS idx_component_progress_facility_module ON training_component_progress(facility_id, module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_facility ON training_module_progress(facility_id);

-- Required Certifications indexes
CREATE INDEX IF NOT EXISTS idx_certification_types_state ON certification_types(state_code);
CREATE INDEX IF NOT EXISTS idx_certification_types_common ON certification_types(is_common, active);
CREATE INDEX IF NOT EXISTS idx_staff_certs_facility ON staff_certifications(facility_id);
CREATE INDEX IF NOT EXISTS idx_staff_certs_staff ON staff_certifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_certs_expiration ON staff_certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_annual_hours_facility_staff_year ON staff_annual_hours(facility_id, staff_id, year);
CREATE INDEX IF NOT EXISTS idx_state_requirements_code ON state_training_requirements(state_code);
