import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(session as any).user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key is required" },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('sk_test_') && !apiKey.startsWith('sk_live_')) {
      return NextResponse.json(
        { message: "Invalid Stripe API key format" },
        { status: 400 }
      );
    }

    // Test the connection with Stripe
    try {
      // Let Stripe SDK use its default API version to avoid type mismatches during builds
      const stripe = new (await import('stripe')).default(apiKey);
      
      // Test the connection by making a simple API call
      await stripe.paymentMethods.list({ limit: 1 });
      
      return NextResponse.json(
        { 
          message: "Stripe connection successful",
          details: "API key is valid and connection test passed"
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Stripe connection test failed:', error);
      return NextResponse.json(
        { 
          message: "Stripe connection failed",
          details: error instanceof Error ? error.message : "Invalid API key"
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Stripe connection test error:", error);
    return NextResponse.json(
      { message: "Failed to test Stripe connection" },
      { status: 500 }
    );
  }
}
