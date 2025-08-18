import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createStripeCustomer, createStripeSubscription } from "@/lib/stripe";
import { updateUser, findUserByEmail } from "@/lib/server/users";
import { getSettings } from "@/lib/server/settings";
import { findPlanById } from "@/lib/server/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, paymentMethodId, billingCycle = 'monthly' } = body;

    if (!planId) {
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Find the plan
    const plan = findPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }

    // Find the user
    const user = findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      try {
        const customer = await createStripeCustomer(
          user.email,
          user.firstName
        );
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        updateUser(session.user.email, { stripeCustomerId: customerId });
      } catch (error) {
        console.error("Error creating Stripe customer:", error);
        return NextResponse.json(
          { message: "Failed to create customer" },
          { status: 500 }
        );
      }
    }

    // Derive Stripe price ID from plan stored linkage, or fall back to Admin Settings mapping
    let priceId = billingCycle === 'yearly' ? plan.stripePriceIds?.yearly : plan.stripePriceIds?.monthly;
    if (!priceId) {
      try {
        const settings = getSettings();
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
      } catch (e) {
        // ignore and handle below
      }
    }
    if (!priceId) {
      console.error(`Price ID missing for plan '${plan.title}' and cycle '${billingCycle}'. Ensure plan is synced or settings have price IDs.`);
      return NextResponse.json({ message: "Price not configured for this plan" }, { status: 400 });
    }

    // Create subscription
    try {
      console.log("Creating subscription with:", { customerId, priceId, paymentMethodId });
      
      const subscription = await createStripeSubscription(
        customerId,
        priceId,
        paymentMethodId
      );

      console.log("Subscription created successfully:", subscription.id);

      // Update user's plan
      updateUser(session.user.email, {
        plan: plan.title,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });

      // Extract client secret from the subscription
      let clientSecret: string | undefined;
      
      if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
        const invoice = subscription.latest_invoice as any;
        if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
          clientSecret = invoice.payment_intent.client_secret;
        }
      }

      console.log("Subscription response:", {
        id: subscription.id,
        status: subscription.status,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length
      });

      return NextResponse.json(
        {
          message: "Subscription created successfully",
          subscription: {
            id: subscription.id,
            status: subscription.status,
            clientSecret: clientSecret,
          }
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error creating subscription:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { message: "Failed to create subscription", error: message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// No helper needed; price IDs are stored per plan
