import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/server/settings";

export async function GET() {
  console.log("⚙️ [ADMIN_CONFIG_GET] Starting config fetch...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_CONFIG_GET] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });

    if (!session?.user?.email) {
      console.log("❌ [ADMIN_CONFIG_GET] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_CONFIG_GET] User is not admin:", session.user.email);
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ [ADMIN_CONFIG_GET] Admin access verified, fetching config...");
    const settings = await getSettings();
    console.log("📋 [ADMIN_CONFIG_GET] Raw settings:", settings);

    // Return config in the format expected by the admin dashboard
    const adminConfig = {
      username: "admin",
      email: session.user.email,
      siteSettings: {
        siteName: settings.siteName,
        contactEmail: settings.contactEmail,
        supportEmail: settings.supportEmail,
        maxUsersPerDay: 1000, // Default value
        maintenanceMode: false, // Default value
      }
    };

    console.log("✅ [ADMIN_CONFIG_GET] Returning admin config:", adminConfig);
    return NextResponse.json(adminConfig, { status: 200 });
  } catch (error) {
    console.error("❌ [ADMIN_CONFIG_GET] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
