import NextAuth from "next-auth";
import { CredentialsSignin } from "@auth/core/errors";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types/auth.types";
import {
  isValidCallbackUrl,
  getRoleBasedRedirect,
} from "@/features/auth/services/authService";

import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/backend/db/schema";

class CustomAuthError extends CredentialsSignin {
  constructor(message: string) {
    super();
    this.message = message;
    this.code = message;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    {
      id: "google",
      name: "Google",
      type: "oauth",
      issuer: "https://accounts.google.com",
      checks: ["pkce", "state"],
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: { scope: "openid profile email", access_type: "offline", prompt: "consent" },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "buyer",
        };
      },
    },
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError("Email and password are required");
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          throw new CustomAuthError("No account found with this email. Please create an account first.");
        }

        // Check if user has a password (could be Google-only user)
        if (!user.passwordHash) {
          throw new CustomAuthError("This account uses Google sign-in. Please use 'Continue with Google' instead.");
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new CustomAuthError("Invalid password. Please try again.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || user.avatarUrl,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user.role as UserRole) || "buyer";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // Honour callbackUrl if same-origin
      const validCallback = isValidCallbackUrl(url, baseUrl);
      if (validCallback) return `${baseUrl}${validCallback}`;

      // Default to base URL for relative paths
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;

      // Default: marketplace for buyers (most common)
      return `${baseUrl}/marketplace`;
    },
  },
  pages: {
    signIn: "/auth",
  },
});
