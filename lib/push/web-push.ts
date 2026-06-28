import webpush from "web-push";

import { prisma } from "@/lib/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

let configured = false;

// Configura web-push con las llaves VAPID (perezoso: solo al primer envío).
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contacto@alianzaindigo.org";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

// ¿Hay llaves VAPID configuradas? Permite degradar con elegancia si no.
export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function enviar(subs: StoredSubscription[], payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const data = JSON.stringify(payload);
  const caducadas: string[] = [];
  let enviadas = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
        enviadas += 1;
      } catch (error) {
        const code = (error as { statusCode?: number }).statusCode;
        // 404/410 = suscripción muerta (desinstalada o expirada): se limpia.
        if (code === 404 || code === 410) caducadas.push(s.endpoint);
      }
    }),
  );

  if (caducadas.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: caducadas } } });
  }
  return enviadas;
}

// Envía a todos los dispositivos suscritos de un usuario.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  return enviar(subs, payload);
}

// Difunde a todos los dispositivos suscritos (anuncios del admin).
export async function sendPushToAll(payload: PushPayload): Promise<number> {
  const subs = await prisma.pushSubscription.findMany();
  return enviar(subs, payload);
}
