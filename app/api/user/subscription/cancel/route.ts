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

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { message: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.subscriptionId !== subscriptionId) {
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 404 }
      );
    }

    // Cancel subscription in Stripe
    const stripe = await getStripeInstance();
    if (stripe) {
      try {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (error) {
        console.error("Error cancelling subscription in Stripe:", error);
        return NextResponse.json(
          { message: "Failed to cancel subscription" },
          { status: 500 }
        );
      }
    }

    // Update user: set plan to Free, clear subscription, mark canceled
    const updatedUser = await updateUser(session.user.email, {
      plan: 'Free',
      subscriptionId: undefined as any,
      subscriptionStatus: 'canceled',
    } as any);
    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update subscription status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Subscription cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
