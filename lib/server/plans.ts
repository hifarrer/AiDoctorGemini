import { Plan } from '../plans';
import { getStripeInstance } from '../stripe';
import { getSupabaseServerClient } from '@/lib/supabase/server';

function rowToPlan(row: any): Plan {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    features: row.features || [],
    monthlyPrice: Number(row.monthly_price || 0),
    yearlyPrice: Number(row.yearly_price || 0),
    isActive: !!row.is_active,
    isPopular: !!row.is_popular,
    interactionsLimit: row.interactions_limit !== null ? Number(row.interactions_limit) : null,
    stripeProductId: row.stripe_product_id || undefined,
    stripePriceIds: row.stripe_price_ids || undefined,
  } as any;
}

function planToRow(updates: Partial<Plan>): any {
  return {
    title: updates.title,
    description: updates.description,
    features: updates.features as any,
    monthly_price: updates.monthlyPrice as any,
    yearly_price: updates.yearlyPrice as any,
    is_active: updates.isActive as any,
    is_popular: updates.isPopular as any,
    interactions_limit: updates.interactionsLimit as any,
    stripe_product_id: updates.stripeProductId as any,
    stripe_price_ids: updates.stripePriceIds as any,
  };
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('plans').select('*').order('monthly_price');
  if (error) throw error;
  return (data || []).map(rowToPlan);
}

export async function addPlan(plan: Plan): Promise<Plan> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('plans').insert(planToRow(plan)).select('*').single();
  if (error) throw error;
  return rowToPlan(data);
}

export async function updatePlan(id: string, updates: Partial<Plan>): Promise<Plan | null> {
  const supabase = getSupabaseServerClient();
  const payload = planToRow(updates);
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  let query = supabase.from('plans').update(payload);
  if (isUuid) {
    query = query.eq('id', id);
  } else if (updates.title) {
    query = query.eq('title', updates.title);
  } else {
    // As a last resort, try numeric cast fallback on monthly_price to avoid crash (no-op selector)
    // but return null to signal not found/invalid id
    return null;
  }
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data ? rowToPlan(data) : null;
}

export async function deletePlan(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function findPlanById(id: string): Promise<Plan | undefined> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('plans').select('*').eq('id', id).single();
  return data ? rowToPlan(data) : undefined;
}

// --- Stripe Sync Helpers ---

async function findStripeProductByPlanId(stripe: any, planId: string) {
  // List and find by metadata.planId
  const products: any[] = [];
  let startingAfter: string | undefined;
  do {
    const res = await stripe.products.list({ limit: 100, starting_after: startingAfter });
    products.push(...res.data);
    startingAfter = res.has_more ? res.data[res.data.length - 1].id : undefined;
  } while (startingAfter);
  return products.find(p => p.metadata?.planId === planId);
}

async function ensureStripePrice(stripe: any, productId: string, unitAmountCents: number, interval: 'month' | 'year') {
  // Look for existing active price with same interval and amount
  const prices: any[] = [];
  let startingAfter: string | undefined;
  do {
    const res = await stripe.prices.list({ product: productId, limit: 100, starting_after: startingAfter });
    prices.push(...res.data);
    startingAfter = res.has_more ? res.data[res.data.length - 1].id : undefined;
  } while (startingAfter);

  const match = prices.find(p => p.active && p.currency === 'usd' && p.unit_amount === unitAmountCents && p.recurring?.interval === (interval === 'month' ? 'month' : 'year'));
  if (match) return match.id;

  // Deactivate old active prices for this interval
  const toDeactivate = prices.filter(p => p.active && p.recurring?.interval === (interval === 'month' ? 'month' : 'year'));
  for (const price of toDeactivate) {
    try { await stripe.prices.update(price.id, { active: false }); } catch {}
  }

  const created = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmountCents,
    currency: 'usd',
    recurring: { interval: interval === 'month' ? 'month' : 'year' },
  });
  return created.id;
}

export async function syncPlanWithStripe(plan: Plan): Promise<Plan> {
  const stripe = await getStripeInstance();
  if (!stripe) return plan;

  // Ensure product
  let productId = plan.stripeProductId;
  let product: any | null = null;
  if (productId) {
    try { product = await stripe.products.retrieve(productId); } catch { product = null; }
  }
  if (!product) {
    product = await findStripeProductByPlanId(stripe, plan.id);
  }
  if (!product) {
    product = await stripe.products.create({ name: plan.title, active: plan.isActive, metadata: { planId: plan.id } });
  } else {
    const updates: any = {};
    if (product.name !== plan.title) updates.name = plan.title;
    if (!!product.active !== !!plan.isActive) updates.active = !!plan.isActive;
    if (Object.keys(updates).length) product = await stripe.products.update(product.id, updates);
  }
  productId = product.id;

  // Ensure prices
  const monthlyCents = Math.round((plan.monthlyPrice || 0) * 100);
  const yearlyCents = Math.round((plan.yearlyPrice || 0) * 100);
  const monthlyPriceId = await ensureStripePrice(stripe, productId!, monthlyCents, 'month');
  const yearlyPriceId = await ensureStripePrice(stripe, productId!, yearlyCents, 'year');

  // Persist to Supabase
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('plans')
    .update({ stripe_product_id: productId, stripe_price_ids: { monthly: monthlyPriceId, yearly: yearlyPriceId } })
    .eq('id', plan.id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToPlan(data);
}

export async function syncPlanWithStripeById(id: string): Promise<Plan | null> {
  const plan = await findPlanById(id);
  if (!plan) return null;
  return await syncPlanWithStripe(plan);
}
