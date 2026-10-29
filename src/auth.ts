import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { isAllowedEmail, roleForEmail } from "@/lib/allowlist";
import { env, isDevLoginEnabled, isGoogleEnabled } from "@/lib/env";

const providers = [
  ...(isGoogleEnabled
    ? [
        Google({
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...(isDevLoginEnabled
    ? [
        Credentials({
          id: "dev-email",
          name: "Local development sign-in",
          credentials: {
            email: { label: "Admin email", type: "email" },
          },
          async authorize(credentials) {
            const email = String(credentials?.email ?? "")
              .trim()
              .toLowerCase();

            if (!email || !isAllowedEmail(email)) {
              return null;
            }

            let user = await db.query.users.findFirst({
              where: eq(users.email, email),
            });

            if (!user) {
              const [created] = await db
                .insert(users)
                .values({
                  email,
                  name: email.split("@")[0],
                  role: roleForEmail(email),
                })
                .returning();
              user = created;
            }

            if (!user.isActive) {
              return null;
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            };
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  secret: env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!isAllowedEmail(user.email)) {
          return false;
        }

        if (user.email) {
          const existing = await db.query.users.findFirst({
            where: eq(users.email, user.email),
          });
          if (existing && !existing.isActive) {
            return false;
          }
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.email) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, user.email),
          });

          if (dbUser) {
            token.uid = dbUser.id;
            token.role = dbUser.role;
          }
        }

        if (!token.uid && user.id) {
          token.uid = user.id;
          token.role = user.role ?? "ADMIN";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string | undefined) ?? "";
        session.user.role =
          (token.role as "SUPER_ADMIN" | "ADMIN" | "PUBLIC_USER" | undefined) ??
          "ADMIN";
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await db
          .update(users)
          .set({
            role: roleForEmail(user.email),
            updatedAt: new Date(),
          })
          .where(eq(users.email, user.email));
      }
    },
  },
});
