export default function AdminSettingsPage() {
  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Ajustes</h1>
          <p>Configuración operativa para límites, precios y proveedores.</p>
        </div>
      </div>
      <div className="grid two">
        <section className="panel">
          <h2>Alianza Indigo</h2>
          <p>Endpoint, modelo y llave se configuran por variables de entorno en Vercel.</p>
        </section>
        <section className="panel">
          <h2>Drafts</h2>
          <p>La expiración se controla con `DRAFT_TTL_HOURS` y el cron de limpieza de Vercel.</p>
        </section>
      </div>
    </>
  );
}
