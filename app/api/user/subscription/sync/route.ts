import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripeInstance } from "@/lib/stripe";
import { updateUser, findUserByEmail } from "@/lib/server/users";

export async function POST() {
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

    // If user has no subscription ID, return current status
    if (!user.subscriptionId) {
      return NextResponse.json({
        plan: user.plan || 'Free',
        status: user.subscriptionStatus || 'active',
        subscriptionId: null,
        nextBillingDate: null,
      });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { message: "Stripe not configured" },
        { status: 500 }
      );
    }

    try {
      // Try to retrieve the subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
      
      // Subscription exists in Stripe, update user status
      const updatedUser = await updateUser(session.user.email, {
        subscriptionStatus: subscription.status,
        plan: subscription.status === 'active' ? user.plan : 'Free',
      } as any);

      return NextResponse.json({
        plan: updatedUser?.plan || 'Free',
        status: updatedUser?.subscriptionStatus || 'active',
        subscriptionId: updatedUser?.subscriptionId,
        nextBillingDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
      });

    } catch (error: any) {
      console.log('Subscription not found in Stripe, cleaning up user data:', {
        userEmail: session.user.email,
        subscriptionId: user.subscriptionId,
        error: error.message
      });

      // Subscription doesn't exist in Stripe, clean up user data
      const updatedUser = await updateUser(session.user.email, {
        plan: 'Free',
        subscriptionId: undefined as any,
        subscriptionStatus: 'canceled',
      } as any);

      return NextResponse.json({
        plan: 'Free',
        status: 'canceled',
        subscriptionId: null,
        nextBillingDate: null,
        message: 'Subscription not found in Stripe, status updated to canceled'
      });
    }

  } catch (error) {
    console.error("Error syncing subscription:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
