"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Package, Boxes, CheckCircle, RotateCcw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAssetRequest, useUpdateAssetRequestStatus } from "@/lib/modules/assets";
import { useToast } from "@/hooks/useToast";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestStatus } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

type AssetRole = "requester" | "asset_admin";

// ── Role options ───────────────────────────────────────────────────────────────

const ROLES: { value: AssetRole; label: string }[] = [
  { value: "requester",  label: "Requester" },
  { value: "asset_admin", label: "Asset Admin" },
];

function getRoleLabel(role: AssetRole) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

// ── Status → default role ──────────────────────────────────────────────────────

function getDefaultRole(status: AssetRequestStatus): AssetRole {
  if (status === "pending" || status === "approved") return "asset_admin";
  return "requester";
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ASSET_ADMIN_ACTOR      = "Chinyere Okafor";
const ASSET_ADMIN_ACTOR_ROLE = "Asset Admin";

function nowStr() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Status gate notice ─────────────────────────────────────────────────────────

function StatusGateNotice({ role, status }: { role: AssetRole; status: AssetRequestStatus }) {
  let message: string | null = null;

  if (role === "asset_admin") {
    if (status === "allocated") message = "Assets have already been allocated for this request.";
    if (status === "returned")  message = "This loan has been returned and closed.";
    if (status === "rejected")  message = "This request was rejected.";
  }

  if (role === "requester") {
    if (status === "pending") message = "Your request is awaiting review by the Asset Admin.";
  }

  if (!message) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {message}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast  = useToast();

  const { data: req, isLoading, isError } = useAssetRequest(id);
  const updateStatus = useUpdateAssetRequestStatus(id);

  const [currentRole, setCurrentRole] = useState<AssetRole>(() =>
    req ? getDefaultRole(req.status) : "asset_admin"
  );

  // Sync default role once data loads
  const [roleSynced, setRoleSynced] = useState(false);
  if (req && !roleSynced) {
    setCurrentRole(getDefaultRole(req.status));
    setRoleSynced(true);
  }

  async function handleAdminAction(status: AssetRequestStatus, comment: string) {
    const actionLabel =
      status === "approved" ? "Approved" :
      status === "rejected" ? "Rejected" :
      "Returned to Requester";

    try {
      await updateStatus.mutateAsync({
        status,
        rejection_reason: status === "rejected" ? comment || undefined : undefined,
        auditEntry: {
          action: actionLabel,
          actor: ASSET_ADMIN_ACTOR,
          role: ASSET_ADMIN_ACTOR_ROLE,
          dateTime: nowStr(),
          comment: comment || "",
        },
      });
      toast.success(
        status === "approved" ? "Request approved" :
        status === "rejected" ? "Request rejected" :
        "Returned to requester"
      );
      if (status === "approved") setCurrentRole("asset_admin"); // stay on admin tab to allocate
      if (status === "rejected") setCurrentRole("requester");
    } catch {
      toast.error("Failed to update request");
    }
  }

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

  const showApprovalPanel = currentRole === "asset_admin" && req.status === "pending";
  const showAllocateBanner = currentRole === "asset_admin" && req.status === "approved";
  const canMarkReturn =
    currentRole === "requester" &&
    (req.status === "approved" || req.status === "allocated") &&
    req.request_type === "loan";

  const nextActor =
    req.status === "pending"   ? "Asset Admin" :
    req.status === "approved"  ? "Asset Admin" :
    req.status === "allocated" && req.request_type === "loan" ? "Requester" :
    undefined;

  const statusBadge = <ApprovalBadge status={req.status} />;

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

        {/* ── Role switcher + record header ─────────────────────────────────── */}
        <RoleBasedRecordHeader
          id={req.reference}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          roleLabel={getRoleLabel(currentRole)}
          roles={ROLES}
          status={statusBadge}
          recordLabel="Asset Request"
          title={capitalize(req.request_type)}
          nextActor={nextActor}
          switcherDescription="Switch roles to preview how the requester and Asset Admin see this request."
        />

        {/* ── Status gate notice ────────────────────────────────────────────── */}
        <StatusGateNotice role={currentRole} status={req.status} />

        {/* ── Requester Details ─────────────────────────────────────────────── */}
        <FormSection title="Requester Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput label="Requester Name" value={req.requester_name ?? "—"} disabled />
            <FormInput label="Department"     value={req.requester_department ?? "—"} disabled />
            <FormInput label="Job Title"      value={req.requester_job_title ?? "—"} disabled />
            <FormDatePicker label="Request Date" value={req.created_at.slice(0, 10)} disabled />
          </div>
        </FormSection>

        {/* ── Request Details ───────────────────────────────────────────────── */}
        <FormSection title="Request Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput label="Request Type" value={capitalize(req.request_type)} disabled />
            {req.request_type === "loan" && req.return_date && (
              <FormInput label="Return By" value={formatDate(req.return_date)} disabled />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text-primary mb-1">Purpose</p>
            <p className="text-sm text-brand-text-primary leading-relaxed bg-gray-50 border border-brand-border rounded-lg px-3 py-2.5">
              {req.purpose}
            </p>
          </div>
        </FormSection>

        {/* ── Requested Items ───────────────────────────────────────────────── */}
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
                          <p className="font-medium text-brand-text-primary">
                            {item.asset_type?.name ?? item.asset?.name ?? "—"}
                          </p>
                          {(item.asset_type?.prefix ?? item.asset?.asset_tag) && (
                            <p className="text-xs text-brand-text-secondary font-mono">
                              {item.asset_type?.prefix ?? item.asset?.asset_tag}
                            </p>
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

        {/* ── Rejection reason ──────────────────────────────────────────────── */}
        {req.rejection_reason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-600">{req.rejection_reason}</p>
          </div>
        )}

        {/* ── Asset Admin — Approval Panel ──────────────────────────────────── */}
        {showApprovalPanel && (
          <ApprovalPanel
            title="Approval Decision"
            reviewingAs={ASSET_ADMIN_ACTOR_ROLE}
            showReturn
            showReject
            showApprove
            rejectLabel="Deny"
            approveLabel="Approve"
            onReturn={(comment)  => handleAdminAction("pending",  comment)}
            onReject={(comment)  => handleAdminAction("rejected", comment)}
            onApprove={(comment) => handleAdminAction("approved", comment)}
            disabled={updateStatus.isPending}
          />
        )}

        {/* ── Asset Admin — Allocate Banner (after approval) ────────────────── */}
        {showAllocateBanner && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 shrink-0">
                <Boxes size={15} className="text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800">Request approved — allocate assets</p>
                <p className="text-xs text-teal-700 mt-0.5">Pick specific assets from the registry to complete this request.</p>
              </div>
            </div>
            <Link
              href={`/admin/assets/allocations/new?requestId=${id}`}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
            >
              Allocate Assets
            </Link>
          </div>
        )}

        {/* ── Allocated confirmation ────────────────────────────────────────── */}
        {req.status === "allocated" && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="mt-0.5 flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 shrink-0">
              <CheckCircle size={15} className="text-teal-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-800">Assets allocated</p>
              <p className="text-xs text-teal-700 mt-0.5">
                {req.allocated_by_name ? `Allocated by ${req.allocated_by_name}` : "Assets have been allocated"}
                {req.allocated_at ? ` on ${formatDate(req.allocated_at)}` : ""}.
              </p>
            </div>
          </div>
        )}

        {/* ── Requester — Mark as Returned (loan only) ──────────────────────── */}
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


      </div>
    </AppLayout>
  );
}
