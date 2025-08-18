import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUsers, updateUser } from "@/lib/server/users";

export async function PUT(request: NextRequest) {
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