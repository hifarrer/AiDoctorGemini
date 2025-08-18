import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { updateUser, findUserByEmail } from "@/lib/server/users";

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
    const { email, firstName } = body;

    // Find the user in our database
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the new email is already taken by another user
    if (email !== session.user.email) {
      const { getUsers } = await import("@/lib/server/users");
      const allUsers = await getUsers();
      const emailExists = (allUsers || []).some((u: any) => u.email === email && u.id !== user.id);
      if (emailExists) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await updateUser(session.user.email, {
      email,
      firstName,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
