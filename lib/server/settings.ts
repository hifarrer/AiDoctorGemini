import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface Settings {
  siteName: string;
  siteDescription?: string;
  contactEmail?: string;
  supportEmail?: string;
  logoUrl?: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret?: string;
  stripePriceIds?: {
    basic: {
      monthly: string;
      yearly: string;
    };
    premium: {
      monthly: string;
      yearly: string;
    };
  };
}

export async function getSettings(): Promise<Settings> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error || !data) {
    throw new Error('Settings not found in database');
  }
  const priceIds = (data.stripe_price_ids as any) || {};
  return {
    siteName: data.site_name,
    siteDescription: data.site_description,
    contactEmail: data.contact_email,
    supportEmail: data.support_email,
    logoUrl: data.logo_url,
    stripeSecretKey: data.stripe_secret_key,
    stripePublishableKey: data.stripe_publishable_key,
    stripeWebhookSecret: data.stripe_webhook_secret,
    stripePriceIds: {
      basic: { monthly: priceIds?.basic?.monthly || '', yearly: priceIds?.basic?.yearly || '' },
      premium: { monthly: priceIds?.premium?.monthly || '', yearly: priceIds?.premium?.yearly || '' },
    },
  };
}

export async function updateSettings(updates: Partial<Settings>) {
  const supabase = getSupabaseServerClient();
  const payload: any = {
    site_name: updates.siteName,
    site_description: updates.siteDescription,
    contact_email: updates.contactEmail,
    support_email: updates.supportEmail,
    logo_url: updates.logoUrl,
    stripe_secret_key: updates.stripeSecretKey,
    stripe_publishable_key: updates.stripePublishableKey,
    stripe_webhook_secret: updates.stripeWebhookSecret,
    stripe_price_ids: updates.stripePriceIds as any,
  };
  // Remove undefined to avoid overwriting with null
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  const { data, error } = await supabase.from('settings').upsert({ id: 1, ...payload }).select('*').single();
  if (error) throw error;
  return getSettings();
}

export async function getStripeConfig() {
  const s = await getSettings();
  return { secretKey: s.stripeSecretKey, publishableKey: s.stripePublishableKey };
}
