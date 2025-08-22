import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripeInstance } from "@/lib/stripe";
import { findPlanById } from "@/lib/server/plans";
import { getSettings } from "@/lib/server/settings";
import { findUserByEmail } from "@/lib/server/users";

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

    // Resolve priceId from plan only
    const priceId = billingCycle === 'yearly' ? plan.stripePriceIds?.yearly : plan.stripePriceIds?.monthly;

    if (!priceId) {
      return NextResponse.json({ message: "Price not configured for this plan" }, { status: 400 });
    }

    // Log environment and validate the price exists in current environment
    try {
      const cfg = await getSettings();
      const isLive = cfg.stripeSecretKey?.startsWith('sk_live_');
      console.log('Checkout environment:', isLive ? 'LIVE' : 'TEST');
      console.log('Using price ID:', priceId);
      // Ensure price exists in this Stripe account/env
      await stripe.prices.retrieve(priceId);
    } catch (e: any) {
      const msg = e?.message || 'Unknown error';
      console.error('Price validation failed:', msg);
      return NextResponse.json({
        message: `Configured price ID not found in current Stripe environment. Update the plan's Stripe Price IDs in Admin > Plans. (${msg})`,
        code: 'PRICE_NOT_FOUND',
        priceId,
      }, { status: 400 });
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


