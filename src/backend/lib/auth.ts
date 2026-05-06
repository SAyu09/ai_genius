import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/backend/db";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
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

      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
