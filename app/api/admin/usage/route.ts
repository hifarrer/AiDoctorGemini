import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsageStats, getUsageRecords } from "@/lib/server/usage";

export async function GET(request: NextRequest) {
  console.log("📊 [ADMIN_USAGE_GET] Starting usage fetch...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_USAGE_GET] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });

    if (!session?.user?.email) {
      console.log("❌ [ADMIN_USAGE_GET] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_USAGE_GET] User is not admin:", session.user.email);
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const stats = await getUsageStats(startDate, endDate);
    const allRecords = await getUsageRecords();

    return NextResponse.json({
      stats,
      records: allRecords,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
