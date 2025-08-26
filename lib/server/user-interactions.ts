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
    console.error('Error recording user interaction:', error);
    throw error;
  }
}

export async function getUserInteractionCount(
  userId: string, 
  planId: string, 
  month?: string
): Promise<number> {
  const supabase = getSupabaseServerClient();
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const { count, error } = await supabase
    .from('user_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .eq('month', targetMonth);

  if (error) {
    console.error('Error getting user interaction count:', error);
    throw error;
  }

  return count || 0;
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

    const currentCount = await getUserInteractionCount(userId, planId);
    const limit = userPlan.interactionsLimit;
    const remaining = limit === null ? null : Math.max(0, limit - currentCount);

    return {
      currentMonth: currentCount,
      limit: limit,
      remaining: remaining
    };
  } catch (error) {
    console.error('Error getting user interaction stats:', error);
    return { currentMonth: 0, limit: null, remaining: null };
  }
}
