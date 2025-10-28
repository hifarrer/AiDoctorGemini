const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addResetTokenFields() {
  try {
    console.log('Attempting to add reset token fields...');
    
    // Try to update a user record with reset token fields to see if columns exist
    const { data, error } = await supabase
      .from('users')
      .update({
        reset_token: 'test-token',
        reset_token_expiry: new Date().toISOString()
      })
      .eq('email', 'test@example.com')
      .select();
    
    if (error) {
      console.error('Error:', error);
      console.log('\nThe reset token fields do not exist in the database.');
      console.log('Please add them manually in Supabase dashboard with this SQL:');
      console.log('\n-- Add reset token fields to users table for password reset functionality');
      console.log('ALTER TABLE users ADD COLUMN reset_token TEXT;');
      console.log('ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;');
      console.log('\n-- Add index for faster token lookups');
      console.log('CREATE INDEX idx_users_reset_token ON users(reset_token);');
    } else {
      console.log('✅ Reset token fields already exist in the database');
      // Clean up the test data
      await supabase
        .from('users')
        .update({
          reset_token: null,
          reset_token_expiry: null
        })
        .eq('email', 'test@example.com');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

addResetTokenFields();
