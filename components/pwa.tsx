"use client";

import { Bell, Download, Share, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "adia-pwa-dismissed";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function Pwa() {
  const { status } = useSession();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const [working, setWorking] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Registro del service worker.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin SW no hay PWA ni push; se ignora silenciosamente.
    });
  }, []);

  // Detección de entorno (iOS, standalone, permiso de notificaciones).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setStandalone(isStandalone);
    if ("Notification" in window && "PushManager" in window) {
      setNotifPerm(Notification.permission);
    }
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", () => setInstallEvent(null));
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }, [installEvent]);

  const enableNotifications = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifPerm(permission);
      if (permission !== "granted") {
        showToast("Permiso de notificaciones denegado.");
        return;
      }

      const keyRes = await fetch("/api/push/public-key");
      if (!keyRes.ok) {
        showToast("Las notificaciones aún no están configuradas.");
        return;
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      // Envío de prueba inmediato para confirmar el flujo completo.
      await fetch("/api/push/test", { method: "POST" });
      showToast("¡Notificaciones activadas! Te enviamos una de prueba.");
    } catch {
      showToast("No se pudieron activar las notificaciones.");
    } finally {
      setWorking(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  // Qué acciones aplican.
  const loggedIn = status === "authenticated";
  const canInstallAndroid = Boolean(installEvent) && !standalone;
  const showIOSInstall = isIOS && !standalone;
  // En iOS el push solo funciona con la app instalada (iOS 16.4+).
  const pushSupported = notifPerm !== "unsupported" && (!isIOS || standalone);
  const showNotifAction = loggedIn && pushSupported && notifPerm !== "granted";

  const hasContent = canInstallAndroid || showIOSInstall || showNotifAction;
  if (dismissed || !hasContent) {
    return toast ? <div className="pwa-toast">{toast}</div> : null;
  }

  return (
    <>
      <div className="pwa-card" role="dialog" aria-label="Instalar ADIA">
        <button className="pwa-close" onClick={dismiss} aria-label="Cerrar">
          <X size={16} />
        </button>
        <div className="pwa-card-title">Lleva ADIA en tu teléfono</div>

        {canInstallAndroid ? (
          <button className="pwa-btn" onClick={handleInstall}>
            <Download size={16} /> Instalar app
          </button>
        ) : null}

        {showIOSInstall ? (
          <p className="pwa-ios">
            Para instalar: toca <Share size={14} className="pwa-inline" /> <strong>Compartir</strong> y luego{" "}
            <strong>“Agregar a inicio”</strong>.
          </p>
        ) : null}

        {showNotifAction ? (
          <button className="pwa-btn ghost" onClick={enableNotifications} disabled={working}>
            <Bell size={16} /> {working ? "Activando…" : "Activar notificaciones"}
          </button>
        ) : null}
      </div>
      {toast ? <div className="pwa-toast">{toast}</div> : null}
    </>
  );
}
