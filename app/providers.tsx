"use client";

import { SessionProvider } from "next-auth/react";

import { Pwa } from "@/components/pwa";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Pwa />
    </SessionProvider>
  );
}
