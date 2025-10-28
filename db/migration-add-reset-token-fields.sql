-- Add reset token fields to users table for password reset functionality
ALTER TABLE users 
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX idx_users_reset_token ON users(reset_token);
