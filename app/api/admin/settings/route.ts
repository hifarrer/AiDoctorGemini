import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/server/settings";

export async function GET() {
  console.log("⚙️ [ADMIN_SETTINGS_GET] Starting settings fetch...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_SETTINGS_GET] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });

    if (!session?.user?.email) {
      console.log("❌ [ADMIN_SETTINGS_GET] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_SETTINGS_GET] User is not admin:", session.user.email);
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ [ADMIN_SETTINGS_GET] Admin access verified, fetching settings...");
    const settings = await getSettings();
    console.log("📋 [ADMIN_SETTINGS_GET] Raw settings:", settings);

    // Return settings in the format expected by the admin settings page
    const adminSettings = {
      stripeApiKey: settings.stripeSecretKey ? "••••••••••••••••" : "",
      stripePublishableKey: settings.stripePublishableKey || "",
      stripeWebhookSecret: settings.stripeWebhookSecret ? "••••••••••••••••" : "",
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      contactEmail: settings.contactEmail,
      supportEmail: settings.supportEmail,
      logoUrl: settings.logoUrl,
    };

    console.log("✅ [ADMIN_SETTINGS_GET] Returning admin settings:", adminSettings);
    return NextResponse.json(adminSettings, { status: 200 });
  } catch (error) {
    console.error("❌ [ADMIN_SETTINGS_GET] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log("⚙️ [ADMIN_SETTINGS_PUT] Starting settings update...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_SETTINGS_PUT] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });

    if (!session?.user?.email) {
      console.log("❌ [ADMIN_SETTINGS_PUT] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_SETTINGS_PUT] User is not admin:", session.user.email);
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