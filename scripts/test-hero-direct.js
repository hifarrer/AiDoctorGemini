const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDirectQuery() {
  try {
    console.log('Testing direct Supabase query...');
    
    const { data, error } = await supabase
      .from('landing_hero')
      .select('id, title, subtitle, images, background_color, updated_at')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('❌ Direct query error:', error);
    } else {
      console.log('✅ Direct query result:');
      console.log('  - Background color:', data.background_color);
      console.log('  - Updated at:', data.updated_at);
      console.log('  - Full data:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testDirectQuery();
