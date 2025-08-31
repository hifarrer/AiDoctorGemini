const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars. Require NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const oldTitle = 'Natural Language Understanding';
  const newTitle = 'Multi-language support';
  try {
    console.log(`🔍 Looking for feature items with title = "${oldTitle}"...`);
    let { data: items, error } = await supabase
      .from('landing_features_items')
      .select('id, title')
      .eq('title', oldTitle);

    if (error) {
      console.error('❌ Query error:', error);
      process.exit(1);
    }

    if (!items || items.length === 0) {
      console.log('ℹ️ Exact match not found. Trying partial match...');
      const res2 = await supabase
        .from('landing_features_items')
        .select('id, title')
        .ilike('title', '%Natural Language%');
      if (res2.error) {
        console.error('❌ Query error:', res2.error);
        process.exit(1);
      }
      items = res2.data || [];
    }

    if (!items || items.length === 0) {
      console.log('⚠️ No feature items found to update. Nothing to do.');
      return;
    }

    console.log(`🔧 Updating ${items.length} item(s) to title = "${newTitle}"...`);
    const ids = items.map(i => i.id);
    const { data: updated, error: updErr } = await supabase
      .from('landing_features_items')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id, title');

    if (updErr) {
      console.error('❌ Update error:', updErr);
      process.exit(1);
    }

    console.log('✅ Updated items:', updated);
  } catch (e) {
    console.error('❌ Unexpected error:', e);
    process.exit(1);
  }
}

run();
