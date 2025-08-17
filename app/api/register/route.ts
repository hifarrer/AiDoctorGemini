import { NextRequest, NextResponse } from "next/server";
import { addUser, findUserByEmail } from "@/lib/server/users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new NextResponse("Email and password are required", {
        status: 400,
      });
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // In a real app, you should hash the password here
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      firstName: "",
      plan: "Free",
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
    
    addUser(newUser);

    return NextResponse.json({
      message: "User created successfully",
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 