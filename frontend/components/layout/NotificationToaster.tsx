"use client";

/**
 * NotificationToaster — invisible background component.
 *
 * Piggybacks on the existing useNotifications() poll (every 30 s) and shows
 * Sonner toasts for new unread notifications without touching the bell dropdown.
 *
 * Rules:
 * - Notifications older than 5 min on first load are silently marked seen (no flood on login)
 * - Already-read notifications are skipped
 * - seenRef (backed by sessionStorage) prevents the same notification toasting twice
 * - Hidden tabs are skipped to avoid wasted requests
 * - 3+ new notifications at once → one summary toast instead of a flood
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/lib/modules/notifications/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AppNotification } from "@/lib/modules/notifications/types";

const SEEN_KEY          = "seen_notification_ids";
const FIVE_MINUTES_MS   = 5 * 60 * 1000;
const BATCH_THRESHOLD   = 3; // show summary when 3+ arrive at once

// Frontend deep-link paths — mirrors backend _REQUEST_TYPE_PATHS in email_service.py
const REFERENCE_PATHS: Record<string, string> = {
  procurement:        "/procurement",
  asset:              "/assets/requests",
  leave:              "/hr-management/leave-requests",
  cash_requisition:   "/finance/cash-requisitions",
  invoice:            "/finance/invoices",
  work_initiation:    "/safety/work-initiation",
  work_authorization: "/safety/work-authorization",
  work_closeout:      "/safety/work-close-out",
};

function getSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {}
}

function buildUrl(n: AppNotification): string | null {
  if (!n.reference_type || !n.reference_id) return null;
  const path = REFERENCE_PATHS[n.reference_type];
  return path ? `${path}/${n.reference_id}` : null;
}

export default function NotificationToaster() {
  const { isAuthenticated } = useCurrentUser();
  const router              = useRouter();
  const seenRef             = useRef<Set<string>>(getSeenIds());

  // Reuse the same query the bell already runs — no extra network requests
  const { data: notifications = [] } = useNotifications({ limit: 30 });

  useEffect(() => {
    if (!isAuthenticated || notifications.length === 0) return;
    if (document.visibilityState === "hidden") return;

    const now   = Date.now();
    const fresh: AppNotification[] = [];

    for (const n of notifications) {
      const key   = String(n.id);
      const ts    = n.created_at.endsWith("Z") ? n.created_at : n.created_at + "Z";
      const isOld = now - new Date(ts).getTime() > FIVE_MINUTES_MS;

      // Mark old ones as seen so they never re-toast after a page refresh
      if (isOld) {
        seenRef.current.add(key);
        continue;
      }

      if (n.is_read || seenRef.current.has(key)) continue;

      seenRef.current.add(key);
      fresh.push(n);
    }

    saveSeenIds(seenRef.current);

    if (fresh.length === 0) return;

    // ── Batch: 3+ at once → summary toast ──────────────────────────────────
    if (fresh.length >= BATCH_THRESHOLD) {
      toast.info(`${fresh.length} new notifications`, {
        description: "Open the notification bell to review them.",
        id:          `notif-batch-${Date.now()}`,
        duration:    8000,
      });
      return;
    }

    // ── Individual toasts for 1–2 new notifications ─────────────────────────
    for (const n of fresh) {
      const url = buildUrl(n);
      const options = {
        description: n.message || undefined,
        id:          `notif-${n.id}`,
        duration:    8000,
        ...(url ? {
          action: {
            label:   "View",
            onClick: () => router.push(url),
          },
        } : {}),
      };

      switch (n.type) {
        case "approved":
          toast.success(n.title, options);
          break;
        case "rejected":
        case "returned":
          toast.error(n.title, options);
          break;
        case "approval_required":
          toast.warning(n.title, options);
          break;
        default:
          toast.info(n.title, options);
      }
    }
  }, [notifications, isAuthenticated, router]);

  return null;
}
