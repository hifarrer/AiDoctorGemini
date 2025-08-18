import { NextResponse } from "next/server";
import { getSettings } from "@/lib/server/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    
    if (!settings.stripePublishableKey) {
      return NextResponse.json(
        { message: "Stripe not configured" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { publishableKey: settings.stripePublishableKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting Stripe config:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
