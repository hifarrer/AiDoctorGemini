import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUsers } from "@/lib/server/users";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.email !== "admin@ai-doctor.info") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const users = await getUsers();
    
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

    return NextResponse.json(safeUsers, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
