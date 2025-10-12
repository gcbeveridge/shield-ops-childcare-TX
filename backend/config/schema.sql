-- Shield Ops Database Schema

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS training_completions CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS daily_checklists CASCADE;
DROP TABLE IF EXISTS compliance_items CASCADE;
DROP TABLE IF EXISTS medication_logs CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;

-- Facilities table
CREATE TABLE facilities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address JSONB NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  license_number VARCHAR(50),
  capacity INTEGER,
  owner_id UUID,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  certifications JSONB DEFAULT '{}'::jsonb,
  training_completion INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  child_info JSONB NOT NULL,
  location VARCHAR(255),
  description TEXT NOT NULL,
  immediate_actions TEXT,
  occurred_at TIMESTAMP NOT NULL,
  reported_by VARCHAR(255),
  parent_notified BOOLEAN DEFAULT false,
  parent_signature JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medications table
CREATE TABLE medications (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  child_name VARCHAR(255) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  parent_authorization JSONB NOT NULL,
  prescriber_info JSONB,
  special_instructions TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication logs table
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  administered_at TIMESTAMP NOT NULL,
  administered_by VARCHAR(255) NOT NULL,
  verified_by VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance items table
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  requirement VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  completed_by VARCHAR(255),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily checklists table
CREATE TABLE daily_checklists (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  completed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facility_id, date, task)
);

-- Training modules table
CREATE TABLE training_modules (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  month VARCHAR(20) NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training completions table
CREATE TABLE training_completions (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL,
  score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, staff_id)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_staff_facility ON staff(facility_id);
CREATE INDEX idx_incidents_facility ON incidents(facility_id);
CREATE INDEX idx_medications_facility ON medications(facility_id);
CREATE INDEX idx_medication_logs_medication ON medication_logs(medication_id);
CREATE INDEX idx_compliance_facility ON compliance_items(facility_id);
CREATE INDEX idx_checklists_facility_date ON daily_checklists(facility_id, date);
CREATE INDEX idx_training_modules_facility ON training_modules(facility_id);
CREATE INDEX idx_training_completions_staff ON training_completions(staff_id);
CREATE INDEX idx_documents_facility ON documents(facility_id);
CREATE INDEX idx_users_email ON users(email);
