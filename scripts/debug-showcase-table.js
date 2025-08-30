const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugShowcaseTable() {
  try {
    console.log('🔍 Debugging landing_showcase table...');
    
    // Check if table exists by trying to list records
    const { data: showcaseRecords, error: listError } = await supabase
      .from('landing_showcase')
      .select('*');
    
    if (listError) {
      console.error('❌ Error accessing landing_showcase table:', listError);
      
      // Try to create the table if it doesn't exist
      console.log('🛠️ Attempting to create landing_showcase table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS landing_showcase (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            image1 TEXT,
            image2 TEXT,
            image3 TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert default record if table is empty
          INSERT INTO landing_showcase (image1, image2, image3)
          SELECT '', '', ''
          WHERE NOT EXISTS (SELECT 1 FROM landing_showcase LIMIT 1);
        `
      });
      
      if (createError) {
        console.error('❌ Error creating table:', createError);
        return;
      } else {
        console.log('✅ Table created successfully');
      }
      
      // Try listing again
      const { data: newRecords, error: newListError } = await supabase
        .from('landing_showcase')
        .select('*');
      
      if (newListError) {
        console.error('❌ Still can\'t access table after creation:', newListError);
        return;
      }
      
      console.log(`📋 Found ${newRecords.length} showcase records after creation:`);
      newRecords.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`);
        console.log(`    - id: ${record.id}`);
        console.log(`    - image1: "${record.image1}"`);
        console.log(`    - image2: "${record.image2}"`);
        console.log(`    - image3: "${record.image3}"`);
        console.log(`    - created_at: ${record.created_at}`);
        console.log(`    - updated_at: ${record.updated_at}`);
        console.log('');
      });
    } else {
      console.log(`📋 Found ${showcaseRecords.length} showcase records:`);
      showcaseRecords.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`);
        console.log(`    - id: ${record.id}`);
        console.log(`    - image1: "${record.image1}"`);
        console.log(`    - image2: "${record.image2}"`);
        console.log(`    - image3: "${record.image3}"`);
        console.log(`    - created_at: ${record.created_at}`);
        console.log(`    - updated_at: ${record.updated_at}`);
        console.log('');
      });
    }
    
    // Test inserting a record
    console.log('🧪 Testing insert operation...');
    const testImageUrl = 'https://kjupnzyyqscudhppzbzf.supabase.co/storage/v1/object/public/landing/showcase/test-image.png';
    const { data: insertData, error: insertError } = await supabase
      .from('landing_showcase')
      .insert({
        image1: testImageUrl,
        image2: '',
        image3: ''
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
    } else {
      console.log('✅ Test insert successful:', insertData);
      
      // Clean up test record
      if (insertData && insertData[0]) {
        const { error: deleteError } = await supabase
          .from('landing_showcase')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('⚠️ Warning: Could not delete test record:', deleteError);
        } else {
          console.log('✅ Test record cleaned up');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugShowcaseTable();
