import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUsageStats, getUsageRecords } from "@/lib/server/usage";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.email !== "admin@healthconsultant.ai") {
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
