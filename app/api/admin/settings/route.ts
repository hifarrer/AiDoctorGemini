import { NextRequest, NextResponse } from "next/server";
import { adminConfig, updateAdminPassword, updateSiteSettings } from "@/lib/admin";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin-secret-key"
);

async function verifyAdminToken(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Return settings without sensitive info
    const { password, ...safeConfig } = adminConfig;
    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error("[ADMIN_GET_SETTINGS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, ...data } = body;

    if (type === "password") {
      const { currentPassword, newPassword } = data;
      
      if (currentPassword !== adminConfig.password) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const success = updateAdminPassword(newPassword);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to update password" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Password updated successfully" });
    } else if (type === "site") {
      const success = updateSiteSettings(data);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to update site settings" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Site settings updated successfully" });
    } else {
      return NextResponse.json(
        { error: "Invalid update type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[ADMIN_UPDATE_SETTINGS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}