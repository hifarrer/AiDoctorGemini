import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  // Guard: devs sometimes paste the Postgres connection string here by mistake
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    throw new Error(
      'Invalid SUPABASE_URL. Expected the Supabase Project URL (https://<project>.supabase.co), but received a Postgres connection string.'
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}


