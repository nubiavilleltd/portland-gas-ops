"use client";

import { useRef } from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Package, AlertCircle, Wrench, Car, History, Download } from "lucide-react";
import QRCode from "react-qr-code";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAsset, useAssignmentLogs } from "@/hooks/useAssets";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetAssignmentLog } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  available:    "bg-green-100 text-green-700",
  assigned:     "bg-blue-100 text-blue-700",
  under_repair: "bg-amber-100 text-amber-700",
  retired:      "bg-gray-100 text-gray-500",
};
const CONDITION_STYLES: Record<string, string> = {
  new:  "bg-purple-100 text-purple-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};
const LOG_EVENT_COLOURS: Record<string, string> = {
  registered:    "bg-green-100 text-green-700",
  assigned:      "bg-blue-100 text-blue-700",
  transferred:   "bg-purple-100 text-purple-700",
  returned:      "bg-teal-100 text-teal-700",
  status_changed: "bg-amber-100 text-amber-700",
  retired:       "bg-gray-100 text-gray-500",
};

function logEventDescription(log: AssetAssignmentLog): string {
  switch (log.event_type) {
    case "registered": return `Registered as available`;
    case "assigned":   return `Assigned to a staff member`;
    case "transferred": return `Transferred to new location`;
    case "returned":   return `Returned — now available`;
    case "status_changed": return log.notes ?? "Status updated";
    case "retired":    return `Retired from service`;
    default: return log.notes ?? capitalize(log.event_type);
  }
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: asset, isLoading, isError } = useAsset(id);
  const { data: assignmentLogs = [] } = useAssignmentLogs(id);
  const qrRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"details" | "log">("details");

  function downloadQR() {
    const container = qrRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset?.asset_tag ?? asset?.name ?? "asset"}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <AppLayout pageTitle="Assets"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;
  if (isError || !asset) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Asset not found.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Assets">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors">
        <ArrowLeft size={14} /> Back to Assets
      </button>

      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-brand-text-primary">{asset.name}</h1>
              {asset.category && <p className="text-sm text-brand-text-secondary mt-0.5">{asset.category.name}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.status.replace(/_/g, " "))}</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.condition)}</span>
                {asset.asset_tag && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{asset.asset_tag}</span>}
                {asset.is_maintenance_due && <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700"><Wrench size={10} /> Maintenance Due</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-brand-border rounded-xl p-1 w-fit">
          {(["details", "log"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={["px-4 py-1.5 text-sm rounded-lg transition-colors capitalize", activeTab === tab ? "bg-brand-purple text-white font-medium" : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50"].join(" ")}>
              {tab === "log" ? "Activity Log" : "Details"}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white border border-brand-border rounded-2xl">
                <div className="relative h-64 bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden">
                  {asset.image_url ? <Image src={asset.image_url} alt={asset.name} fill className="object-contain" /> : <div className="flex flex-col items-center gap-2 text-gray-300"><Package size={48} /><p className="text-sm">No image</p></div>}
                </div>
              </div>
              <div className="bg-white border border-brand-border rounded-2xl">
                <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl"><h2 className="text-sm font-semibold text-brand-text-primary">Asset Details</h2></div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                    {([
                      ["Category",      asset.category?.name ?? "—"],
                      ["Asset Type",    asset.asset_type?.name ?? "—"],
                      ["Asset Tag",     asset.asset_tag ?? "—"],
                      ["Serial Number", asset.serial_number ?? "—"],
                      ["Added",         formatDate(asset.created_at)],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label}><p className="text-xs text-brand-text-secondary mb-0.5">{label}</p><p className="font-medium text-brand-text-primary">{value}</p></div>
                    ))}
                  </div>
                  {asset.description && <div className="mt-5 pt-5 border-t border-brand-border"><p className="text-xs text-brand-text-secondary mb-1">Description</p><p className="text-sm text-brand-text-primary">{asset.description}</p></div>}
                  {asset.vehicle_details && (
                    <div className="mt-5 pt-5 border-t border-brand-border">
                      <div className="flex items-center gap-2 mb-4"><Car size={14} className="text-brand-purple" /><p className="text-sm font-semibold text-brand-text-primary">Vehicle Details</p></div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                        {([
                          ["Vehicle Type", asset.vehicle_details.vehicle_type ? capitalize(asset.vehicle_details.vehicle_type.replace(/_/g, " ")) : "—"],
                          ["Fuel Type",    asset.vehicle_details.fuel_type ? capitalize(asset.vehicle_details.fuel_type) : "—"],
                          ["Year",         asset.vehicle_details.year_of_manufacture ? String(asset.vehicle_details.year_of_manufacture) : "—"],
                          ["Color",        asset.vehicle_details.color ?? "—"],
                        ] as [string, string][]).map(([label, value]) => (
                          <div key={label}><p className="text-xs text-brand-text-secondary mb-0.5">{label}</p><p className="font-medium text-brand-text-primary">{value}</p></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-brand-text-primary mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-brand-text-secondary">Status</span><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.status.replace(/_/g, " "))}</span></div>
                  <div className="flex items-center justify-between"><span className="text-brand-text-secondary">Condition</span><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.condition)}</span></div>
                  {asset.category && <div className="flex items-center justify-between"><span className="text-brand-text-secondary">Category</span><span className="font-medium text-brand-text-primary">{asset.category.name}</span></div>}
                  {asset.asset_type && <div className="flex items-center justify-between"><span className="text-brand-text-secondary">Asset Type</span><span className="font-medium text-brand-text-primary">{asset.asset_type.name}</span></div>}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-brand-text-primary mb-4">QR Code</h3>
                <div className="flex flex-col items-center gap-3">
                  <div ref={qrRef} className="p-3 bg-white border border-brand-border rounded-xl">
                    <QRCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/assets/${asset.id}`} size={140} fgColor="#1a1a1a" bgColor="#ffffff" />
                  </div>
                  {asset.asset_tag && <p className="text-xs font-mono text-brand-text-secondary">{asset.asset_tag}</p>}
                  <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-brand-border text-brand-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"><Download size={13} /> Download QR</button>
                </div>
              </div>

              {asset.status === "available" && (
                <div className="bg-white border border-brand-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Request Asset</h3>
                  <p className="text-xs text-brand-text-secondary mb-4">Submit a loan or requisition request for this asset type.</p>
                  <a href="/assets/requests/new" className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors">Request this Asset</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === "log" && (
          <div className="bg-white border border-brand-border rounded-2xl">
            <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl flex items-center gap-2">
              <History size={14} className="text-brand-purple" />
              <div><h2 className="text-sm font-semibold text-brand-text-primary">Activity Log</h2><p className="text-xs text-brand-text-secondary mt-0.5">{assignmentLogs.length} event{assignmentLogs.length !== 1 ? "s" : ""} recorded</p></div>
            </div>
            {assignmentLogs.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-brand-text-secondary"><History size={28} className="mb-2 text-gray-300" /><p className="text-sm">No activity recorded yet</p></div> : (
              <div className="divide-y divide-brand-border">
                {assignmentLogs.map((log) => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LOG_EVENT_COLOURS[log.event_type] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(log.event_type.replace(/_/g, " "))}</span></div>
                        <p className="text-sm text-brand-text-primary">{logEventDescription(log)}</p>
                      </div>
                      <div className="text-right shrink-0"><p className="text-xs text-brand-text-secondary">{formatDate(log.performed_at)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
