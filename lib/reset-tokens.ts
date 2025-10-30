// Temporary in-memory storage for password reset tokens
// This should be replaced with database storage after running the migration
interface ResetToken {
  token: string;
  email: string;
  expiry: Date;
}

const resetTokens: Map<string, ResetToken> = new Map();

export function storeResetToken(email: string, token: string, expiryMinutes: number = 60): void {
  const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
  resetTokens.set(token, {
    token,
    email,
    expiry
  });
  
  // Clean up expired tokens periodically
  cleanupExpiredTokens();
}

export function getResetToken(token: string): ResetToken | null {
  const resetToken = resetTokens.get(token);
  
  if (!resetToken) {
    return null;
  }
  
  // Check if token has expired
  if (new Date() > resetToken.expiry) {
    resetTokens.delete(token);
    return null;
  }
  
  return resetToken;
}

export function removeResetToken(token: string): void {
  resetTokens.delete(token);
}

function cleanupExpiredTokens(): void {
  const now = new Date();
  resetTokens.forEach((resetToken, token) => {
    if (now > resetToken.expiry) {
      resetTokens.delete(token);
    }
  });
}

// Clean up expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
