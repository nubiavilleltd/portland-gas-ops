"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import DatePicker from "@/components/forms/DatePicker";
import SelectInput from "@/components/forms/SelectInput";
import { useAllAssignmentLogs, useAssets } from "@/hooks/useAssets";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetAssignmentLog } from "@/types";

// ── Event colour badges ────────────────────────────────────────────────────────

const EVENT_COLOURS: Record<string, string> = {
  registered:     "bg-green-100 text-green-700",
  assigned:       "bg-blue-100 text-blue-700",
  transferred:    "bg-purple-100 text-purple-700",
  returned:       "bg-teal-100 text-teal-700",
  status_changed: "bg-amber-100 text-amber-700",
  retired:        "bg-gray-100 text-gray-500",
};

const EVENT_LABELS: Record<string, string> = {
  registered:     "Registered",
  assigned:       "Assigned",
  transferred:    "Transferred",
  returned:       "Returned",
  status_changed: "Status Changed",
  retired:        "Retired",
};

function movementSummary(log: AssetAssignmentLog): string {
  const from = [log.from_person, log.from_location].filter(Boolean).join(" / ");
  const to   = [log.to_person,   log.to_location  ].filter(Boolean).join(" / ");
  if (from && to) return `${from} → ${to}`;
  if (to)   return to;
  if (from) return from;
  return log.notes ?? "—";
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: AssetAssignmentLog; onClose: () => void }) {
  const from = [log.from_person, log.from_location].filter(Boolean);
  const to   = [log.to_person,   log.to_location  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${EVENT_COLOURS[log.event_type] ?? "bg-gray-100 text-gray-500"}`}>
              {EVENT_LABELS[log.event_type] ?? capitalize(log.event_type)}
            </span>
            {log.asset_tag && (
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-brand-text-secondary">
                {log.asset_tag}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* From → To */}
          {(from.length > 0 || to.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-brand-text-secondary mb-1">From</p>
                {from.length > 0 ? (
                  <div className="space-y-0.5">
                    {log.from_person   && <p className="text-sm font-medium text-brand-text-primary">{log.from_person}</p>}
                    {log.from_location && <p className="text-xs text-brand-text-secondary">{log.from_location}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-brand-text-secondary mb-1">To</p>
                {to.length > 0 ? (
                  <div className="space-y-0.5">
                    {log.to_person   && <p className="text-sm font-medium text-brand-text-primary">{log.to_person}</p>}
                    {log.to_location && <p className="text-xs text-brand-text-secondary">{log.to_location}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">—</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {log.notes && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Notes</p>
              <p className="text-sm text-brand-text-primary leading-relaxed">{log.notes}</p>
            </div>
          )}

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-border">
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Date</p>
              <p className="text-sm font-medium text-brand-text-primary">{formatDate(log.performed_at)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Performed By</p>
              <p className="text-sm font-medium text-brand-text-primary">{log.performed_by_name ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border bg-gray-50/50 rounded-b-2xl">
          <Link
            href={`/assets/${log.asset_id}`}
            className="text-sm font-medium text-brand-purple hover:underline"
            onClick={onClose}
          >
            View Asset →
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetHistoryPage() {
  const router = useRouter();
  const { data: logs = [], isLoading } = useAllAssignmentLogs();
  const { data: assets = [] } = useAssets({});

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeLog, setActiveLog] = useState<AssetAssignmentLog | null>(null);

  const filtered = useMemo(() => {
    let list = [...logs].sort(
      (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
    );
    if (selectedAssetId) list = list.filter((l) => l.asset_id === selectedAssetId);
    if (eventFilter) list = list.filter((l) => l.event_type === eventFilter);
    if (dateFrom) list = list.filter((l) => l.performed_at >= dateFrom);
    if (dateTo)   list = list.filter((l) => l.performed_at <= dateTo + "T23:59:59Z");
    return list;
  }, [logs, selectedAssetId, eventFilter, dateFrom, dateTo]);

  return (
    <AppLayout pageTitle="Assets">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Assets
      </button>

      <PageHeader
        title="Asset History"
        description="Complete movement history for all assets"
        className="mb-6"
      />

      {/* Filters — 4-column grid */}
      <div className="grid grid-cols-4 gap-4 mb-5 items-end">
        <SelectInput
          label="Asset"
          placeholder="All Assets"
          sortOptions={false}
          value={selectedAssetId}
          onValueChange={setSelectedAssetId}
          options={assets
            .filter((a) => a.asset_tag)
            .sort((a, b) => (a.asset_tag ?? "").localeCompare(b.asset_tag ?? ""))
            .map((a) => ({ value: a.id, label: `${a.asset_tag} — ${a.name}` }))}
        />

        <SelectInput
          label="Event"
          placeholder="All Events"
          sortOptions={false}
          value={eventFilter}
          onValueChange={setEventFilter}
          options={Object.entries(EVENT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />

        <DatePicker
          label="From"
          value={dateFrom}
          onValueChange={setDateFrom}
          placeholder="Start date"
        />

        <DatePicker
          label="To"
          value={dateTo}
          onValueChange={setDateTo}
          placeholder="End date"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-brand-text-secondary mb-4">
        {!isLoading && `${filtered.length} event${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No events found" description="Try adjusting your filters" />
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Tag</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Movement / Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr
                    key={log.id}
                    onClick={() => setActiveLog(log)}
                    className={`border-b border-brand-border last:border-b-0 cursor-pointer hover:bg-brand-purple/5 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                  >
                    {/* Tag */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {log.asset_tag ? (
                        <Link
                          href={`/assets/${log.asset_id}`}
                          className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-brand-purple hover:underline"
                        >
                          {log.asset_tag}
                        </Link>
                      ) : (
                        <span className="text-brand-text-secondary">—</span>
                      )}
                    </td>

                    {/* Event badge */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${EVENT_COLOURS[log.event_type] ?? "bg-gray-100 text-gray-500"}`}>
                        {EVENT_LABELS[log.event_type] ?? capitalize(log.event_type)}
                      </span>
                    </td>

                    {/* Movement summary */}
                    <td className="px-4 py-3 text-brand-text-primary max-w-[240px]">
                      <span className="block truncate" title={movementSummary(log)}>
                        {movementSummary(log)}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-brand-text-secondary max-w-[200px]">
                      {log.notes ? (
                        <span className="block truncate text-xs" title={log.notes}>{log.notes}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-brand-text-secondary whitespace-nowrap">
                      {formatDate(log.performed_at)}
                    </td>

                    {/* Performed by */}
                    <td className="px-4 py-3 text-xs text-brand-text-secondary">
                      {log.performed_by_name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {activeLog && (
        <LogDetailModal log={activeLog} onClose={() => setActiveLog(null)} />
      )}
    </AppLayout>
  );
}
