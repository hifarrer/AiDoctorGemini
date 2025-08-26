-- Migration to add user_interactions table
-- Run this script to create the table for tracking user interactions

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM format for easy querying
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_plan_id ON user_interactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_month ON user_interactions(month);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_plan_month ON user_interactions(user_id, plan_id, month);

-- Add comments for documentation
COMMENT ON TABLE user_interactions IS 'Tracks user interactions with the chatbot for plan limit enforcement';
COMMENT ON COLUMN user_interactions.interaction_type IS 'Type of interaction: chat, image_analysis, health_report';
COMMENT ON COLUMN user_interactions.month IS 'Month in YYYY-MM format for easy querying and monthly limits';
