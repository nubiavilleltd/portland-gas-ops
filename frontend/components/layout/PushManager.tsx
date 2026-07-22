"use client";

/**
 * PushManager — mounts silently in AppLayout / IntranetLayout.
 *
 * On mount (after login):
 *  1. Registers /sw.js as a Service Worker.
 *  2. Requests Notification permission if not already granted.
 *  3. Subscribes to the push service using the VAPID public key.
 *  4. POSTs the subscription to /api/push/subscribe.
 *
 * On unmount (logout) it does nothing — the subscription stays valid.
 * The DELETE /api/push/subscribe endpoint is called explicitly on logout
 * if the app wants to revoke (optional, not wired here to keep it simple).
 *
 * Renders nothing — purely a side-effect component.
 */

import { useEffect } from "react";
import api from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Convert a base64url VAPID key to the Uint8Array that the browser expects. */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  const arr     = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export default function PushManager() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID_PUBLIC_KEY
    ) {
      return; // browser doesn't support push, or VAPID key not configured
    }

    let cancelled = false;

    async function setup() {
      try {
        // 1. Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Wait until the SW is active (handles first-load install)
        await navigator.serviceWorker.ready;

        if (cancelled) return;

        // 2. Ask for permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        // 3. Subscribe (or reuse existing subscription)
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly:      true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        if (cancelled) return;

        // 4. Persist on the server (upsert — safe to call every mount)
        await api.post("/api/push/subscribe", {
          subscription: subscription.toJSON(),
        });
      } catch (err) {
        // Push setup must never crash the app — log silently
        console.debug("[PushManager] setup failed:", err);
      }
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
