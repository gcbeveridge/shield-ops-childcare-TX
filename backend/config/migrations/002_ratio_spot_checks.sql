-- Migration: 002_ratio_spot_checks.sql
-- Description: Add tables for ratio spot-check compliance logging

-- Rooms (simple labels, not full classroom management)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age_group VARCHAR(50) NOT NULL,
    required_ratio VARCHAR(10) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ratio spot-check logs
CREATE TABLE IF NOT EXISTS ratio_spot_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    room_name VARCHAR(100) NOT NULL,
    check_date DATE NOT NULL,
    check_time TIME NOT NULL,
    children_count INTEGER NOT NULL,
    staff_count INTEGER NOT NULL,
    required_ratio VARCHAR(10) NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    check_method VARCHAR(50),
    checked_by_name VARCHAR(100),
    checked_by_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Spot-check reminders/schedule
CREATE TABLE IF NOT EXISTS ratio_check_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    check_frequency VARCHAR(50) DEFAULT 'twice_daily',
    check_times TIME[],
    enabled BOOLEAN DEFAULT true,
    last_reminder_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spot_checks_facility_date ON ratio_spot_checks(facility_id, check_date);
CREATE INDEX IF NOT EXISTS idx_spot_checks_room ON ratio_spot_checks(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_facility ON rooms(facility_id);
