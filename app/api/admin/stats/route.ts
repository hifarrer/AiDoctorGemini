import { NextRequest, NextResponse } from "next/server";
import { getUsageStats } from "@/lib/admin";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin-secret-key"
);

async function verifyAdminToken(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const stats = getUsageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}