import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createStripeCustomer, createStripeSubscription } from "@/lib/stripe";
import { updateUser, findUserByEmail } from "@/lib/server/users";
import { findPlanById } from "@/lib/server/plans";
import { getStripeInstance } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    console.log('=== SUBSCRIPTION CREATION START ===');
    const session = await getServerSession();

    if (!session?.user?.email) {
      console.log('No session or user email found');
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('User session found:', session.user.email);

    const body = await request.json();
    const { planId, paymentMethodId, billingCycle = 'monthly' } = body;

    console.log('Request body:', { planId, paymentMethodId, billingCycle });

    if (!planId) {
      console.log('Plan ID missing');
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Find the plan
    const plan = await findPlanById(planId);
    if (!plan) {
      console.log('Plan not found for ID:', planId);
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }

    console.log('Plan found:', { title: plan.title, monthlyPrice: plan.monthlyPrice, yearlyPrice: plan.yearlyPrice });

    // Find the user
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      console.log('User not found:', session.user.email);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log('User found:', { email: user.email, stripeCustomerId: user.stripeCustomerId });

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (customerId) {
      try {
        console.log('Verifying existing Stripe customer for subscription:', customerId);
        const stripe = await getStripeInstance();
        if (stripe) {
          await stripe.customers.retrieve(customerId);
          console.log('Existing customer verified successfully for subscription');
        }
      } catch (customerError: any) {
        console.log('Existing customer not found or invalid for subscription:', customerError.message);
        // Clear the invalid customer ID and create a new one
        customerId = undefined;
        await updateUser(session.user.email, { stripeCustomerId: undefined } as any);
        console.log('Cleared invalid customer ID from user record for subscription');
      }
    }
    
    if (!customerId) {
      try {
        console.log('Creating new Stripe customer for subscription');
        const customer = await createStripeCustomer(
          user.email,
          user.firstName
        );
        customerId = customer.id;
        console.log('Stripe customer created for subscription:', customerId);
        
        // Update user with Stripe customer ID
        await updateUser(session.user.email, { stripeCustomerId: customerId } as any);
        console.log('User updated with Stripe customer ID for subscription');
      } catch (error) {
        console.error("Error creating Stripe customer:", error);
        return NextResponse.json(
          { message: "Failed to create customer" },
          { status: 500 }
        );
      }
    }

    // Derive Stripe price ID from plan stored linkage only
    const priceId = billingCycle === 'yearly' ? plan.stripePriceIds?.yearly : plan.stripePriceIds?.monthly;
    if (!priceId) {
      console.error(`Price ID missing for plan '${plan.title}' and cycle '${billingCycle}'. Set Stripe price IDs on the plan in Admin > Plans.`);
      return NextResponse.json({ message: "Price not configured for this plan" }, { status: 400 });
    }

    console.log('Price ID resolved:', { priceId, billingCycle, planTitle: plan.title });

    // Create subscription
    try {
      console.log("Creating subscription with:", { customerId, priceId, paymentMethodId });
      
      const subscription = await createStripeSubscription(
        customerId,
        priceId,
        paymentMethodId
      );

      console.log("Subscription created successfully:", { id: subscription.id, status: subscription.status });

      // Update user's plan
      await updateUser(session.user.email, {
        plan: plan.title,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      } as any);

      console.log('User plan updated successfully');

      // Extract client secret from the subscription or payment intent
      let clientSecret: string | undefined;
      try {
        const stripe = await (await import('@/lib/stripe')).getStripeInstance();
        const latest = (subscription as any).latest_invoice;
        if (stripe && latest) {
          if (typeof latest === 'string') {
            const inv = await stripe.invoices.retrieve(latest, { expand: ['payment_intent'] });
            const pi = (inv as any).payment_intent;
            if (pi && typeof pi === 'object') clientSecret = pi.client_secret;
            if (!clientSecret && typeof pi === 'string') {
              const intent = await stripe.paymentIntents.retrieve(pi);
              clientSecret = intent.client_secret || clientSecret;
            }
          } else if (typeof latest === 'object') {
            const pi = (latest as any).payment_intent;
            if (pi && typeof pi === 'object') clientSecret = pi.client_secret;
            if (!clientSecret && typeof pi === 'string') {
              const intent = await stripe.paymentIntents.retrieve(pi);
              clientSecret = intent.client_secret || clientSecret;
            }
          }
        }
        // Fallback: check pending_setup_intent for setups-only flows
        if (!clientSecret && (subscription as any).pending_setup_intent) {
          const si = (subscription as any).pending_setup_intent;
          if (stripe) {
            const setup = typeof si === 'string' ? await stripe.setupIntents.retrieve(si) : si;
            clientSecret = (setup as any).client_secret || clientSecret;
          }
        }
      } catch {} 

      console.log("Subscription response:", {
        id: subscription.id,
        status: subscription.status,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length
      });

      console.log('=== SUBSCRIPTION CREATION SUCCESS ===');
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
      console.log('=== SUBSCRIPTION CREATION FAILED ===');
      return NextResponse.json(
        { message: "Failed to create subscription", error: message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Subscription creation error:", error);
    console.log('=== SUBSCRIPTION CREATION ERROR ===');
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// No helper needed; price IDs are stored per plan
