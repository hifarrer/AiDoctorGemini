import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsers, updateUser, deleteUser } from "@/lib/server/users";

export async function GET(request: NextRequest) {
  console.log("🔍 [ADMIN_USERS_GET] Starting users fetch...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_USERS_GET] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });
    
    if (!session?.user?.email) {
      console.log("❌ [ADMIN_USERS_GET] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_USERS_GET] User is not admin:", session.user.email);
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ [ADMIN_USERS_GET] Admin access verified, fetching users...");
    const users = await getUsers();
    console.log("📋 [ADMIN_USERS_GET] Found users:", users.length);
    
    // Transform users for frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: null, // Not implemented yet
    }));

    console.log("✅ [ADMIN_USERS_GET] Returning users:", transformedUsers.length);
    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("❌ [ADMIN_USERS_GET] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [ADMIN_USERS_DELETE] Starting user deletion...");
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 [ADMIN_USERS_DELETE] Session:", { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      isAdmin: (session as any)?.user?.isAdmin 
    });
    
    if (!session?.user?.email) {
      console.log("❌ [ADMIN_USERS_DELETE] No session or email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      console.log("❌ [ADMIN_USERS_DELETE] User is not admin:", session.user.email);
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      console.log("❌ [ADMIN_USERS_DELETE] No userId provided");
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("✅ [ADMIN_USERS_DELETE] Admin access verified, deleting user:", userId);
    
    // Find the user by ID first to get their email
    const allUsers = await getUsers();
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) {
      console.log("❌ [ADMIN_USERS_DELETE] User not found:", userId);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete the user using their email
    const deleted = await deleteUser(user.email);
    console.log("✅ [ADMIN_USERS_DELETE] User deleted successfully:", user.email);
    
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [ADMIN_USERS_DELETE] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(session as any).user?.isAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, email, firstName, plan, isActive } = body;

    // Find the user in our database
    const allUsers = await getUsers();
    const user = allUsers.find(u => u.id === id);
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the new email is already taken by another user
    if (email !== user.email) {
      const emailExists = allUsers.some(u => u.email === email && u.id !== id);
      if (emailExists) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await updateUser(user.email, {
      email,
      firstName,
      plan,
      isActive,
    } as any);

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          plan: updatedUser.plan,
          isActive: updatedUser.isActive,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}