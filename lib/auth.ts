import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/db";
import { getAdminEmails } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.file",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && account.providerAccountId && user.email) {
        await prisma.user.updateMany({
          where: { email: user.email },
          data: {
            googleSubject: account.providerAccountId,
            role: getAdminEmails().includes(user.email.toLowerCase()) ? "ADMIN" : "USER",
          },
        });
      }

      return true;
    },
    async session({ session, user }) {
      const dbUser = user as typeof user & { role: "USER" | "ADMIN" };
      if (session.user) {
        session.user.id = user.id;
        session.user.role = dbUser.role;
      }

      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}
