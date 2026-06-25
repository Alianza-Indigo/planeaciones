import { prisma } from "@/lib/db";

type GoogleAccount = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
};

// Devuelve un access_token válido, refrescándolo con el refresh_token si expiró.
async function getFreshAccessToken(account: GoogleAccount): Promise<string> {
  const expiraPronto = !account.expires_at || account.expires_at * 1000 < Date.now() + 60_000;

  if (!expiraPronto && account.access_token) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    if (account.access_token) return account.access_token;
    throw new Error(
      "Tu sesión de Google expiró y no hay permiso para renovarla. Cierra sesión y vuelve a entrar autorizando Google Drive.",
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("No se pudo renovar el acceso a Google. Cierra sesión y vuelve a entrar.");
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("Google no devolvió un token válido al renovar el acceso.");
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    },
  });

  return data.access_token;
}

export async function exportDraftToGoogleDrive(params: { userId: string; draftId: string }) {
  const draft = await prisma.planningDraft.findFirstOrThrow({
    where: { id: params.draftId, userId: params.userId },
  });

  const googleAccount = await prisma.account.findFirst({
    where: { userId: params.userId, provider: "google" },
  });

  if (!googleAccount) {
    throw new Error("No encontramos tu cuenta de Google. Cierra sesión y vuelve a entrar.");
  }

  if (!googleAccount.scope || !googleAccount.scope.includes("drive.file")) {
    throw new Error(
      "No autorizaste el permiso de Google Drive. Cierra sesión y vuelve a entrar aceptando el acceso a Drive.",
    );
  }

  const accessToken = await getFreshAccessToken(googleAccount);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "multipart/related; boundary=planeaciones_boundary",
    },
    body: [
      "--planeaciones_boundary",
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify({
        name: `${draft.title}.md`,
        mimeType: "text/markdown",
      }),
      "--planeaciones_boundary",
      "Content-Type: text/markdown; charset=UTF-8",
      "",
      draft.content,
      "--planeaciones_boundary--",
    ].join("\r\n"),
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(`Google Drive respondió ${response.status}: ${detalle.slice(0, 300)}`);
  }

  const file = (await response.json()) as { id: string };
  const exportedDocUrl = `https://drive.google.com/file/d/${file.id}/view`;

  return prisma.planningDraft.update({
    where: { id: draft.id },
    data: {
      exportedDocId: file.id,
      exportedDocUrl,
    },
  });
}
