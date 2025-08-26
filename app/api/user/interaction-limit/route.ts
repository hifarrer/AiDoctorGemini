import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canUserInteract, recordUserInteraction, getUserInteractionStats } from "@/lib/server/user-interactions";

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
    const planId = (session as any).user?.planId || '1'; // Default to free plan

    const stats = await getUserInteractionStats(userId, planId);

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
    const planId = (session as any).user?.planId || '1'; // Default to free plan
    const { interactionType = 'chat' } = await request.json();

    // Check if user can interact
    const canInteract = await canUserInteract(userId, planId);

    if (!canInteract.canInteract) {
      return NextResponse.json({
        canInteract: false,
        remainingInteractions: canInteract.remainingInteractions,
        limit: canInteract.limit,
        message: "You have reached your monthly interaction limit. Please upgrade your plan for unlimited access."
      }, { status: 429 });
    }

    // Record the interaction
    await recordUserInteraction(userId, planId, interactionType);

    // Get updated stats
    const stats = await getUserInteractionStats(userId, planId);

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
