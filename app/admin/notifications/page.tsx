import { PushBroadcast } from "@/components/admin/push-broadcast";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const suscritos = await prisma.pushSubscription.count();
  const configurado = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Notificaciones</h1>
        <p>
          Envía un anuncio push a todos los dispositivos suscritos. {suscritos} dispositivo(s) suscrito(s)
          actualmente.
        </p>
      </div>

      {configurado ? (
        <PushBroadcast />
      ) : (
        <section className="panel">
          <p>
            Las notificaciones aún no están configuradas. Define <code>VAPID_PUBLIC_KEY</code> y{" "}
            <code>VAPID_PRIVATE_KEY</code> en las variables de entorno para activarlas.
          </p>
        </section>
      )}
    </>
  );
}
