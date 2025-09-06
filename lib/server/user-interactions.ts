import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getPlans } from './plans';

export interface UserInteraction {
  id: string;
  userId: string;
  planId: string;
  interactionType: 'chat' | 'image_analysis' | 'health_report';
  createdAt: Date;
  month: string; // YYYY-MM format for easy querying
}

export async function recordUserInteraction(
  userId: string, 
  planId: string, 
  interactionType: UserInteraction['interactionType'] = 'chat'
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const month = now.toISOString().slice(0, 7); // YYYY-MM format

  console.log('📝 Recording user_interaction attempt:', {
    userId,
    planId,
    interactionType,
    month,
    created_at: now.toISOString(),
  });

  const { error } = await supabase
    .from('user_interactions')
    .insert({
      user_id: userId,
      plan_id: planId,
      interaction_type: interactionType,
      month: month,
      created_at: now.toISOString(),
    });

  if (error) {
    console.error('❌ Error recording user interaction:', error);
    throw error;
  }

  console.log('✅ user_interactions row inserted successfully.');
}

export async function getUserInteractionCount(
  userId: string, 
  planId: string, 
  month?: string
): Promise<number> {
  const supabase = getSupabaseServerClient();
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  console.log('🔍 Getting interaction count for:', { userId, planId, targetMonth });

  const { data, error } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .eq('month', targetMonth);

  console.log('🔍 Raw query result:', { data, error });

  if (error) {
    console.error('Error getting user interaction count:', error);
    throw error;
  }

  const count = data?.length || 0;
  console.log('🔍 Interaction count result:', count);
  console.log('🔍 Found records:', data);
  
  return count;
}

export async function canUserInteract(
  userId: string, 
  planId: string
): Promise<{ canInteract: boolean; remainingInteractions?: number; limit?: number }> {
  try {
    // Get the user's plan
    const plans = await getPlans();
    const userPlan = plans.find(plan => plan.id === planId);
    
    if (!userPlan) {
      return { canInteract: false };
    }

    // If plan has unlimited interactions (null limit)
    if (userPlan.interactionsLimit === null || userPlan.interactionsLimit === undefined) {
      return { canInteract: true };
    }

    // Get current month's interaction count
    const currentCount = await getUserInteractionCount(userId, planId);
    const limit = userPlan.interactionsLimit;
    const remaining = Math.max(0, limit - currentCount);

    return {
      canInteract: currentCount < limit,
      remainingInteractions: remaining,
      limit: limit
    };
  } catch (error) {
    console.error('Error checking user interaction limit:', error);
    // In case of error, allow interaction to prevent blocking users
    return { canInteract: true };
  }
}

export async function getUserInteractionStats(
  userId: string, 
  planId: string
): Promise<{ currentMonth: number; limit: number | null; remaining: number | null }> {
  try {
    const plans = await getPlans();
    const userPlan = plans.find(plan => plan.id === planId);
    
    if (!userPlan) {
      return { currentMonth: 0, limit: null, remaining: null };
    }

    let currentCount = 0;
    try {
      currentCount = await getUserInteractionCount(userId, planId);
    } catch (error) {
      console.error('Error getting user interaction count, defaulting to 0:', error);
      currentCount = 0;
    }

    const rawLimit = userPlan.interactionsLimit;
    const limit: number | null = (rawLimit === null || typeof rawLimit === 'undefined') ? null : rawLimit;
    const remaining = limit === null ? null : Math.max(0, (limit as number) - currentCount);

    return {
      currentMonth: currentCount,
      limit: limit,
      remaining: remaining
    };
  } catch (error) {
    console.error('Error getting user interaction stats:', error);
    // Don't return null limit on error, try to get the plan limit at least
    try {
      const plans = await getPlans();
      const userPlan = plans.find(plan => plan.id === planId);
      if (userPlan) {
        const normalized = (userPlan.interactionsLimit === null || typeof userPlan.interactionsLimit === 'undefined') 
          ? null 
          : userPlan.interactionsLimit;
        return {
          currentMonth: 0,
          limit: normalized,
          remaining: normalized === null ? null : normalized
        };
      }
    } catch (planError) {
      console.error('Error getting plan as fallback:', planError);
    }
    return { currentMonth: 0, limit: null, remaining: null };
  }
}
