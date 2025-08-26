import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordUserInteraction } from "@/lib/server/user-interactions";
import { findUserByEmail } from "@/lib/server/users";
import { getPlans } from "@/lib/server/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('🧪 TEST: Starting interaction recording test...');

    // Get user from database
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log('🧪 TEST: User found:', { id: user.id, email: user.email, plan: user.plan });

    // Get all plans
    const plans = await getPlans();
    const userPlan = plans.find(plan => plan.title === user.plan) || plans.find(plan => plan.title === 'Free');
    
    if (!userPlan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 500 }
      );
    }

    console.log('🧪 TEST: User plan found:', { id: userPlan.id, title: userPlan.title, interactionsLimit: userPlan.interactionsLimit });

    // Try to record an interaction
    try {
      await recordUserInteraction(user.id, userPlan.id, 'chat');
      console.log('🧪 TEST: ✅ Interaction recorded successfully!');
      
      return NextResponse.json({
        success: true,
        message: "Interaction recorded successfully",
        user: { id: user.id, email: user.email, plan: user.plan },
        plan: { id: userPlan.id, title: userPlan.title, interactionsLimit: userPlan.interactionsLimit }
      });
    } catch (error) {
      console.error('🧪 TEST: ❌ Failed to record interaction:', error);
      
      return NextResponse.json({
        success: false,
        message: "Failed to record interaction",
        error: error instanceof Error ? error.message : 'Unknown error',
        user: { id: user.id, email: user.email, plan: user.plan },
        plan: { id: userPlan.id, title: userPlan.title, interactionsLimit: userPlan.interactionsLimit }
      });
    }

  } catch (error) {
    console.error('🧪 TEST: ❌ Error in test endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
