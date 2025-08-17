import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recordInteraction } from "@/lib/server/usage";

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
    const { prompts = 1 } = body;

    // Record the interaction (no conversation content stored)
    recordInteraction(
      session.user.id || 'unknown',
      session.user.email,
      prompts
    );

    return NextResponse.json(
      { message: "Usage recorded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error recording usage:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
