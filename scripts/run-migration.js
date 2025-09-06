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
    
    const showcaseMigration = fs.readFileSync(
      path.join(__dirname, '../db/migration-add-showcase-table.sql'),
      'utf8'
    );
    
    const siteNameMigration = fs.readFileSync(
      path.join(__dirname, '../db/migration-update-site-name.sql'),
      'utf8'
    );
    
    const heroBackgroundColorMigration = fs.readFileSync(
      path.join(__dirname, '../db/migration-add-hero-background-color.sql'),
      'utf8'
    );
    const featuresBackgroundColorMigration = fs.readFileSync(
      path.join(__dirname, '../db/migration-add-features-background-color.sql'),
      'utf8'
    );
    
    console.log('Running plan columns migration...');
    try {
      const { error: planError } = await supabase.from('plans').select('stripe_product_id').limit(1);
      if (planError && planError.code === 'PGRST116') {
        // Table doesn't exist, run migration
        const { error } = await supabase.rpc('exec_sql', { sql: planColumnsMigration });
        if (error) {
          console.error('Error running plan columns migration:', error);
        } else {
          console.log('✅ Plan columns migration completed successfully');
        }
      } else {
        console.log('✅ Plan columns already exist, skipping migration');
      }
    } catch (error) {
      console.error('Error checking plan columns migration:', error);
    }
    
    console.log('Running user interactions migration...');
    try {
      const { error: interactionsError } = await supabase.from('user_interactions').select('id').limit(1);
      if (interactionsError && interactionsError.code === 'PGRST116') {
        // Table doesn't exist, run migration
        const { error } = await supabase.rpc('exec_sql', { sql: userInteractionsMigration });
        if (error) {
          console.error('Error running user interactions migration:', error);
        } else {
          console.log('✅ User interactions migration completed successfully');
        }
      } else {
        console.log('✅ User interactions table already exists, skipping migration');
      }
    } catch (error) {
      console.error('Error checking user interactions migration:', error);
    }
    
    console.log('Running showcase table migration...');
    try {
      const { error: showcaseError } = await supabase.from('landing_showcase').select('id').limit(1);
      if (showcaseError && showcaseError.code === 'PGRST116') {
        // Table doesn't exist, run migration
        const { error } = await supabase.rpc('exec_sql', { sql: showcaseMigration });
        if (error) {
          console.error('Error running showcase table migration:', error);
        } else {
          console.log('✅ Showcase table migration completed successfully');
        }
      } else {
        console.log('✅ Showcase table already exists, skipping migration');
      }
    } catch (error) {
      console.error('Error checking showcase table migration:', error);
    }
    
    console.log('Running site name migration...');
    try {
      // Check current site name
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('site_name').eq('id', 1).single();
      if (settingsError) {
        console.error('Error checking current site name:', settingsError);
      } else if (settingsData && settingsData.site_name === 'AI Doctor') {
        // Update the site name
        const { error } = await supabase.from('settings').update({ site_name: 'Health Consultant AI' }).eq('id', 1);
        if (error) {
          console.error('Error updating site name:', error);
        } else {
          console.log('✅ Site name updated successfully');
        }
      } else {
        console.log('✅ Site name is already correct or settings table not found');
      }
    } catch (error) {
      console.error('Error checking site name migration:', error);
    }
    
    console.log('Running hero background color migration...');
    try {
      // Check if background_color column exists
      const { error: heroError } = await supabase.from('landing_hero').select('background_color').limit(1);
      if (heroError && heroError.code === 'PGRST116') {
        // Column doesn't exist, run migration
        const { error } = await supabase.rpc('exec_sql', { sql: heroBackgroundColorMigration });
        if (error) {
          console.error('Error running hero background color migration:', error);
        } else {
          console.log('✅ Hero background color migration completed successfully');
        }
      } else {
        console.log('✅ Hero background color column already exists, skipping migration');
      }
    } catch (error) {
      console.error('Error checking hero background color migration:', error);
    }

    console.log('Running features background color migration...');
    try {
      // Check if background_color exists on landing_features_section
      const { error: featErr } = await supabase.from('landing_features_section').select('background_color').limit(1);
      if (featErr && featErr.code === 'PGRST116') {
        const { error } = await supabase.rpc('exec_sql', { sql: featuresBackgroundColorMigration });
        if (error) {
          console.error('Error running features background color migration:', error);
        } else {
          console.log('✅ Features background color migration completed successfully');
        }
      } else {
        console.log('✅ Features background color column already exists, skipping migration');
      }
    } catch (error) {
      console.error('Error checking features background color migration:', error);
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
