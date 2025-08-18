import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { findUserByEmail } from "@/lib/server/users";

export async function GET() {
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

    return NextResponse.json({
      plan: user.plan || 'Free',
      status: user.subscriptionStatus || 'active',
      subscriptionId: user.subscriptionId,
      // In a real app, you would fetch next billing date from Stripe
      nextBillingDate: user.subscriptionId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
