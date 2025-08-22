import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripeInstance } from "@/lib/stripe";
import { findUserByEmail, updateUser } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log('Setup intent request for user:', session.user.email);

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      console.log('User not found:', session.user.email);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log('User found:', { email: user.email, stripeCustomerId: user.stripeCustomerId });

    const stripe = await getStripeInstance();
    if (!stripe) {
      console.error('Stripe not configured - getStripeInstance returned null');
      return NextResponse.json({ message: "Stripe not configured" }, { status: 500 });
    }

    console.log('Stripe instance created successfully');

    let customerId = user.stripeCustomerId;
    
    // If user has a customer ID, verify it exists in the current Stripe environment
    if (customerId) {
      try {
        console.log('Verifying existing Stripe customer:', customerId);
        await stripe.customers.retrieve(customerId);
        console.log('Existing customer verified successfully');
      } catch (customerError: any) {
        console.log('Existing customer not found or invalid:', customerError.message);
        // Clear the invalid customer ID and create a new one
        customerId = null;
        await updateUser(user.email, { stripeCustomerId: null } as any);
        console.log('Cleared invalid customer ID from user record');
      }
    }
    
    if (!customerId) {
      console.log('Creating new Stripe customer for user:', user.email);
      try {
        const customer = await stripe.customers.create({ 
          email: user.email, 
          name: user.firstName || undefined 
        });
        customerId = customer.id;
        console.log('Stripe customer created:', customerId);
        
        await updateUser(user.email, { stripeCustomerId: customerId } as any);
        console.log('User updated with Stripe customer ID');
      } catch (customerError) {
        console.error('Error creating Stripe customer:', customerError);
        return NextResponse.json({ 
          message: "Failed to create customer",
          error: customerError instanceof Error ? customerError.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      console.log('Using existing Stripe customer:', customerId);
    }

    console.log('Creating setup intent for customer:', customerId);
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
    });

    console.log('Setup intent created successfully:', setupIntent.id);
    return NextResponse.json({ clientSecret: setupIntent.client_secret }, { status: 200 });
  } catch (error) {
    console.error('SetupIntent error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'Failed to create setup intent',
      error: errorMessage
    }, { status: 500 });
  }
}


