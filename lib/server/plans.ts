import fs from 'fs';
import path from 'path';
import { Plan } from '../plans';
import { getStripeInstance } from '../stripe';
import { getSettings } from './settings';

// Path to the JSON file for persistent storage
const PLANS_FILE_PATH = path.join(process.cwd(), 'data', 'plans.json');

// Ensure the data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(PLANS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load plans from JSON file
function loadPlans(): Plan[] {
  try {
    ensureDataDirectory();
    if (fs.existsSync(PLANS_FILE_PATH)) {
      const data = fs.readFileSync(PLANS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading plans:', error);
  }
  
  // Return default plans if file doesn't exist or is corrupted
  return [
    {
      id: "1",
      title: "Free",
      description: "Perfect for getting started",
      features: [
        "5 AI consultations per month",
        "Basic health information",
        "Email support",
        "Standard response time"
      ],
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
      isPopular: false,
    },
    {
      id: "2",
      title: "Basic",
      description: "Great for regular users",
      features: [
        "50 AI consultations per month",
        "Priority health information",
        "Image analysis (5 per month)",
        "Email & chat support",
        "Faster response time",
        "Health history tracking"
      ],
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      isActive: true,
      isPopular: true,
    },
    {
      id: "3",
      title: "Premium",
      description: "For healthcare professionals",
      features: [
        "Unlimited AI consultations",
        "Advanced health analysis",
        "Unlimited image analysis",
        "Priority support",
        "Fastest response time",
        "Advanced health tracking",
        "Custom health reports",
        "API access"
      ],
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      isActive: true,
      isPopular: false,
    },
  ];
}

// Save plans to JSON file
function savePlans(plans: Plan[]) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(PLANS_FILE_PATH, JSON.stringify(plans, null, 2));
  } catch (error) {
    console.error('Error saving plans:', error);
  }
}

// Initialize plans array
let plans: Plan[] = loadPlans();

// Export functions to manage plans
export function getPlans(): Plan[] {
  return plans;
}

export function addPlan(plan: Plan) {
  plans.push(plan);
  savePlans(plans);
}

export function updatePlan(id: string, updates: Partial<Plan>) {
  const planIndex = plans.findIndex(p => p.id === id);
  if (planIndex !== -1) {
    plans[planIndex] = { ...plans[planIndex], ...updates };
    // Persist first
    savePlans(plans);
    return plans[planIndex];
  }
  return null;
}

export function deletePlan(id: string) {
  const planIndex = plans.findIndex(p => p.id === id);
  if (planIndex !== -1) {
    plans.splice(planIndex, 1);
    savePlans(plans);
    return true;
  }
  return false;
}

export function findPlanById(id: string): Plan | undefined {
  return plans.find(p => p.id === id);
}

// Export the plans array for backward compatibility
export { plans };

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
  const stripe = getStripeInstance();
  if (!stripe) {
    // Stripe not configured; return plan unchanged
    return plan;
  }

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
    product = await stripe.products.create({
      name: plan.title,
      active: plan.isActive,
      metadata: { planId: plan.id },
    });
  } else {
    // Keep product in sync
    const updates: any = {};
    if (product.name !== plan.title) updates.name = plan.title;
    if (!!product.active !== !!plan.isActive) updates.active = !!plan.isActive;
    if (Object.keys(updates).length) {
      product = await stripe.products.update(product.id, updates);
    }
  }
  productId = product.id;

  // Ensure prices
  const monthlyCents = Math.round((plan.monthlyPrice || 0) * 100);
  const yearlyCents = Math.round((plan.yearlyPrice || 0) * 100);

  let monthlyPriceId: string | undefined = plan.stripePriceIds?.monthly;
  let yearlyPriceId: string | undefined = plan.stripePriceIds?.yearly;

  monthlyPriceId = await ensureStripePrice(stripe, productId, monthlyCents, 'month');
  yearlyPriceId = await ensureStripePrice(stripe, productId, yearlyCents, 'year');

  // Update plan with Stripe linkage
  const planIndex = plans.findIndex(p => p.id === plan.id);
  if (planIndex !== -1) {
    plans[planIndex] = {
      ...plans[planIndex],
      stripeProductId: productId,
      stripePriceIds: { monthly: monthlyPriceId, yearly: yearlyPriceId },
    };
    savePlans(plans);
    return plans[planIndex];
  }
  return plan;
}

export async function syncPlanWithStripeById(id: string): Promise<Plan | null> {
  const plan = findPlanById(id);
  if (!plan) return null;
  return await syncPlanWithStripe(plan);
}
