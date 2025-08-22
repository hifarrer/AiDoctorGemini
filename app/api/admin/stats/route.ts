import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsageStats } from "@/lib/admin";

export async function GET(req: NextRequest) {
  console.log("📊 [ADMIN_STATS_GET] Starting stats fetch...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_STATS_GET] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });

    if (!session?.user?.email) {
      console.log("❌ [ADMIN_STATS_GET] No session or email");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_STATS_GET] User is not admin:", session.user.email);
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ [ADMIN_STATS_GET] Admin access verified, fetching stats...");
    const stats = await getUsageStats();
    console.log("📊 [ADMIN_STATS_GET] Stats:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ [ADMIN_STATS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}