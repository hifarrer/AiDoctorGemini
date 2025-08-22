import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsers } from "@/lib/server/users";

export async function GET() {
  console.log("👥 [ADMIN_USERS_LIST_GET] Starting users list fetch...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_USERS_LIST_GET] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });
    
    if (!session?.user?.email) {
      console.log("❌ [ADMIN_USERS_LIST_GET] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_USERS_LIST_GET] User is not admin:", session.user.email);
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ [ADMIN_USERS_LIST_GET] Admin access verified, fetching users...");
    const users = await getUsers();
    console.log("📋 [ADMIN_USERS_LIST_GET] Found users:", users.length);
    
    // Return users without sensitive data like passwords
    const safeUsers = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      plan: user.plan,
      isActive: user.isActive,
      createdAt: user.createdAt,
      subscriptionStatus: user.subscriptionStatus,
    }));

    console.log("✅ [ADMIN_USERS_LIST_GET] Returning safe users:", safeUsers.length);
    return NextResponse.json(safeUsers, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
