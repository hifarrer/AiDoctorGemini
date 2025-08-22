import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSettings, updateSettings } from "@/lib/server/settings";

export async function GET() {
  try {
    const session = await getServerSession();

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

    const settings = await getSettings();

    // Return settings without exposing the actual secrets
    const safeSettings = {
      stripeApiKey: settings.stripeSecretKey ? "••••••••••••••••" : "",
      stripePublishableKey: settings.stripePublishableKey,
      stripeWebhookSecret: settings.stripeWebhookSecret ? "••••••••••••••••" : "",
      siteName: settings.siteName,
      siteDescription: (settings as any).siteDescription || "Your Personal AI Health Assistant",
      contactEmail: settings.contactEmail || "",
      supportEmail: settings.supportEmail || "",
    };

    return NextResponse.json(safeSettings, { status: 200 });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

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
    const {
      stripeApiKey,
      stripePublishableKey,
      stripeWebhookSecret,
      siteName,
      siteDescription,
      contactEmail,
      supportEmail,
      logoUrl,
    } = body;

    console.log('Received settings update:', {
      hasStripeApiKey: !!stripeApiKey,
      stripeApiKeyLength: stripeApiKey?.length,
      hasStripePublishableKey: !!stripePublishableKey,
      hasStripeWebhookSecret: !!stripeWebhookSecret,
      siteName,
      contactEmail,
      supportEmail
    });

    const MASK = "••••••••••••••••";
    const cleanedApiKey = typeof stripeApiKey === 'string' && stripeApiKey.trim() === MASK ? undefined : stripeApiKey;
    const cleanedWebhook = typeof stripeWebhookSecret === 'string' && stripeWebhookSecret.trim() === MASK ? undefined : stripeWebhookSecret;

    // Get current settings
    const currentSettings = await getSettings();
    
    console.log('Current settings:', {
      hasStripeSecretKey: !!currentSettings.stripeSecretKey,
      stripeSecretKeyLength: currentSettings.stripeSecretKey?.length,
      hasStripePublishableKey: !!currentSettings.stripePublishableKey,
      hasStripeWebhookSecret: !!currentSettings.stripeWebhookSecret
    });
    
    // Update settings using the server module
    const updateData = {
      stripeSecretKey: cleanedApiKey !== undefined && cleanedApiKey !== "" ? cleanedApiKey : currentSettings.stripeSecretKey,
      stripePublishableKey: stripePublishableKey !== undefined && stripePublishableKey !== "" ? stripePublishableKey : currentSettings.stripePublishableKey,
      stripeWebhookSecret: cleanedWebhook !== undefined && cleanedWebhook !== "" ? cleanedWebhook : currentSettings.stripeWebhookSecret,
      siteName: siteName !== undefined && siteName !== "" ? siteName : currentSettings.siteName,
      siteDescription: siteDescription !== undefined ? siteDescription : (currentSettings as any).siteDescription,
      contactEmail: contactEmail !== undefined ? contactEmail : currentSettings.contactEmail,
      supportEmail: supportEmail !== undefined ? supportEmail : currentSettings.supportEmail,
      logoUrl: logoUrl !== undefined ? logoUrl : (currentSettings as any).logoUrl,
    };

    console.log('Updating settings with:', {
      hasStripeSecretKey: !!updateData.stripeSecretKey,
      stripeSecretKeyLength: updateData.stripeSecretKey?.length,
      hasStripePublishableKey: !!updateData.stripePublishableKey,
      hasStripeWebhookSecret: !!updateData.stripeWebhookSecret
    });

    const updatedSettings = await updateSettings(updateData);

    // Note: Public settings are served from /api/settings GET; no direct export call here

    return NextResponse.json(
      {
        message: "Settings updated successfully",
        settings: {
          stripeApiKey: updatedSettings.stripeSecretKey ? "••••••••••••••••" : "",
          stripePublishableKey: updatedSettings.stripePublishableKey,
          stripeWebhookSecret: updatedSettings.stripeWebhookSecret ? "••••••••••••••••" : "",
          siteName: updatedSettings.siteName,
          siteDescription: (updatedSettings as any).siteDescription || "Your Personal AI Health Assistant",
          contactEmail: updatedSettings.contactEmail || "",
          supportEmail: updatedSettings.supportEmail || "",
          logoUrl: (updatedSettings as any).logoUrl || "",
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}