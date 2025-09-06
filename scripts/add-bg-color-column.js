const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addBackgroundColorColumn() {
  try {
    console.log('Adding background_color column to landing_hero table...');
    
    // First, let's check if the column already exists
    const { data: existingData, error: checkError } = await supabase
      .from('landing_hero')
      .select('background_color')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('Column does not exist, adding it...');
      
      // Since we can't use ALTER TABLE directly, let's try to insert a record with the new column
      // and see if it works, which would indicate the column exists
      const { error: insertError } = await supabase
        .from('landing_hero')
        .upsert({
          id: 1,
          title: 'Your Personal AI Health Assistant',
          subtitle: 'Get instant, reliable answers to your medical questions. Health Consultant AI understands both text and images to provide you with the best possible assistance.',
          images: ['/images/aidoc1.png','/images/aidoc2.png','/images/aidoc3.png','/images/aidoc4.png'],
          background_color: 'gradient-blue'
        });
      
      if (insertError) {
        console.error('Error adding background_color column:', insertError);
        console.log('You may need to add the column manually in Supabase dashboard');
      } else {
        console.log('✅ Background color column added and default value set successfully');
      }
    } else {
      console.log('✅ Background color column already exists');
      
      // Update existing record with default background color if it's null
      const { error: updateError } = await supabase
        .from('landing_hero')
        .update({ background_color: 'gradient-blue' })
        .eq('id', 1)
        .is('background_color', null);
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('✅ Default background color ensured');
      }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

addBackgroundColorColumn();
