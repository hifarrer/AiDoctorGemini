import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, updateUser } from "@/lib/server/users";
import bcrypt from "bcryptjs";

const handler = NextAuth({
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
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = (user as any).isAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).isAdmin = (token as any).isAdmin || false;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST }; 