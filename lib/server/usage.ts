import { getSupabaseServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

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
  console.log('Fetching usage records from database...');
  
  // First, let's check if we can connect to the database
  try {
    const { data, error } = await supabase.from('usage_records').select('*').order('date');
    if (error) {
      console.error('Error fetching usage records:', error);
      throw error;
    }
    console.log(`Successfully fetched ${data?.length || 0} usage records`);
    console.log('Sample record:', data?.[0]);
    return data || [];
  } catch (error) {
    console.error('Database connection or query failed:', error);
    throw error;
  }
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
  
  console.log(`Recording interaction: userId=${userId}, userEmail=${userEmail}, prompts=${prompts}, date=${today}`);
  
  // Generate a proper UUID for user_id if it's not already a UUID
  const properUserId = userId.includes('@') ? uuidv4() : userId;
  
  // Upsert daily row
  const { data: existing, error: selectError } = await supabase
    .from('usage_records')
    .select('*')
    .eq('user_email', userEmail)
    .eq('date', today)
    .single();
    
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking existing record:', selectError);
  }
  
  if (existing) {
    console.log(`Updating existing record: id=${existing.id}, current interactions=${existing.interactions}, current prompts=${existing.prompts}`);
    const { error: updateError } = await supabase
      .from('usage_records')
      .update({
        interactions: existing.interactions + 1,
        prompts: existing.prompts + prompts,
      })
      .eq('id', existing.id);
      
    if (updateError) {
      console.error('Error updating record:', updateError);
    } else {
      console.log('Successfully updated usage record');
    }
  } else {
    console.log('Creating new usage record');
    const { error: insertError } = await supabase.from('usage_records').insert({
      user_id: properUserId,
      user_email: userEmail,
      date: today,
      interactions: 1,
      prompts,
    });
    
    if (insertError) {
      console.error('Error inserting record:', insertError);
    } else {
      console.log('Successfully created new usage record');
    }
  }
}

export async function getUsageStats(startDate?: string, endDate?: string) {
  const records = await getUsageRecords();
  console.log(`Retrieved ${records.length} usage records from database`);
  console.log('Raw records:', records);
  
  const filtered = records.filter((r: any) => (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate));
  console.log(`Filtered to ${filtered.length} records for date range: ${startDate || 'no start'} to ${endDate || 'no end'}`);
  
  const totalInteractions = filtered.reduce((sum: number, r: any) => sum + r.interactions, 0);
  const totalPrompts = filtered.reduce((sum: number, r: any) => sum + r.prompts, 0);
  const uniqueUsers = new Set(filtered.map((r: any) => r.user_email)).size;
  
  console.log(`Calculated stats: interactions=${totalInteractions}, prompts=${totalPrompts}, uniqueUsers=${uniqueUsers}`);
  
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
  
  console.log('Chart data:', chartData);
  
  return { totalInteractions, totalPrompts, uniqueUsers, chartData };
}
