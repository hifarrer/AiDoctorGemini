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

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Read migration files
    const planColumnsMigration = fs.readFileSync(
      path.join(__dirname, '../db/migration-add-plan-columns.sql'), 
      'utf8'
    );
    
    const userInteractionsMigration = fs.readFileSync(
      path.join(__dirname, '../db/migration-add-user-interactions.sql'), 
      'utf8'
    );
    
    console.log('Running plan columns migration...');
    const { error: planError } = await supabase.rpc('exec_sql', { sql: planColumnsMigration });
    if (planError) {
      console.error('Error running plan columns migration:', planError);
    } else {
      console.log('✅ Plan columns migration completed successfully');
    }
    
    console.log('Running user interactions migration...');
    const { error: interactionsError } = await supabase.rpc('exec_sql', { sql: userInteractionsMigration });
    if (interactionsError) {
      console.error('Error running user interactions migration:', interactionsError);
    } else {
      console.log('✅ User interactions migration completed successfully');
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
