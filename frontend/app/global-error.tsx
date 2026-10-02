"use client";

import { useEffect } from "react";

/**
 * The only boundary that sits above app/layout.tsx itself. Without this file,
 * an error thrown in the root layout — or in anything rendered as a direct
 * sibling of {children} there (service worker registration, the install
 * prompt, the providers tree) — has no boundary to catch it. React unmounts
 * the whole tree and the page goes blank with nothing on screen and no
 * indication anything failed.
 *
 * app/(app)/error.tsx already covers everything below the root layout; this
 * is the missing layer above it. Deliberately minimal and dependency-light —
 * if the root layout itself is what failed, this must not lean on anything
 * that could be part of the same failure, and Next.js requires this file to
 * render its own <html>/<body> since it replaces the root layout entirely
 * while active.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#F7F7FA" }}>
        <div style={{ textAlign: "center", padding: "1.5rem", maxWidth: 380 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Something went wrong</p>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: 16 }}>
            The page failed to load. Reloading usually fixes this.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#7234BD",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
