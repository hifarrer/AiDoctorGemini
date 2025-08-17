import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/server/users";

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

        const user = findUserByEmail(credentials.email);

        if (user && user.password === credentials.password) {
          // Check if user is active
          if (user.isActive === false) {
            throw new Error("Account is deactivated. Please contact support.");
          }
          
          return { 
            id: user.id, 
            email: user.email,
            firstName: user.firstName,
          };
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST }; 