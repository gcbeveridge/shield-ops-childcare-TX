-- Migration: Add check_method_other column for custom check method descriptions
-- Date: 2026-01-08

ALTER TABLE ratio_spot_checks 
ADD COLUMN IF NOT EXISTS check_method_other VARCHAR(200);

-- Add index for faster lookups on check_method
CREATE INDEX IF NOT EXISTS idx_ratio_spot_checks_method ON ratio_spot_checks(check_method);
