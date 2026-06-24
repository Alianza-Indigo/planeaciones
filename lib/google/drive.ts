import { prisma } from "@/lib/db";

export async function exportDraftToGoogleDrive(params: {
  userId: string;
  draftId: string;
}) {
  const draft = await prisma.planningDraft.findFirstOrThrow({
    where: {
      id: params.draftId,
      userId: params.userId,
    },
  });

  const googleAccount = await prisma.account.findFirst({
    where: {
      userId: params.userId,
      provider: "google",
    },
  });

  if (!googleAccount?.access_token) {
    throw new Error("No hay token de Google Drive disponible para este usuario.");
  }

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      authorization: `Bearer ${googleAccount.access_token}`,
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
    throw new Error(`Google Drive respondio ${response.status}: ${await response.text()}`);
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
