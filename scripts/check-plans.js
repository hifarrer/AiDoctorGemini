const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixPlans() {
  try {
    console.log('🔍 Checking current plans in database...');
    
    // Get all plans
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*');
    
    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }
    
    console.log('📋 Current plans:');
    plans.forEach(plan => {
      console.log(`  - ${plan.title}: interactions_limit = ${plan.interactions_limit}`);
    });
    
    // Check if Free plan has correct limit
    const freePlan = plans.find(p => p.title === 'Free');
    if (freePlan && freePlan.interactions_limit !== 3) {
      console.log('⚠️  Free plan has incorrect limit, fixing...');
      
      const { error: updateError } = await supabase
        .from('plans')
        .update({ interactions_limit: 3 })
        .eq('title', 'Free');
      
      if (updateError) {
        console.error('Error updating Free plan:', updateError);
      } else {
        console.log('✅ Free plan updated with limit of 3');
      }
    }
    
    // Check if Basic plan has correct limit
    const basicPlan = plans.find(p => p.title === 'Basic');
    if (basicPlan && basicPlan.interactions_limit !== 50) {
      console.log('⚠️  Basic plan has incorrect limit, fixing...');
      
      const { error: updateError } = await supabase
        .from('plans')
        .update({ interactions_limit: 50 })
        .eq('title', 'Basic');
      
      if (updateError) {
        console.error('Error updating Basic plan:', updateError);
      } else {
        console.log('✅ Basic plan updated with limit of 50');
      }
    }
    
    // Check if Premium plan has unlimited (null)
    const premiumPlan = plans.find(p => p.title === 'Premium');
    if (premiumPlan && premiumPlan.interactions_limit !== null) {
      console.log('⚠️  Premium plan has incorrect limit, fixing...');
      
      const { error: updateError } = await supabase
        .from('plans')
        .update({ interactions_limit: null })
        .eq('title', 'Premium');
      
      if (updateError) {
        console.error('Error updating Premium plan:', updateError);
      } else {
        console.log('✅ Premium plan updated with unlimited (null)');
      }
    }
    
    console.log('✅ Plan check complete!');
    
  } catch (error) {
    console.error('Error in checkAndFixPlans:', error);
  }
}

checkAndFixPlans();
