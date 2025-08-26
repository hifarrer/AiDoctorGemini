import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserByEmail } from "@/lib/server/users";
import { getPlans } from "@/lib/server/plans";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Get all plans
    const plans = await getPlans();
    
    // Find the user's plan
    const userPlan = plans.find(plan => plan.title === user.plan) || plans.find(plan => plan.title === 'Free');

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan
      },
      allPlans: plans.map(p => ({
        id: p.id,
        title: p.title,
        interactionsLimit: p.interactionsLimit
      })),
      userPlan: userPlan ? {
        id: userPlan.id,
        title: userPlan.title,
        interactionsLimit: userPlan.interactionsLimit
      } : null,
      debug: {
        userPlanTitle: user.plan,
        foundPlan: userPlan?.title,
        hasUnlimited: userPlan?.interactionsLimit === null
      }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
