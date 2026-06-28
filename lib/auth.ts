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
        const esAdminPorCorreo = getAdminEmails().includes(user.email.toLowerCase());
        await prisma.user.updateMany({
          where: { email: user.email },
          data: {
            googleSubject: account.providerAccountId,
            // Solo se ELEVA a ADMIN por ADMIN_EMAILS. Nunca se degrada el rol
            // aquí: así un admin asignado desde la consola sobrevive al login.
            ...(esAdminPorCorreo ? { role: "ADMIN" } : {}),
          },
        });
      }

      return true;
    },
    async session({ session, user }) {
      const dbUser = user as typeof user & { role: "USER" | "ADMIN" };
      if (session.user) {
        session.user.id = user.id;
        // ADMIN_EMAILS es la fuente de verdad: si el correo está en la lista
        // se otorga ADMIN en vivo, sin depender de cuándo se inició sesión.
        const esAdminPorCorreo = session.user.email
          ? getAdminEmails().includes(session.user.email.toLowerCase())
          : false;
        session.user.role = esAdminPorCorreo ? "ADMIN" : dbUser.role;
      }

      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}
