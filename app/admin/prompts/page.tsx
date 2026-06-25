import { PromptsManager } from "@/components/admin/prompts-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const prompts = await prisma.promptTemplate.findMany({
    orderBy: [{ kind: "asc" }, { version: "desc" }],
  });

  const data = prompts.map((prompt) => ({
    id: prompt.id,
    name: prompt.name,
    version: prompt.version,
    isActive: prompt.isActive,
    notes: prompt.notes,
    createdAt: prompt.createdAt.toISOString(),
  }));

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Prompts</h1>
        <p>Versiones del prompt maestro para la generación de planeaciones. Solo una puede estar activa.</p>
      </div>
      <PromptsManager prompts={data} />
    </>
  );
}
