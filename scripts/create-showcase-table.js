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

async function createShowcaseTable() {
  try {
    console.log('🔍 Checking if landing_showcase table exists...');
    
    // Check if table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('landing_showcase')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('📋 Table does not exist, creating landing_showcase table...');
      
      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "landing_showcase" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "image1" TEXT,
          "image2" TEXT,
          "image3" TEXT,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index on id for faster lookups
        CREATE INDEX IF NOT EXISTS "landing_showcase_id_idx" ON "landing_showcase" ("id");
        
        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_landing_showcase_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_landing_showcase_updated_at
          BEFORE UPDATE ON "landing_showcase"
          FOR EACH ROW
          EXECUTE FUNCTION update_landing_showcase_updated_at();
        
        -- Insert default record if table is empty
        INSERT INTO "landing_showcase" ("image1", "image2", "image3")
        SELECT '', '', ''
        WHERE NOT EXISTS (SELECT 1 FROM "landing_showcase" LIMIT 1);
      `;
      
      // Try to execute the SQL using rpc if available
      try {
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        if (sqlError) {
          console.error('❌ Error creating table with exec_sql:', sqlError);
          console.log('💡 You may need to create the table manually in your Supabase dashboard');
          return;
        }
        console.log('✅ landing_showcase table created successfully!');
      } catch (rpcError) {
        console.error('❌ exec_sql function not available:', rpcError.message);
        console.log('💡 Please create the landing_showcase table manually in your Supabase dashboard with this SQL:');
        console.log(createTableSQL);
      }
    } else if (checkError) {
      console.error('❌ Error checking table:', checkError);
    } else {
      console.log('✅ landing_showcase table already exists');
      
      // Check if there's a record
      const { data: recordData, error: recordError } = await supabase
        .from('landing_showcase')
        .select('id')
        .limit(1);
      
      if (recordError) {
        console.error('❌ Error checking records:', recordError);
      } else if (!recordData || recordData.length === 0) {
        console.log('📝 No records found, inserting default record...');
        const { error: insertError } = await supabase
          .from('landing_showcase')
          .insert({ image1: '', image2: '', image3: '' });
        
        if (insertError) {
          console.error('❌ Error inserting default record:', insertError);
        } else {
          console.log('✅ Default record inserted successfully');
        }
      } else {
        console.log('✅ Table has records, no action needed');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createShowcaseTable();
