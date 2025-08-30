const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSettings() {
  try {
    console.log('🔍 Debugging settings table...');
    
    // Check all records in settings table
    const { data: allSettings, error: listError } = await supabase
      .from('settings')
      .select('*');
    
    if (listError) {
      console.error('❌ Error listing settings:', listError);
      return;
    }
    
    console.log(`📋 Found ${allSettings.length} settings records:`);
    allSettings.forEach((setting, index) => {
      console.log(`  Record ${index + 1}:`);
      console.log(`    - id: ${setting.id}`);
      console.log(`    - site_name: "${setting.site_name}"`);
      console.log(`    - site_description: "${setting.site_description}"`);
      console.log(`    - contact_email: "${setting.contact_email}"`);
      console.log(`    - support_email: "${setting.support_email}"`);
      console.log(`    - created_at: ${setting.created_at}`);
      console.log(`    - updated_at: ${setting.updated_at}`);
      console.log('');
    });
    
    // Test the specific query used by getSettings
    console.log('🧪 Testing getSettings query (id = 1)...');
    const { data: specificSetting, error: specificError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (specificError) {
      console.error('❌ Error fetching specific setting:', specificError);
    } else {
      console.log('✅ Specific setting (id = 1):');
      console.log(`  - site_name: "${specificSetting.site_name}"`);
      console.log(`  - site_description: "${specificSetting.site_description}"`);
    }
    
    // Check if there are any records with "AI Doctor" in the name
    console.log('\n🔍 Checking for any records with "AI Doctor"...');
    const { data: aiDoctorSettings, error: searchError } = await supabase
      .from('settings')
      .select('*')
      .ilike('site_name', '%AI Doctor%');
    
    if (searchError) {
      console.error('❌ Error searching for AI Doctor:', searchError);
    } else {
      console.log(`Found ${aiDoctorSettings.length} records with "AI Doctor" in name:`);
      aiDoctorSettings.forEach(setting => {
        console.log(`  - id: ${setting.id}, site_name: "${setting.site_name}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugSettings();
