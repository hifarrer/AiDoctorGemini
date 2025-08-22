import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUser, findUserById } from "@/lib/server/users";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Find the user in our database
    const user = await findUserById(id);
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    const success = await deleteUser(user.email);
    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
