import Stripe from 'stripe';

export async function getStripeInstance(): Promise<Stripe | null> {
  try {
    const { getStripeConfig } = await import('./server/settings');
    const config = await getStripeConfig();

    console.log('Stripe config loaded:', {
      hasSecretKey: !!config.secretKey,
      secretKeyLength: config.secretKey?.length,
      hasPublishableKey: !!config.publishableKey,
    });

    if (!config.secretKey) {
      console.error('Stripe secret key not configured');
      return null;
    }

    if (config.secretKey === 'sk_test_your_secret_key_here' || 
        config.secretKey === 'sk_live_your_secret_key_here') {
      console.error('Stripe secret key is still the placeholder value');
      return null;
    }

    if (!config.secretKey.startsWith('sk_test_') && !config.secretKey.startsWith('sk_live_')) {
      console.error('Stripe secret key has invalid format');
      return null;
    }

    // Use Stripe SDK default API version for maximum compatibility
    const stripe = new Stripe(config.secretKey);
    console.log('Stripe instance created successfully');
    return stripe;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
}

// Helper function to create a customer
export async function createStripeCustomer(email: string, name?: string) {
  const stripe = await getStripeInstance();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  return await stripe.customers.create({
    email,
    name,
  });
}

// Helper function to create a subscription
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  paymentMethodId?: string
) {
  const stripe = await getStripeInstance();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  };

  if (paymentMethodId) {
    subscriptionData.default_payment_method = paymentMethodId;
  }

  return await stripe.subscriptions.create(subscriptionData);
}

// Helper function to create a payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string
) {
  const stripe = await getStripeInstance();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  };

  if (customerId) {
    paymentIntentData.customer = customerId;
  }

  return await stripe.paymentIntents.create(paymentIntentData);
}
