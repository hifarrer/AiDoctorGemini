const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHeroData() {
  try {
    console.log('Checking hero data in database...');
    
    const { data, error } = await supabase
      .from('landing_hero')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error fetching hero data:', error);
    } else {
      console.log('✅ Hero data found:', data);
      
      if (!data) {
        console.log('No hero data found. Creating default hero data...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('landing_hero')
          .insert({
            id: 1,
            title: 'Your Personal AI Health Assistant',
            subtitle: 'Get instant, reliable answers to your medical questions. Health Consultant AI understands both text and images to provide you with the best possible assistance.',
            images: ['/images/aidoc1.png','/images/aidoc2.png','/images/aidoc3.png','/images/aidoc4.png']
          })
          .select();
        
        if (insertError) {
          console.error('Error creating hero data:', insertError);
        } else {
          console.log('✅ Default hero data created:', insertData);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkHeroData();
