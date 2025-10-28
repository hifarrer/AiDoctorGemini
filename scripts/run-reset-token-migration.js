const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runResetTokenMigration() {
  try {
    console.log('Starting reset token migration...');
    
    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../db/migration-add-reset-token-fields.sql'), 
      'utf8'
    );
    
    console.log('Running reset token fields migration...');
    
    // Check if reset_token column already exists
    const { error: checkError } = await supabase.from('users').select('reset_token').limit(1);
    
    if (checkError && (checkError.code === 'PGRST116' || checkError.code === '42703')) {
      // Column doesn't exist, run migration
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      if (error) {
        console.error('Error running reset token migration:', error);
        process.exit(1);
      } else {
        console.log('✅ Reset token fields migration completed successfully');
      }
    } else if (checkError) {
      console.error('Error checking reset token column:', checkError);
      process.exit(1);
    } else {
      console.log('✅ Reset token fields already exist, skipping migration');
    }
    
    console.log('Reset token migration completed!');
    
  } catch (error) {
    console.error('Reset token migration failed:', error);
    process.exit(1);
  }
}

runResetTokenMigration();
