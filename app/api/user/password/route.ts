import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { updateUser, findUserByEmail } from "@/lib/server/users";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Find the user in our database
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const stored = user.password || "";
    const isHash = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    const currentOk = isHash ? await bcrypt.compare(currentPassword, stored) : stored === currentPassword;
    if (!currentOk) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update password
    const newHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await updateUser(session.user.email, { password: newHash } as any);
    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
