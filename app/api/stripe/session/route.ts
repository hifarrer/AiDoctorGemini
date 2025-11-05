import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripeInstance } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return NextResponse.json({ message: "Stripe not configured" }, { status: 500 });
    }

    // Retrieve the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'subscription']
    });

    // Get payment intent ID for transaction_id
    let transactionId = '';
    if (checkoutSession.payment_intent) {
      if (typeof checkoutSession.payment_intent === 'string') {
        transactionId = checkoutSession.payment_intent;
      } else {
        transactionId = checkoutSession.payment_intent.id;
      }
    } else if (checkoutSession.subscription) {
      // For subscriptions, use the subscription ID as transaction ID
      if (typeof checkoutSession.subscription === 'string') {
        transactionId = checkoutSession.subscription;
      } else {
        transactionId = checkoutSession.subscription.id;
      }
    }

    // Get the amount paid
    const amountTotal = checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0;

    return NextResponse.json({
      sessionId: checkoutSession.id,
      transactionId,
      amountTotal,
      currency: checkoutSession.currency || 'usd',
      status: checkoutSession.status,
    });
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

