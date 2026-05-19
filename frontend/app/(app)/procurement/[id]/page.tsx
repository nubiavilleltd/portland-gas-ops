"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Paperclip, Building2, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useUpdateProcurementStatus, useCancelProcurement, useProcurement } from "@/hooks/useProcurement";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import type { ProcurementStatus } from "@/types";

function DownloadPOButton({ requestId, reference }: { requestId: string; reference: string }) {
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.accessToken);

  async function handleDownload() {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/procurement/${requestId}/download-po`, {
        headers,
        credentials: "include",   // sends access_token cookie, same as axios withCredentials
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download the PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors text-brand-text-primary disabled:opacity-50"
    >
      <Download size={14} />
      {loading ? "Downloading…" : "Download PO"}
    </button>
  );
}

const STATUS_ACTIONS: Record<ProcurementStatus, { label: string; next: ProcurementStatus } | null> = {
  submitted: { label: "Mark as Ordered", next: "ordered" },
  ordered: { label: "Mark as Delivered", next: "delivered" },
  delivered: null,
  cancelled: null,
  draft: { label: "Submit", next: "submitted" },
};

export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();

  const { data: req, isLoading, isError } = useProcurement(id);
  const updateStatus = useUpdateProcurementStatus(id);
  const cancelRequest = useCancelProcurement(id);

  const isManager = user?.role === "admin" || user?.role === "super_admin";

  async function handleStatusUpdate(next: ProcurementStatus) {
    try {
      await updateStatus.mutateAsync(next);
      toast.success(`Request marked as ${next}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      await cancelRequest.mutateAsync();
      toast.success("Request cancelled");
      router.push("/procurement");
    } catch {
      toast.error("Failed to cancel request");
    }
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Procurement">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (isError || !req) {
    return (
      <AppLayout pageTitle="Procurement">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Request not found or you don&apos;t have access.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  const grandTotal = req.items.reduce((sum, item) => sum + Number(item.total_cost), 0);
  const statusAction = STATUS_ACTIONS[req.status];

  return (
    <AppLayout pageTitle="Procurement">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Procurement
      </button>

      <div className="max-w-4xl space-y-5">

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-1">{req.reference}</p>
              <h1 className="text-xl font-semibold text-brand-text-primary">{req.title}</h1>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ApprovalBadge status={req.status} />
              {req.po_url && (
                <DownloadPOButton requestId={req.id} reference={req.reference} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-6 text-sm">
            {[
              ["Category", capitalize(req.category)],
              ["Priority", capitalize(req.priority)],
              ["Required By", formatDate(req.required_by)],
              ["Submitted", formatDate(req.created_at)],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-brand-text-secondary mb-0.5">{label}</p>
                <p className="font-medium text-brand-text-primary">{val}</p>
              </div>
            ))}
          </div>

          {req.justification && (
            <div className="mt-5 pt-5 border-t border-brand-border">
              <p className="text-xs text-brand-text-secondary mb-1">Justification</p>
              <p className="text-sm text-brand-text-primary">{req.justification}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: Line items + totals ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50">
                <h2 className="text-sm font-semibold text-brand-text-primary">Line Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Description</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map((item, i) => (
                      <tr key={item.id} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                        <td className="px-4 py-3 text-brand-text-primary">{item.description}</td>
                        <td className="px-4 py-3 text-center text-brand-text-secondary">{item.quantity}</td>
                        <td className="px-4 py-3 text-center text-brand-text-secondary capitalize">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-brand-text-secondary">{formatCurrency(Number(item.unit_cost))}</td>
                        <td className="px-4 py-3 text-right font-medium text-brand-text-primary">{formatCurrency(Number(item.total_cost))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-brand-purple/20 bg-brand-purple/5">
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-brand-text-secondary text-right">
                        Estimated Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-purple">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Attachment */}
            {req.attachment_url && (
              <div className="bg-white border border-brand-border rounded-2xl p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Paperclip size={16} className="text-brand-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text-primary truncate">
                    {req.attachment_name ?? "Supporting document"}
                  </p>
                  <p className="text-xs text-brand-text-secondary">Attached file</p>
                </div>
                <a
                  href={req.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0"
                >
                  <Download size={13} /> View
                </a>
              </div>
            )}
          </div>

          {/* ── Right: Vendor + Actions ────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Vendor card */}
            {req.vendor ? (
              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={14} className="text-brand-purple" />
                  <h3 className="text-sm font-semibold text-brand-text-primary">Vendor</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-brand-text-primary">{req.vendor.name}</p>
                  {req.vendor.address && <p className="text-brand-text-secondary text-xs">{req.vendor.address}</p>}
                  {req.vendor.phone && <p className="text-brand-text-secondary text-xs">{req.vendor.phone}</p>}
                  {req.vendor.email && <p className="text-brand-text-secondary text-xs">{req.vendor.email}</p>}
                  {req.vendor.bank_name && (
                    <div className="pt-2 mt-2 border-t border-brand-border">
                      <p className="text-xs text-brand-text-secondary">Bank Details</p>
                      <p className="text-xs font-medium text-brand-text-primary mt-0.5">{req.vendor.bank_name}</p>
                      <p className="text-xs text-brand-text-secondary">{req.vendor.account_name}</p>
                      <p className="text-xs font-mono text-brand-text-primary">{req.vendor.account_number}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={14} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-brand-text-primary">Vendor</h3>
                </div>
                <p className="text-sm text-brand-text-secondary">No vendor assigned</p>
              </div>
            )}

            {/* Actions card */}
            {(isManager || req.status === "submitted") && (
              <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-brand-text-primary">Actions</h3>

                {isManager && statusAction && (
                  <button
                    onClick={() => handleStatusUpdate(statusAction.next)}
                    disabled={updateStatus.isPending}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
                  >
                    {updateStatus.isPending ? "Updating…" : statusAction.label}
                  </button>
                )}

                {req.status !== "cancelled" && req.status !== "delivered" && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelRequest.isPending}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {cancelRequest.isPending ? "Cancelling…" : "Cancel Request"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
