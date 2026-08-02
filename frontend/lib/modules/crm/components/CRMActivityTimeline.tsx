"use client";

import { formatDateTime } from "@/lib/utils";
import type { CRMActivity } from "../types";

interface Props {
  entries: CRMActivity[];
}

export default function CRMActivityTimeline({ entries }: Props) {
  if (!entries.length) {
    return (
      <div className="rounded-lg border border-dashed py-8 text-center text-sm text-brand-text-secondary">
        No activity recorded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl border border-brand-border p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold text-brand-text">{entry.action}</h4>

              <p className="mt-1 text-sm text-brand-text-secondary">
                {entry.description}
              </p>

              <p className="mt-2 text-xs text-brand-text-secondary">
                By{" "}
                <span className="font-medium">
                  {entry.actor_name ?? "System"}
                </span>
              </p>
            </div>

            <div className="whitespace-nowrap text-xs text-brand-text-secondary">
              {formatDateTime(entry.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
