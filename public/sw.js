// Service worker de ADIA (PWA + Web Push).

// Activación inmediata de nuevas versiones.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough de red. Sin caché agresivo para no servir versiones viejas de la
// app; basta con tener el handler para cumplir el criterio de instalabilidad.
self.addEventListener("fetch", () => {
  // No-op: se deja que el navegador maneje la petición normalmente.
});

// Recepción de una notificación push.
self.addEventListener("push", (event) => {
  let data = { title: "ADIA", body: "Tienes una novedad.", url: "/planner" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/planner" },
    }),
  );
});

// Clic en la notificación: enfoca una pestaña abierta o abre la app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/planner";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
