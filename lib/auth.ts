import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, updateUser } from "./server/users";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const user = await findUserByEmail(credentials.email);

        if (user) {
          const stored = user.password || "";
          const isHash = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");

          let valid = false;
          if (isHash) {
            valid = await bcrypt.compare(credentials.password, stored);
          } else {
            // Fallback for legacy plaintext; if it matches, upgrade to hash
            valid = stored === credentials.password;
            if (valid) {
              try {
                const newHash = await bcrypt.hash(credentials.password, 10);
                await updateUser(user.email, { password: newHash } as any);
              } catch {}
            }
          }

          if (!valid) {
            return null;
          }

          // Check if user is active
          if (user.isActive === false) {
            throw new Error("Account is deactivated. Please contact support.");
          }
          
          return { 
            id: user.id, 
            email: user.email,
            firstName: user.firstName,
            isAdmin: !!user.isAdmin,
          } as any;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin || false;
      }
      // Ensure isAdmin and id are populated even on subsequent requests
      if (typeof (token as any).isAdmin === 'undefined' && token?.email) {
        try {
          const dbUser = await findUserByEmail(token.email as string);
          (token as any).isAdmin = !!dbUser?.isAdmin;
          if (!token.id && dbUser?.id) {
            token.id = dbUser.id;
          }
        } catch {
          // ignore
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      (session.user as any).id = token.id;
      (session.user as any).isAdmin = (token as any).isAdmin || false;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
