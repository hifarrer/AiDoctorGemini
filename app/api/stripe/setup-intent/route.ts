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

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return NextResponse.json({ message: "Stripe not configured" }, { status: 500 });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.firstName });
      customerId = customer.id;
      await updateUser(user.email, { stripeCustomerId: customerId } as any);
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret }, { status: 200 });
  } catch (error) {
    console.error('SetupIntent error:', error);
    return NextResponse.json({ message: 'Failed to create setup intent' }, { status: 500 });
  }
}


