"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, FileText, Download, ChevronDown, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getErrorMessage } from "@/lib/errors";
import { PROCUREMENT_ERRORS } from "@/lib/modules/procurement";
import {
  useProcurement,
  useApproveProcurement,
  useRejectProcurement,
  useReturnProcurement,
  useIssuePO,
  useUpdatePOStatus,
} from "@/lib/modules/procurement";
import { useVendors } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import type { ProcurementStatus } from "@/types";

// ── Status badge colours ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProcurementStatus, string> = {
  draft:     "Draft",
  pending:   "Pending Approval",
  approved:  "Approved",
  rejected:  "Rejected",
  returned:  "Returned",
  po_issued: "PO Issued",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProcurementDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useToast();

  const { data: req, isLoading, isError } = useProcurement(id);
  const approveRequest = useApproveProcurement();
  const rejectRequest  = useRejectProcurement();
  const returnRequest  = useReturnProcurement();
  const issuePO        = useIssuePO();
  const updatePOStatus = useUpdatePOStatus();

  const { data: vendors = [] } = useVendors();

  // PO issue state
  const [poVendorId,     setPoVendorId]     = useState("");
  const [poNotes,        setPoNotes]        = useState("");
  const [poVendorSearch, setPoVendorSearch] = useState("");
  const [poDropdownOpen, setPoDropdownOpen] = useState(false);
  const [poVendorName,   setPoVendorName]   = useState("");

  // Approval / rejection state
  const [actionModal,   setActionModal]   = useState<"approve" | "reject" | "return" | null>(null);
  const [actionComment, setActionComment] = useState("");

  function raiserName() {
    if (!req?.raiser?.user) return "—";
    const { first_name, last_name } = req.raiser.user;
    return [first_name, last_name].filter(Boolean).join(" ") || req.raiser.user.email;
  }

  const grandTotal = req?.items.reduce(
    (sum, item) => sum + (Number(item.total_price) || 0),
    0
  ) ?? 0;

  async function handleAction(action: "approve" | "reject" | "return") {
    if (!req) return;
    const comment = actionComment || undefined;
    try {
      if (action === "approve") {
        await approveRequest.mutateAsync({ id, comment });
        toast.success("Request approved");
      } else if (action === "reject") {
        await rejectRequest.mutateAsync({ id, comment });
        toast.success("Request rejected");
      } else {
        await returnRequest.mutateAsync({ id, comment });
        toast.success("Returned to requester for revision");
      }
      setActionModal(null);
      setActionComment("");
    } catch (err) {
      toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
    }
  }

  async function handleIssuePO() {
    try {
      await issuePO.mutateAsync({
        id,
        data: {
          vendor_id: poVendorId || undefined,
          notes:     poNotes   || undefined,
        },
      });
      toast.success("Purchase Order issued");
      setPoVendorId("");
      setPoVendorName("");
      setPoNotes("");
    } catch (err) {
      toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
    }
  }

  async function handlePOStatus(poId: string, status: "delivered" | "cancelled") {
    try {
      await updatePOStatus.mutateAsync({ poId, status });
      toast.success(`PO marked as ${status}`);
    } catch (err) {
      toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
    }
  }

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(poVendorSearch.toLowerCase())
  );

  const isBusy =
    approveRequest.isPending ||
    rejectRequest.isPending  ||
    returnRequest.isPending  ||
    issuePO.isPending;

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

  return (
    <AppLayout pageTitle="Procurement">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Procurement
        </button>
      </div>

      {/* ── Header card ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-brand-border rounded-2xl px-6 py-5 mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-1">
            Purchase &amp; Service Request
          </p>
          <h1 className="text-2xl font-bold text-brand-text-primary">{req.reference}</h1>
          {req.category && (
            <p className="text-sm text-brand-text-secondary mt-0.5">
              {capitalize(req.category.replace(/_/g, " "))}
            </p>
          )}
          <p className="text-xs text-brand-text-secondary mt-1">
            {STATUS_LABELS[req.status] ?? req.status} · Raised {formatDate(req.created_at)}
          </p>
        </div>
        <div className="shrink-0 pt-1 flex flex-col items-end gap-2">
          <ApprovalBadge status={req.status} />
          {req.status === "returned" && (
            <button
              onClick={() => router.push(`/procurement/new?edit=${id}`)}
              className="px-4 py-2 text-xs font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              Edit &amp; Resubmit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Requester Details ─────────────────────────────────────────────── */}
        <FormSection
          title="Requester Details"
          description="Employee information for the person who raised this request."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Requester Name" value={raiserName()}                    disabled />
            <FormInput label="Department"     value={req.raiser?.department  ?? "—"} disabled />
            <FormInput label="Job Title / Role" value={req.raiser?.job_title ?? "—"} disabled />
            <FormInput label="Request Date"   value={formatDate(req.created_at)}      disabled />
          </div>
        </FormSection>

        {/* ── Request Details ───────────────────────────────────────────────── */}
        <FormSection
          title="Request Details"
          description="Core information about this procurement request."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput label="Reference"   value={req.reference}                                           disabled />
            <FormInput label="Category"    value={req.category ? capitalize(req.category.replace(/_/g, " ")) : "—"} disabled />
            <FormInput label="Required By" value={req.required_by ? formatDate(req.required_by) : "—"}    disabled />
            {req.estimated_amount != null && (
              <FormInput
                label="Estimated Amount"
                value={formatCurrency(Number(req.estimated_amount))}
                disabled
              />
            )}
          </div>
          {req.description && (
            <FormTextarea
              label="Justification / Purpose"
              value={req.description}
              rows={3}
              disabled
            />
          )}
        </FormSection>

        {/* ── Line Items ────────────────────────────────────────────────────── */}
        <FormSection title="Line Items">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-6 py-3 text-left   text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit</th>
                  <th className="px-4 py-3 text-right  text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit Cost</th>
                  <th className="px-6 py-3 text-right  text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3.5 text-brand-text-primary">{item.description}</td>
                    <td className="px-4 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-center text-brand-text-secondary">{item.unit ?? "—"}</td>
                    <td className="px-4 py-3.5 text-right text-brand-text-secondary">
                      {item.unit_price != null ? formatCurrency(Number(item.unit_price)) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-brand-text-primary">
                      {item.total_price != null ? formatCurrency(Number(item.total_price)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {grandTotal > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-brand-border bg-gray-50/60">
                    <td colSpan={4} className="px-6 py-3.5 text-sm font-semibold text-brand-text-secondary text-right">Estimated Total</td>
                    <td className="px-6 py-3.5 text-right font-bold text-brand-purple text-base">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </FormSection>

        {/* ── Supporting Document ───────────────────────────────────────────── */}
        {req.attachment && (
          <FormSection title="Supporting Document" description="Attachment submitted with this request.">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-gray-50/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Document Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Size</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4 text-brand-text-primary font-medium">{req.attachment.name}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {req.attachment.mime_type
                          ? req.attachment.mime_type === "application/pdf" ? "PDF"
                          : req.attachment.mime_type.includes("word") ? "Word"
                          : req.attachment.mime_type.includes("excel") || req.attachment.mime_type.includes("spreadsheet") ? "Excel"
                          : req.attachment.mime_type.startsWith("image/") ? "Image"
                          : "File"
                          : "File"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-brand-text-secondary">
                      {req.attachment.file_size != null
                        ? req.attachment.file_size >= 1024 * 1024
                          ? `${(req.attachment.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(req.attachment.file_size / 1024)} KB`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={req.attachment.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-purple hover:underline"
                      >
                        <Download size={12} /> Open
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FormSection>
        )}

        {/* ── Preferred Vendor ──────────────────────────────────────────────── */}
        {req.vendor && (
          <FormSection title="Preferred Vendor">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Vendor Name"     value={req.vendor.name}                         disabled />
              {req.vendor.contact_person && <FormInput label="Contact Person" value={req.vendor.contact_person} disabled />}
              {req.vendor.address        && <FormInput label="Address"        value={req.vendor.address}        disabled />}
              {req.vendor.phone          && <FormInput label="Phone"          value={req.vendor.phone}          disabled />}
              {req.vendor.email          && <FormInput label="Email"          value={req.vendor.email}          disabled />}
              {req.vendor.bank_name      && <FormInput label="Bank"           value={req.vendor.bank_name}      disabled />}
              {req.vendor.account_name   && <FormInput label="Account Name"   value={req.vendor.account_name}   disabled />}
              {req.vendor.account_number && <FormInput label="Account Number" value={req.vendor.account_number} disabled />}
            </div>
          </FormSection>
        )}

        {/* ── Purchase Orders ───────────────────────────────────────────────── */}
        {req.purchase_orders.length > 0 && (
          <FormSection title="Purchase Orders">
            <div className="space-y-3">
              {req.purchase_orders.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-brand-border">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-brand-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text-primary">{p.po_number}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {capitalize(p.status)} · Issued {formatDate(p.issued_at)}
                      {p.vendor && ` · ${p.vendor.name}`}
                      {p.total_amount && ` · ${formatCurrency(Number(p.total_amount))}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === "issued"    ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      p.status === "delivered" ? "bg-green-50 text-green-700 border border-green-200" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {capitalize(p.status)}
                    </span>
                    {p.status === "issued" && (
                      <button
                        onClick={() => handlePOStatus(p.id, "delivered")}
                        disabled={updatePOStatus.isPending}
                        className="text-xs text-brand-purple hover:underline disabled:opacity-50"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {p.document_id && (
                      <a
                        href={`/api/documents/${p.document_id}/download`}
                        className="flex items-center gap-1 text-xs text-brand-purple hover:underline"
                      >
                        <Download size={12} /> Download PO
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* ── Pending → Approve / Reject / Return ──────────────────────────── */}
        {req.status === "pending" && (
          <FormSection title="Approval Decision">
            <p className="text-sm text-brand-text-secondary mb-4">
              Review the request details above and make your decision.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActionModal("approve")}
                disabled={isBusy}
                className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => setActionModal("return")}
                disabled={isBusy}
                className="px-5 py-2.5 text-sm font-medium border border-amber-300 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-60"
              >
                Return for Revision
              </button>
              <button
                onClick={() => setActionModal("reject")}
                disabled={isBusy}
                className="px-5 py-2.5 text-sm font-medium border border-red-300 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </FormSection>
        )}

        {/* ── Approved → Issue PO ───────────────────────────────────────────── */}
        {req.status === "approved" && (
          <FormSection title="Issue Purchase Order" description="Select a vendor and issue a PO for this approved request.">
            {/* Vendor picker */}
            <div className="relative">
              <label className="block text-xs font-medium text-brand-text-secondary mb-1.5">Vendor</label>
              {poVendorName ? (
                <div className="flex items-center justify-between h-10 px-3 rounded-lg border border-brand-border bg-white text-sm">
                  <span>{poVendorName}</span>
                  <button
                    type="button"
                    onClick={() => { setPoVendorId(""); setPoVendorName(""); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    className="flex items-center h-10 px-3 rounded-lg border border-brand-border bg-white gap-2 cursor-text"
                    onClick={() => setPoDropdownOpen(true)}
                  >
                    <input
                      type="text"
                      placeholder="Search vendors…"
                      value={poVendorSearch}
                      onChange={(e) => { setPoVendorSearch(e.target.value); setPoDropdownOpen(true); }}
                      onFocus={() => setPoDropdownOpen(true)}
                      className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                    />
                    <ChevronDown size={14} className="text-gray-400 shrink-0" />
                  </div>
                  {poDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPoDropdownOpen(false)} />
                      <div className="absolute z-20 top-full mt-1 w-full bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden">
                        {filteredVendors.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-brand-text-secondary">No vendors found</div>
                        ) : (
                          <ul className="max-h-48 overflow-y-auto">
                            {filteredVendors.map((v) => (
                              <li key={v.id}>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors"
                                  onClick={() => {
                                    setPoVendorId(v.id);
                                    setPoVendorName(v.name);
                                    setPoDropdownOpen(false);
                                    setPoVendorSearch("");
                                  }}
                                >
                                  <span className="font-medium">{v.name}</span>
                                  <span className="ml-2 text-xs text-brand-text-secondary capitalize">
                                    {v.category.replace(/_/g, " ")}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-text-secondary mb-1.5">Notes (optional)</label>
              <textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Net 30 payment terms"
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleIssuePO}
                disabled={isBusy || !poVendorId}
                className="px-5 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
              >
                {issuePO.isPending ? "Issuing PO…" : "Issue Purchase Order"}
              </button>
            </div>
          </FormSection>
        )}

      </div>

      {/* ── Approval action modal ─────────────────────────────────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary mb-2">
              {actionModal === "approve" && "Approve Request"}
              {actionModal === "reject"  && "Reject Request"}
              {actionModal === "return"  && "Return for Revision"}
            </h3>
            <p className="text-sm text-brand-text-secondary mb-4">
              {actionModal === "approve" && "Confirm that you are approving this procurement request."}
              {actionModal === "reject"  && "This will reject the request. The requester will be notified."}
              {actionModal === "return"  && "The request will be sent back to the requester for revision."}
            </p>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder="Comment (optional)"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActionModal(null); setActionComment(""); }}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionModal)}
                disabled={isBusy}
                className={
                  actionModal === "reject"
                    ? "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                    : "px-4 py-2 text-sm font-medium text-white bg-brand-purple rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
                }
              >
                {isBusy ? "Processing…" : (
                  actionModal === "approve" ? "Approve" :
                  actionModal === "reject"  ? "Reject"  : "Return"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
