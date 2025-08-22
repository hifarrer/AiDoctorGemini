import { NextResponse } from "next/server";
import { getSettings } from "@/lib/server/settings";

export async function GET() {
  try {
    console.log('Fetching Stripe configuration...');
    const settings = await getSettings();
    
    console.log('Stripe config check:', {
      hasPublishableKey: !!settings.stripePublishableKey,
      publishableKeyLength: settings.stripePublishableKey?.length,
      hasSecretKey: !!settings.stripeSecretKey,
      secretKeyLength: settings.stripeSecretKey?.length
    });
    
    if (!settings.stripePublishableKey) {
      console.error('Stripe publishable key not configured');
      return NextResponse.json(
        { message: "Stripe not configured - missing publishable key" },
        { status: 400 }
      );
    }

    if (settings.stripePublishableKey === 'pk_test_your_publishable_key_here' || 
        settings.stripePublishableKey === 'pk_live_your_publishable_key_here') {
      console.error('Stripe publishable key is still placeholder value');
      return NextResponse.json(
        { message: "Stripe not configured - using placeholder key" },
        { status: 400 }
      );
    }

    console.log('Stripe configuration loaded successfully');
    return NextResponse.json(
      { publishableKey: settings.stripePublishableKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting Stripe config:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
