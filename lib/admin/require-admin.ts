import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
