import { NextResponse } from "next/server";

import { deleteExpiredDrafts } from "@/lib/drafts/expire-drafts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await deleteExpiredDrafts();
  return NextResponse.json({ deleted: result.count });
}
