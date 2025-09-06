const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumn() {
  try {
    console.log('Attempting to add background_color column...');
    
    // Try to insert a record with background_color to see if column exists
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
      console.error('Error:', error);
      console.log('\nThe background_color column does not exist in the database.');
      console.log('Please add it manually in Supabase dashboard with this SQL:');
      console.log('\nALTER TABLE public.landing_hero ADD COLUMN background_color VARCHAR(50) DEFAULT \'gradient-blue\';');
    } else {
      console.log('✅ Successfully updated hero record with background_color:', data);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

addColumn();
