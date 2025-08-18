import { NextRequest, NextResponse } from "next/server";
import { addUser, findUserByEmail } from "@/lib/server/users";
import bcrypt from "bcryptjs";

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
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // In a real app, you should hash the password here
    const hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password: hash,
      firstName: "",
      plan: "Free",
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
    
    await addUser(newUser as any);

    return NextResponse.json({
      message: "User created successfully",
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 