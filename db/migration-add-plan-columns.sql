-- Migration to add missing columns to plans table
-- Run this script to update the database schema

-- Add is_popular column
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Add interactions_limit column
ALTER TABLE plans ADD COLUMN IF NOT EXISTS interactions_limit INTEGER;

-- Add created_at and updated_at columns if they don't exist
ALTER TABLE plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_plans_is_popular ON plans(is_popular);
CREATE INDEX IF NOT EXISTS idx_plans_interactions_limit ON plans(interactions_limit);

-- Update existing plans with default values
UPDATE plans SET 
  is_popular = false,
  interactions_limit = CASE 
    WHEN title = 'Free' THEN 3
    WHEN title = 'Basic' THEN 50
    WHEN title = 'Premium' THEN NULL
    ELSE 10
  END
WHERE is_popular IS NULL OR interactions_limit IS NULL;

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at 
    BEFORE UPDATE ON plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
