"use client";

import { useEffect } from "react";

/** Registers the application service worker independently of authentication. */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      // PWA support is progressive enhancement; registration must not break the app.
      console.debug("[ServiceWorker] registration failed:", error);
    });
  }, []);

  return null;
}
