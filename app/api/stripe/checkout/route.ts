import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripeInstance } from "@/lib/stripe";
import { findPlanById } from "@/lib/server/plans";
import { getSettings } from "@/lib/server/settings";
import { findUserByEmail, updateUser } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { planId, billingCycle = 'monthly' } = await request.json();
    if (!planId) {
      return NextResponse.json({ message: "Plan ID is required" }, { status: 400 });
    }

    const plan = await findPlanById(planId);
    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return NextResponse.json({ message: "Stripe not configured" }, { status: 500 });
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Resolve priceId from plan or settings as fallback
    let priceId = billingCycle === 'yearly' ? plan.stripePriceIds?.yearly : plan.stripePriceIds?.monthly;
    if (!priceId) {
      try {
        const settings = await getSettings();
        const cycleKey = billingCycle === 'yearly' ? 'yearly' : 'monthly';
        const titleLower = (plan.title || '').toLowerCase();
        const isPremium = titleLower.includes('premium');
        const isBasic = titleLower.includes('basic');
        const mapped = isPremium
          ? settings.stripePriceIds?.premium
          : isBasic
          ? settings.stripePriceIds?.basic
          : undefined;
        const fallbackId = mapped ? (mapped as any)[cycleKey] : undefined;
        if (fallbackId) {
          priceId = fallbackId;
        }
      } catch {}
    }

    if (!priceId) {
      return NextResponse.json({ message: "Price not configured for this plan" }, { status: 400 });
    }

    // Create Checkout Session
    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${request.nextUrl.origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/plans?canceled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          user_email: user.email,
          plan_id: plan.id,
          plan_title: plan.title,
        },
      },
      metadata: {
        user_email: user.email,
        plan_id: plan.id,
        plan_title: plan.title,
        billing_cycle: billingCycle,
      },
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ id: checkoutSession.id, url: checkoutSession.url }, { status: 200 });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ message: error?.message || 'Failed to create checkout session' }, { status: 500 });
  }
}


