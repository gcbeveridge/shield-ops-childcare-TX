-- Phase 2D: Smart Alerts System
-- Alert configurations (what triggers alerts)
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    threshold_days INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Active alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    acknowledged_by_name VARCHAR(100),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    action_by_name VARCHAR(100),
    action_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_facility ON alerts(facility_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
