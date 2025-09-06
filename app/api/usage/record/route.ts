import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordInteraction } from "@/lib/server/usage";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);

    if (!(session as any)?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompts = 1 } = body;

    // Record the interaction (no conversation content stored)
    // Use email as the unique identifier since NextAuth's default session.user has no id by default
    await recordInteraction(
      (session as any).user.email,
      (session as any).user.email,
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
