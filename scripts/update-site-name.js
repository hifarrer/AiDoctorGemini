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

async function updateSiteName() {
  try {
    console.log('🔍 Checking current site name...');
    
    // Check current site name
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('site_name')
      .eq('id', 1)
      .single();
    
    if (settingsError) {
      console.error('❌ Error checking current site name:', settingsError);
      return;
    }
    
    console.log('📋 Current site name:', settingsData.site_name);
    
    if (settingsData.site_name === 'AI Doctor') {
      console.log('🔄 Updating site name from "AI Doctor" to "Health Consultant AI"...');
      
      const { error: updateError } = await supabase
        .from('settings')
        .update({ site_name: 'Health Consultant AI' })
        .eq('id', 1);
      
      if (updateError) {
        console.error('❌ Error updating site name:', updateError);
      } else {
        console.log('✅ Site name updated successfully!');
        
        // Verify the update
        const { data: verifyData } = await supabase
          .from('settings')
          .select('site_name')
          .eq('id', 1)
          .single();
        
        console.log('✅ Verified new site name:', verifyData.site_name);
      }
    } else {
      console.log('✅ Site name is already correct:', settingsData.site_name);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateSiteName();
