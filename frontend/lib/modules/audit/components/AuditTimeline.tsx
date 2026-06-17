// lib/modules/audit/components/AuditTimeline.tsx
"use client";
import { formatDate } from "@/lib/utils";
import { getActorLabel } from "../types/audit.types";
import type { AuditLogEntry } from "../types/audit.types";

export default function AuditTimeline({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-brand-text-secondary py-4 text-center">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex gap-3 pb-4 relative">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-brand-purple mt-1.5" />
            {i < entries.length - 1 && (
              <div className="w-px flex-1 bg-brand-border mt-1" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <p className="text-sm text-brand-text-primary">{entry.description}</p>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              {getActorLabel(entry.actor)} · {formatDate(entry.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}