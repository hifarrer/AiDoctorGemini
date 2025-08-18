export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from "next/server";
import { getPlans } from "@/lib/server/plans";

export async function GET() {
  try {
    // Return only active plans
    const activePlans = (await getPlans()).filter(plan => plan.isActive);
    
    return NextResponse.json(activePlans, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
