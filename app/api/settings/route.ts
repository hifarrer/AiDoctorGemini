import { NextResponse } from "next/server";
import { getSettings } from "@/lib/server/settings";

// Note: Do not export non-route functions from this file to satisfy Next.js route typing

export async function GET() {
  try {
    const settings = await getSettings();
    
    // Return only public settings (no sensitive data)
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription || "Your Personal AI Health Assistant",
      contactEmail: settings.contactEmail || "",
      supportEmail: settings.supportEmail || "",
      logoUrl: (settings as any).logoUrl || "",
    };

    return NextResponse.json(publicSettings, { status: 200 });
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
