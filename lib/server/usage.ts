import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface UsageRecord {
  id: string;
  userId: string;
  userEmail: string;
  date: string; // YYYY-MM-DD format
  interactions: number;
  prompts: number;
}

export async function getUsageRecords() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('usage_records').select('*').order('date');
  if (error) throw error;
  return data || [];
}

export async function getUserUsage(userEmail: string, startDate?: string, endDate?: string) {
  const supabase = getSupabaseServerClient();
  let query = supabase.from('usage_records').select('*').eq('user_email', userEmail);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  const { data, error } = await query.order('date');
  if (error) throw error;
  return data || [];
}

export async function recordInteraction(userId: string, userEmail: string, prompts: number = 1): Promise<void> {
  const supabase = getSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];
  // Upsert daily row
  const { data: existing } = await supabase
    .from('usage_records')
    .select('*')
    .eq('user_email', userEmail)
    .eq('date', today)
    .single();
  if (existing) {
    await supabase
      .from('usage_records')
      .update({
        interactions: existing.interactions + 1,
        prompts: existing.prompts + prompts,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('usage_records').insert({
      user_id: userId,
      user_email: userEmail,
      date: today,
      interactions: 1,
      prompts,
    });
  }
}

export async function getUsageStats(startDate?: string, endDate?: string) {
  const records = await getUsageRecords();
  const filtered = records.filter((r: any) => (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate));
  const totalInteractions = filtered.reduce((sum: number, r: any) => sum + r.interactions, 0);
  const totalPrompts = filtered.reduce((sum: number, r: any) => sum + r.prompts, 0);
  const uniqueUsers = new Set(filtered.map((r: any) => r.user_email)).size;
  const dailyStats = filtered.reduce((acc: any, r: any) => {
    if (!acc[r.date]) acc[r.date] = { interactions: 0, prompts: 0, users: new Set<string>() };
    acc[r.date].interactions += r.interactions;
    acc[r.date].prompts += r.prompts;
    acc[r.date].users.add(r.user_email);
    return acc;
  }, {} as Record<string, { interactions: number; prompts: number; users: Set<string> }>);
  const chartData = Object.entries(dailyStats).map(([date, stats]: any) => ({
    date,
    interactions: stats.interactions,
    prompts: stats.prompts,
    uniqueUsers: stats.users.size,
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));
  return { totalInteractions, totalPrompts, uniqueUsers, chartData };
}
