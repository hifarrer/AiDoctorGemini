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

async function checkAndCreateBucket() {
  try {
    console.log('🔍 Checking Supabase storage buckets...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📋 Existing buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });
    
    // Check if landing bucket exists
    const landingBucket = buckets.find(b => b.name === 'landing');
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'landing';
    const targetBucket = buckets.find(b => b.name === bucketName);
    
    if (!targetBucket) {
      console.log(`\n❌ Bucket '${bucketName}' not found. Creating it...`);
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log(`✅ Successfully created bucket '${bucketName}'`);
      console.log('  - public:', newBucket.public);
      console.log('  - fileSizeLimit:', newBucket.fileSizeLimit);
      console.log('  - allowedMimeTypes:', newBucket.allowedMimeTypes);
    } else {
      console.log(`\n✅ Bucket '${bucketName}' already exists`);
      console.log('  - public:', targetBucket.public);
      console.log('  - fileSizeLimit:', targetBucket.fileSizeLimit);
      console.log('  - allowedMimeTypes:', targetBucket.allowedMimeTypes);
    }
    
    // Test bucket access
    console.log('\n🧪 Testing bucket access...');
    const { data: testList, error: testError } = await supabase.storage
      .from(bucketName)
      .list('showcase', { limit: 1 });
    
    if (testError) {
      console.error('❌ Error testing bucket access:', testError);
    } else {
      console.log('✅ Bucket access test successful');
      console.log(`  - showcase folder exists, contains ${testList?.length || 0} files`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndCreateBucket();
