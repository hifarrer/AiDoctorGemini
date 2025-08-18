import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripeInstance } from "@/lib/stripe";
import { updateUser, findUserByEmail } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { message: "No Stripe customer ID found" },
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

    // Get customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription found, update user to Free plan
      await updateUser(user.email, {
        subscriptionId: undefined,
        subscriptionStatus: 'canceled',
        plan: 'Free',
      });

      return NextResponse.json({
        message: "Subscription synced - No active subscription found",
        subscription: null,
      });
    }

    const subscription = subscriptions.data[0];
    
    // Update user with current subscription status
    await updateUser(user.email, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      plan: subscription.status === 'active' ? user.plan : 'Free', // Keep current plan if active
    });

    return NextResponse.json({
      message: "Subscription synced successfully",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
      },
    });

  } catch (error) {
    console.error("Error syncing subscription:", error);
    return NextResponse.json(
      { message: "Failed to sync subscription" },
      { status: 500 }
    );
  }
}
