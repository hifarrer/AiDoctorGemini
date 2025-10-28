import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  password: string;
  plan?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  createdAt?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

export async function getUsers(): Promise<User[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToUser);
}

export async function addUser(user: User): Promise<User> {
  const supabase = getSupabaseServerClient();
  const payload = userToRow(user);
  // Remove undefined fields to avoid inserting nulls explicitly
  Object.keys(payload).forEach((k) => (payload as any)[k] === undefined && delete (payload as any)[k]);
  const { data, error } = await supabase.from('users').insert(payload).select('*').single();
  if (error) throw error;
  return rowToUser(data);
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  const payload = userToRow(updates as User);
  Object.keys(payload).forEach((k) => (payload as any)[k] === undefined && delete (payload as any)[k]);
  const { data, error } = await supabase.from('users').update(payload).eq('email', email).select('*').single();
  if (error) throw error;
  return data ? rowToUser(data) : null;
}

export async function deleteUser(email: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('users').delete().eq('email', email);
  if (error) throw error;
  return true;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('users').select('*').eq('email', email).single();
  return data ? rowToUser(data) : undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data ? rowToUser(data) : undefined;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    firstName: row.first_name ?? undefined,
    plan: row.plan ?? undefined,
    isActive: row.is_active ?? undefined,
    isAdmin: row.is_admin ?? undefined,
    createdAt: row.created_at ?? undefined,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    subscriptionId: row.subscription_id ?? undefined,
    subscriptionStatus: row.subscription_status ?? undefined,
    resetToken: row.reset_token ?? undefined,
    resetTokenExpiry: row.reset_token_expiry ?? undefined,
  };
}

function userToRow(user: User): any {
  return {
    id: (user as any).id,
    email: user.email,
    password: user.password,
    first_name: user.firstName,
    plan: user.plan,
    is_active: user.isActive,
    is_admin: user.isAdmin,
    created_at: user.createdAt,
    stripe_customer_id: user.stripeCustomerId,
    subscription_id: user.subscriptionId,
    subscription_status: user.subscriptionStatus,
    reset_token: user.resetToken,
    reset_token_expiry: user.resetTokenExpiry,
  };
}
