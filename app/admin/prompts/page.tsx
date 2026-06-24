import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const prompts = await prisma.promptTemplate.findMany({
    orderBy: [{ kind: "asc" }, { version: "desc" }],
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Prompts</h1>
          <p>Versiones del prompt maestro para la generación de planeaciones.</p>
        </div>
        <button className="button primary" type="button">
          Nueva versión
        </button>
      </div>
      <section className="panel">
        {prompts.length === 0 ? (
          <div className="empty">Aún no hay prompts guardados. Se usará el fallback del código.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Activo</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td>{prompt.name}</td>
                  <td>{prompt.version}</td>
                  <td>{prompt.isActive ? "Sí" : "No"}</td>
                  <td>{prompt.notes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
