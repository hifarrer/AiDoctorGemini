# Forgot Password Functionality Setup

This document provides instructions for setting up the forgot password functionality in the HealthConsultant application.

## Database Migration Required

The forgot password functionality requires additional database fields to store reset tokens. You need to run the following SQL commands in your Supabase dashboard:

### SQL Commands to Execute

```sql
-- Add reset token fields to users table for password reset functionality
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX idx_users_reset_token ON users(reset_token);
```

### How to Execute the Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the SQL commands above
4. Execute the commands

### Alternative: Run the Check Script

You can also run the check script to get the exact SQL commands:

```bash
node scripts/check-reset-token-fields.js
```

This script will tell you if the fields exist and provide the exact SQL commands if they don't.

## Current Implementation

The forgot password functionality is currently implemented with:

### Features
- ✅ Forgot password link on login page
- ✅ Email-based password reset
- ✅ Secure token generation
- ✅ Token expiration (1 hour)
- ✅ Password strength validation
- ✅ Reset password page

### Temporary Storage
Currently using in-memory storage for reset tokens. This works for development but should be replaced with database storage after running the migration.

### Files Created/Modified
- `app/api/auth/forgot-password/route.ts` - API endpoint for requesting password reset
- `app/api/auth/reset-password/route.ts` - API endpoint for resetting password
- `app/auth/login/page.tsx` - Updated login page with forgot password modal
- `app/auth/reset-password/page.tsx` - New reset password page
- `lib/reset-tokens.ts` - Temporary in-memory token storage
- `lib/server/users.ts` - Updated User interface with reset token fields
- `db/migration-add-reset-token-fields.sql` - Database migration SQL

## Testing the Functionality

1. Go to the login page
2. Click "Forgot password?"
3. Enter your email address
4. Check your email for the reset link
5. Click the reset link
6. Enter your new password
7. Log in with your new password

## Security Features

- Reset tokens expire after 1 hour
- Tokens are cryptographically secure (32 bytes)
- Password strength validation (minimum 6 characters)
- Tokens are single-use (removed after successful reset)
- Email validation ensures only registered users can reset passwords

## Production Considerations

After running the database migration, you should:

1. Update the APIs to use database storage instead of in-memory storage
2. Consider implementing rate limiting for password reset requests
3. Add logging for security monitoring
4. Consider implementing additional security measures like CAPTCHA
