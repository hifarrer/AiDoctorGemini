import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import { getSettings } from "@/lib/server/settings";
import { updateUser, findUserByEmail, getUsers } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { message: "No signature provided" },
      { status: 400 }
    );
  }

  const stripe = await getStripeInstance();
  if (!stripe) {
    return NextResponse.json(
      { message: "Stripe not configured" },
      { status: 500 }
    );
  }

  let event;

  try {
    // Verify webhook signature using secret from admin settings
    const webhookSecret = (await getSettings()).stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
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
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
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
  const allUsers = await getUsers();
  const user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
  if (user) {
    await updateUser(user.email, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    } as any);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  const allUsers = await getUsers();
  
  // Try to find user by customer ID first, then by subscription ID
  let user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
  if (!user) {
    user = allUsers.find(u => u.subscriptionId === subscription.id);
  }
  
  if (user) {
    await updateUser(user.email, {
      subscriptionStatus: subscription.status,
    } as any);
    console.log(`Updated user ${user.email} subscription status to ${subscription.status}`);
  } else {
    console.log(`No user found for subscription ${subscription.id}`);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription deleted:', subscription.id);
  
  const allUsers = await getUsers();
  
  // Try to find user by customer ID first, then by subscription ID
  let user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
  if (!user) {
    user = allUsers.find(u => u.subscriptionId === subscription.id);
  }
  
  if (user) {
    await updateUser(user.email, {
      subscriptionId: undefined,
      subscriptionStatus: 'canceled',
      plan: 'Free', // Downgrade to free plan
    } as any);
    console.log(`Updated user ${user.email} subscription to canceled`);
  } else {
    console.log(`No user found for subscription ${subscription.id}`);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('Payment succeeded:', invoice.id);
  
  const allUsers = await getUsers();
  const user = allUsers.find(u => u.stripeCustomerId === invoice.customer);
  if (user) {
    await updateUser(user.email, {
      subscriptionStatus: 'active',
    } as any);
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('Payment failed:', invoice.id);
  
  const allUsers = await getUsers();
  const user = allUsers.find(u => u.stripeCustomerId === invoice.customer);
  if (user) {
    await updateUser(user.email, {
      subscriptionStatus: 'past_due',
    } as any);
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    console.log('Checkout session completed:', session.id);
    // session contains: customer, subscription, metadata, etc.
    const allUsers = await getUsers();
    const user = allUsers.find(u => u.email === session.customer_details?.email || u.stripeCustomerId === session.customer);
    if (!user) {
      console.log('No user matched for checkout.session.completed');
      return;
    }

    const planTitle = session.metadata?.plan_title;
    const subscriptionId = session.subscription;

    await updateUser(user.email, {
      plan: planTitle || user.plan,
      subscriptionId: typeof subscriptionId === 'string' ? subscriptionId : undefined,
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer || user.stripeCustomerId,
    } as any);
    console.log(`Updated user ${user.email} after Checkout: plan=${planTitle}, subscriptionId=${subscriptionId}`);
  } catch (e) {
    console.error('Failed to handle checkout.session.completed:', e);
  }
}
