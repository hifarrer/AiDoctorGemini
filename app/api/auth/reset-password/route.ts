import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getResetToken, removeResetToken } from '@/lib/reset-tokens';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Find user by reset token (using in-memory storage)
    const resetTokenData = getResetToken(token);
    
    if (!resetTokenData) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    // Find the user by email
    const user = await findUserByEmail(resetTokenData.email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const updatedUser = await updateUser(user.email, { 
      password: hashedPassword
    });
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
    }

    // Remove the reset token from memory
    removeResetToken(token);

    return NextResponse.json({ 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}