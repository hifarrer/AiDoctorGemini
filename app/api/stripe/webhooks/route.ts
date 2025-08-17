import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import { getSettings } from "@/lib/server/settings";
import { updateUser, findUserByEmail } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { message: "No signature provided" },
      { status: 400 }
    );
  }

  const stripe = getStripeInstance();
  if (!stripe) {
    return NextResponse.json(
      { message: "Stripe not configured" },
      { status: 500 }
    );
  }

  let event;

  try {
    // Verify webhook signature using secret from admin settings
    const webhookSecret = getSettings().stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { message: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Subscription created:', subscription.id);
  
  // Find user by customer ID
  const { getUsers } = await import("@/lib/server/users");
  const allUsers = getUsers();
  const user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
  if (user) {
    updateUser(user.email, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  const { getUsers } = await import("@/lib/server/users");
  const allUsers = getUsers();
  
  // Try to find user by customer ID first, then by subscription ID
  let user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
  if (!user) {
    user = allUsers.find(u => u.subscriptionId === subscription.id);
  }
  
  if (user) {
    updateUser(user.email, {
      subscriptionStatus: subscription.status,
    });
    console.log(`Updated user ${user.email} subscription status to ${subscription.status}`);
  } else {
    console.log(`No user found for subscription ${subscription.id}`);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription deleted:', subscription.id);
  
  const { getUsers } = await import("@/lib/server/users");
  const allUsers = getUsers();
  
  // Try to find user by customer ID first, then by subscription ID
  let user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
  if (!user) {
    user = allUsers.find(u => u.subscriptionId === subscription.id);
  }
  
  if (user) {
    updateUser(user.email, {
      subscriptionId: undefined,
      subscriptionStatus: 'canceled',
      plan: 'Free', // Downgrade to free plan
    });
    console.log(`Updated user ${user.email} subscription to canceled`);
  } else {
    console.log(`No user found for subscription ${subscription.id}`);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('Payment succeeded:', invoice.id);
  
  const { getUsers } = await import("@/lib/server/users");
  const allUsers = getUsers();
  const user = allUsers.find(u => u.stripeCustomerId === invoice.customer);
  if (user) {
    updateUser(user.email, {
      subscriptionStatus: 'active',
    });
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('Payment failed:', invoice.id);
  
  const { getUsers } = await import("@/lib/server/users");
  const allUsers = getUsers();
  const user = allUsers.find(u => u.stripeCustomerId === invoice.customer);
  if (user) {
    updateUser(user.email, {
      subscriptionStatus: 'past_due',
    });
  }
}
