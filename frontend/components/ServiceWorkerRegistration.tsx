"use client";

import { useEffect } from "react";

/** Registers the application service worker independently of authentication. */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const announceUpdate = () => window.dispatchEvent(new Event("pwa-update-available"));

    const watchForUpdates = (registration: globalThis.ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        announceUpdate();
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          // The first install has no existing controller. Only announce later
          // versions so the user is not interrupted during initial setup.
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            announceUpdate();
          }
        });
      });
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        watchForUpdates(registration);
        return registration.update();
      })
      .catch((error: unknown) => {
        // PWA support is progressive enhancement; registration must not break the app.
        console.debug("[ServiceWorker] registration failed:", error);
      });
  }, []);

  return null;
}
