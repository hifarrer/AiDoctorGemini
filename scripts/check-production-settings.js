const { createClient } = require('@supabase/supabase-js');
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

async function checkProductionSettings() {
  try {
    console.log('🔍 Checking production database settings...');
    
    // Check current settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (settingsError) {
      console.error('❌ Error checking settings:', settingsError);
      return;
    }
    
    console.log('📋 Production Settings:');
    console.log('  - site_name:', settingsData.site_name);
    console.log('  - site_description:', settingsData.site_description);
    console.log('  - contact_email:', settingsData.contact_email);
    console.log('  - support_email:', settingsData.support_email);
    console.log('  - logo_url:', settingsData.logo_url);
    console.log('  - stripe_secret_key:', settingsData.stripe_secret_key ? '***SET***' : 'NOT SET');
    console.log('  - stripe_publishable_key:', settingsData.stripe_publishable_key ? '***SET***' : 'NOT SET');
    
    // Test the getSettings function
    console.log('\n🧪 Testing getSettings function...');
    try {
      const { getSettings } = require('../lib/server/settings');
      const settings = await getSettings();
      console.log('✅ getSettings result:');
      console.log('  - siteName:', settings.siteName);
      console.log('  - siteDescription:', settings.siteDescription);
    } catch (error) {
      console.error('❌ getSettings error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProductionSettings();
