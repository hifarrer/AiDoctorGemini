const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testBackgroundColorColumn() {
  try {
    console.log('Testing background_color column...');
    
    // Try to insert a record with background_color to test if column exists
    const { data, error } = await supabase
      .from('landing_hero')
      .upsert({
        id: 1,
        title: 'Your Personal AI Health Assistant',
        subtitle: 'Get instant, reliable answers to your medical questions. Health Consultant AI understands both text and images to provide you with the best possible assistance.',
        images: ['/images/aidoc1.png','/images/aidoc2.png','/images/aidoc3.png','/images/aidoc4.png'],
        background_color: 'gradient-blue'
      })
      .select();
    
    if (error) {
      console.error('❌ Column does not exist. Error:', error.message);
      console.log('\n🔧 Please add the column manually in Supabase dashboard:');
      console.log('\n1. Go to your Supabase dashboard');
      console.log('2. Navigate to Table Editor → landing_hero');
      console.log('3. Click "Add Column"');
      console.log('4. Set:');
      console.log('   - Name: background_color');
      console.log('   - Type: varchar');
      console.log('   - Default value: gradient-blue');
      console.log('   - Allow nullable: Yes');
      console.log('5. Click "Save"');
    } else {
      console.log('✅ Background color column exists and data saved:', data);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testBackgroundColorColumn();
