"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, RefreshCw, Share2, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const noopSubscribe = () => () => {};

function getIsIOSDevice() {
  if (typeof navigator === "undefined") return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function subscribeToDisplayMode(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getIsStandalone() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

const getServerSnapshot = () => false;

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const [iosDismissed, setIosDismissed] = useState(false);
  const isIOS = useSyncExternalStore(noopSubscribe, getIsIOSDevice, getServerSnapshot);
  const isStandalone = useSyncExternalStore(subscribeToDisplayMode, getIsStandalone, getServerSnapshot);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa-update-available", handleUpdateAvailable);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa-update-available", handleUpdateAvailable);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      // The browser-owned prompt can only be used once.
      setInstallPrompt(null);
    }
  }

  async function updateApp() {
    setUpdatePending(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration?.waiting) {
        setUpdatePending(false);
        setUpdateAvailable(false);
        return;
      }

      const reloadAfterControllerChange = () => window.location.reload();
      navigator.serviceWorker.addEventListener("controllerchange", reloadAfterControllerChange, { once: true });

      // The service worker activates only after the user chooses to update.
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    } catch {
      setUpdatePending(false);
    }
  }

  if (updateAvailable) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-xl items-center gap-4 rounded-xl border border-brand-border bg-white p-4 shadow-xl"
      >
        <RefreshCw size={22} className="shrink-0 text-brand-purple" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-text-primary">New version available</p>
          <p className="mt-1 text-xs text-brand-text-secondary">Refresh to use the latest version of Portland Gas Operations.</p>
        </div>
        <Button size="sm" onClick={updateApp} loading={updatePending} loadingText="Updating" leftIcon={<RefreshCw size={14} />}>
          Update
        </Button>
        <button
          type="button"
          onClick={() => setUpdateAvailable(false)}
          className="rounded-md p-1 text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary"
          aria-label="Dismiss update notification"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (isStandalone || (!installPrompt && (!isIOS || iosDismissed))) return null;

  if (isIOS && !installPrompt) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-xl items-center gap-4 rounded-xl border border-brand-border bg-white p-4 shadow-xl"
      >
        <Share2 size={22} className="shrink-0 text-brand-purple" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-text-primary">Install on iPhone or iPad</p>
          <p className="mt-1 text-xs leading-5 text-brand-text-secondary">
            In Safari, tap <span className="font-semibold text-brand-text-primary">Share</span>, choose <span className="font-semibold text-brand-text-primary">Add to Home Screen</span>, then tap <span className="font-semibold text-brand-text-primary">Add</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIosDismissed(true)}
          className="rounded-md p-1 text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary"
          aria-label="Dismiss iOS install instructions"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-xl items-center gap-4 rounded-xl border border-brand-border bg-white p-4 shadow-xl"
    >
      <Download size={22} className="shrink-0 text-brand-purple" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-text-primary">Install Portland Gas Operations</p>
        <p className="mt-1 text-xs text-brand-text-secondary">Add the app to your device for quicker access.</p>
      </div>
      <Button size="sm" onClick={installApp} leftIcon={<Download size={14} />}>
        Install
      </Button>
      <button
        type="button"
        onClick={() => setInstallPrompt(null)}
        className="rounded-md p-1 text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary"
        aria-label="Dismiss install prompt"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
