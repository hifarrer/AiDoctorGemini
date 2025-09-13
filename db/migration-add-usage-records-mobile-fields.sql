-- Add missing fields to usage_records table for mobile chat API compatibility

-- Add interaction_type column
ALTER TABLE usage_records 
ADD COLUMN IF NOT EXISTS interaction_type TEXT;

-- Add tokens_used column
ALTER TABLE usage_records 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER;

-- Add created_at column (if it doesn't exist)
ALTER TABLE usage_records 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for interaction_type for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_records_interaction_type ON usage_records(interaction_type);

-- Create index for created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);
