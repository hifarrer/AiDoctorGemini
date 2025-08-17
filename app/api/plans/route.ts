import { NextResponse } from "next/server";
import { getPlans } from "@/lib/server/plans";

export async function GET() {
  try {
    // Return only active plans
    const activePlans = getPlans().filter(plan => plan.isActive);
    
    return NextResponse.json(activePlans, { status: 200 });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
