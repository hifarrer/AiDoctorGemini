import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canUserInteract, recordUserInteraction, getUserInteractionStats } from "@/lib/server/user-interactions";
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

    const userId = (session as any).user?.id;
    
    // Get user from database to get their actual plan
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log('🔍 DEBUG: User plan from database:', user.plan);

    // Get all plans and find the one matching the user's plan
    const plans = await getPlans();
    console.log('🔍 DEBUG: All plans:', plans.map(p => ({ id: p.id, title: p.title, interactionsLimit: p.interactionsLimit })));
    
    const userPlan = plans.find(plan => plan.title === user.plan) || plans.find(plan => plan.title === 'Free');
    
    console.log('🔍 DEBUG: Found user plan:', userPlan ? { 
      id: userPlan.id, 
      title: userPlan.title, 
      interactionsLimit: userPlan.interactionsLimit 
    } : 'NOT FOUND');
    
    if (!userPlan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 500 }
      );
    }

    const stats = await getUserInteractionStats(userId, userPlan.id);
    console.log('🔍 DEBUG: Interaction stats:', stats);

    return NextResponse.json({
      currentMonth: stats.currentMonth,
      limit: stats.limit,
      remaining: stats.remaining,
      hasUnlimited: stats.limit === null
    });

  } catch (error) {
    console.error('Error getting interaction stats:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session as any).user?.id;
    
    // Get user from database to get their actual plan
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Get all plans and find the one matching the user's plan
    const plans = await getPlans();
    const userPlan = plans.find(plan => plan.title === user.plan) || plans.find(plan => plan.title === 'Free');
    
    if (!userPlan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 500 }
      );
    }

    const { interactionType = 'chat' } = await request.json();

    // Check if user can interact
    const canInteract = await canUserInteract(userId, userPlan.id);

    if (!canInteract.canInteract) {
      return NextResponse.json({
        canInteract: false,
        remainingInteractions: canInteract.remainingInteractions,
        limit: canInteract.limit,
        message: "You have reached your monthly interaction limit. Please upgrade your plan for unlimited access."
      }, { status: 429 });
    }

    // Record the interaction
    await recordUserInteraction(userId, userPlan.id, interactionType);

    // Get updated stats
    const stats = await getUserInteractionStats(userId, userPlan.id);

    return NextResponse.json({
      canInteract: true,
      remainingInteractions: stats.remaining,
      limit: stats.limit,
      currentMonth: stats.currentMonth,
      hasUnlimited: stats.limit === null
    });

  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
