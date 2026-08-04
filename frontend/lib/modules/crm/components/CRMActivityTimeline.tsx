"use client";

import { formatDateTime } from "@/lib/utils";
import type { CRMActivity } from "../types";

interface Props {
  entries: CRMActivity[];
}

export default function CRMActivityTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-brand-text-secondary">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={entry.id} className="relative flex gap-3 pb-4">
          {/* Timeline dot + line */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-brand-purple" />

            {i < entries.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-brand-border" />
            )}
          </div>

          <div className="flex-1 pb-2">
            <p className="text-sm font-medium text-brand-text-primary">
              {entry.action}
            </p>

            <p className="mt-0.5 text-sm text-brand-text-secondary">
              {entry.description}
            </p>

            <p className="mt-1 text-xs text-brand-text-secondary">
              {entry.actor_name ?? "System"} ·{" "}
              {formatDateTime(entry.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
