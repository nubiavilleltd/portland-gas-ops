/**
 * Portland Gas Ops — Web Push Service Worker
 *
 * Handles push events while the tab is closed/backgrounded.
 * Clicking the notification navigates to the deep-link URL passed in the payload.
 *
 * Installability is enabled by registering this worker globally. Offline caching
 * is intentionally not enabled yet; authenticated ERP data needs a deliberate
 * cache and privacy strategy before it is persisted on a device.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Portland Gas Ops", body: event.data.text(), url: "/" };
  }

  const title   = data.title || "Portland Gas Ops";
  const options = {
    body:    data.body  || "",
    icon:    data.icon  || "/icons/icon-192.png",
    badge:   "/icons/icon-192.png",
    tag:     data.tag   || "portlandgas-notif",
    data:    { url: data.url || "/" },
    // Reuse an existing notification with the same tag instead of stacking
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing tab on the same origin if one is open
        for (const client of windowClients) {
          try {
            const clientUrl = new URL(client.url);
            const swUrl     = new URL(self.location.origin);
            if (clientUrl.origin === swUrl.origin) {
              client.navigate(url);
              return client.focus();
            }
          } catch {
            // ignore malformed URLs
          }
        }
        // Otherwise open a new tab
        return clients.openWindow(url);
      })
  );
});
