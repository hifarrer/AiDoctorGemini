import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPlans, updatePlan, syncPlanWithStripeById } from "@/lib/server/plans";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, title, description, features, monthlyPrice, yearlyPrice, isActive, isPopular, stripePriceIds } = body;

    // Update plan using the server function
    console.log('Admin updating plan:', { id, title, hasStripePriceIds: !!stripePriceIds, stripePriceIds });
    const updatedPlan = await updatePlan(id, {
      title,
      description,
      features,
      monthlyPrice,
      yearlyPrice,
      isActive,
      isPopular,
      stripePriceIds,
    });

    if (!updatedPlan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }

    // If admin supplied explicit price IDs, preserve them and skip auto-sync overwrite
    const adminProvidedBothIds = !!(stripePriceIds && stripePriceIds.monthly && stripePriceIds.yearly);
    if (adminProvidedBothIds) {
      console.log('Admin provided explicit Stripe price IDs; skipping auto sync.');
    } else {
      // Sync with Stripe (creates/updates product and prices; stores IDs)
      try {
        await syncPlanWithStripeById(updatedPlan.id);
      } catch (e) {
        console.error('Stripe sync failed for plan', updatedPlan.id, e);
        // We do not fail the request; admin can retry
      }
    }

    return NextResponse.json(
      { 
        message: "Plan updated successfully",
        plan: updatedPlan
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Plan update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
