import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { exportDraftToGoogleDrive } from "@/lib/google/drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { draftId?: string };
  if (!body.draftId) {
    return NextResponse.json({ error: "draftId requerido" }, { status: 400 });
  }

  const draft = await exportDraftToGoogleDrive({
    userId: session.user.id,
    draftId: body.draftId,
  });

  return NextResponse.json({
    docId: draft.exportedDocId,
    url: draft.exportedDocUrl,
  });
}
