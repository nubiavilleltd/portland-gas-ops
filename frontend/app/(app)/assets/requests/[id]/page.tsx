"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Package, RotateCcw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import AuditTrail from "@/components/forms/AuditTrail";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAssetRequest, useUpdateAssetRequestStatus } from "@/hooks/useAssets";
import { useToast } from "@/hooks/useToast";
import { formatDate, capitalize } from "@/lib/utils";

function nowStr() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const { data: req, isLoading, isError } = useAssetRequest(id);
  const updateStatus = useUpdateAssetRequestStatus(id);

  const canMarkReturn =
    (req?.status === "approved" || req?.status === "allocated") &&
    req?.request_type === "loan";

  async function handleMarkReturned() {
    try {
      await updateStatus.mutateAsync({
        status: "returned",
        auditEntry: {
          action: "Returned",
          actor: req?.requester?.name ?? req?.requester_name ?? "Requester",
          role: "Requester",
          dateTime: nowStr(),
          comment: "",
        },
      });
      toast.success("Marked as returned");
    } catch {
      toast.error("Failed to update");
    }
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (isError || !req) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Request not found or you don&apos;t have access.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Assets">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/assets/requests"
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Requests
        </Link>
      </div>

      <div className="space-y-5">

        {/* Header card */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary mb-1">Asset Request</p>
              <h2 className="text-xl font-semibold text-brand-text-primary">{req.reference}</h2>
              <p className="mt-1 text-sm font-semibold text-brand-text-primary capitalize">{req.request_type}</p>
            </div>
            <ApprovalBadge status={req.status} />
          </div>
          {(() => {
            const actor =
              req.status === "pending" || req.status === "approved" ? "Asset Admin" :
              req.status === "allocated" && req.request_type === "loan" ? "Requester" :
              null;
            return actor ? (
              <p className="mt-2 text-sm text-brand-text-secondary">
                Next actor <span className="font-medium text-brand-text-primary">{actor}</span>
              </p>
            ) : null;
          })()}
          {req.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-600">{req.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Requester Details */}
        <FormSection title="Requester Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput label="Requester Name" value={req.requester?.name ?? req.requester_name ?? "—"} />
            <FormInput label="Department" value={req.requester?.department ?? "—"} />
            <FormInput label="Job Title" value={req.requester?.job_title ?? "—"} />
            <FormDatePicker label="Request Date" value={req.created_at.slice(0, 10)} disabled />
          </div>
        </FormSection>

        {/* Request Details */}
        <FormSection title="Request Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput label="Request Type" value={capitalize(req.request_type)} />
            {req.request_type === "loan" && req.return_date && (
              <FormInput label="Return By" value={formatDate(req.return_date)} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-primary mb-1">Purpose</p>
            <p className="text-sm text-brand-text-primary leading-relaxed">{req.purpose}</p>
          </div>
        </FormSection>

        {/* Requested Items */}
        <FormSection title={`Requested Items (${req.items.length})`} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Asset Type</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-brand-text-primary">{item.asset_type?.name ?? "Unknown type"}</p>
                          {item.asset_type?.prefix && (
                            <p className="text-xs text-brand-text-secondary font-mono">{item.asset_type.prefix}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>

        {/* Mark as Returned — loan only */}
        {canMarkReturn && (
          <ApprovalPanel
            title="Return Asset"
            description="Confirm that the borrowed asset has been returned to the asset admin."
            showComment={false}
            showReturn={false}
            showReject={false}
            showApprove={false}
            extraActions={[{
              key: "mark_returned",
              label: updateStatus.isPending ? "Updating…" : "Mark as Returned",
              icon: <RotateCcw size={14} />,
              variant: "approve",
              onClick: () => handleMarkReturned(),
              loading: updateStatus.isPending,
            }]}
          />
        )}

        {/* Audit Trail */}
        <AuditTrail items={req.auditTrail ?? []} />

      </div>
    </AppLayout>
  );
}
