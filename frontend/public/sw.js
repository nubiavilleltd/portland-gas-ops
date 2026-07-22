/**
 * Portland Gas Ops — Web Push Service Worker
 *
 * Handles push events while the tab is closed/backgrounded.
 * Clicking the notification navigates to the deep-link URL passed in the payload.
 */

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
    icon:    data.icon  || "/icon.png",
    badge:   "/icon.png",
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
