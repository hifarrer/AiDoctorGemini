import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { updateUser, findUserByEmail } from "@/lib/server/users";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json(
        { message: "Plan is required" },
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

    // Update user's plan
    const updates: any = { plan };
    
    // If switching to Free plan, clear subscription data
    if (plan === 'Free') {
      updates.subscriptionId = undefined as any;
      updates.subscriptionStatus = 'canceled';
    }

    const updatedUser = await updateUser(session.user.email, updates);
    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update plan" },
        { status: 500 }
      );
    }

          return NextResponse.json(
        { 
          message: "Plan updated successfully",
          plan: updatedUser.plan
        },
        { status: 200 }
      );
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
