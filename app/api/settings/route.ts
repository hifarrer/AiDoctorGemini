import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/server/settings";

// Function to update settings (called from admin settings)
export function updatePublicSettings(newSettings: any) {
  updateSettings(newSettings);
}

export async function GET() {
  try {
    const settings = getSettings();
    
    // Return only public settings (no sensitive data)
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: "Your Personal AI Health Assistant",
      contactEmail: "",
      supportEmail: "",
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
