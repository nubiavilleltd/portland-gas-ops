"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Building2, CreditCard, ShoppingCart, Pencil, Trash2, PowerOff, Power, FileText, Eye, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import VendorDetailSkeleton from "./VendorDetailSkeleton";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useVendor, useDeleteVendor, useDeactivateVendor, useReactivateVendor, VENDOR_ERRORS } from "@/lib/modules/vendors";
import { useProcurementByVendor } from "@/lib/modules/procurement";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, formatCurrency, capitalize } from "@/lib/utils";
import type { VendorCategory, ProcurementListItem } from "@/types";

const CATEGORY_COLOURS: Record<VendorCategory, string> = {
  equipment:     "bg-blue-100 text-blue-700",
  ppe:           "bg-orange-100 text-orange-700",
  technical:     "bg-purple-100 text-purple-700",
  consumables:   "bg-green-100 text-green-700",
  food_beverage: "bg-yellow-100 text-yellow-700",
  services:      "bg-pink-100 text-pink-700",
  it:            "bg-indigo-100 text-indigo-700",
  logistics:     "bg-teal-100 text-teal-700",
};

const AVATAR_COLOURS: Record<VendorCategory, string> = {
  equipment:     "bg-blue-500",
  ppe:           "bg-orange-500",
  technical:     "bg-purple-500",
  consumables:   "bg-green-500",
  food_beverage: "bg-yellow-500",
  services:      "bg-pink-500",
  it:            "bg-indigo-500",
  logistics:     "bg-teal-500",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-brand-border last:border-0">
      <span className="w-36 shrink-0 text-sm text-brand-text-secondary">{label}</span>
      <span className="text-sm text-brand-text-primary font-medium">{value ?? <span className="text-brand-text-secondary font-normal">—</span>}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-brand-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-brand-text-secondary">{icon}</span>
        <h2 className="text-sm font-semibold text-brand-text-primary uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  approved:  "bg-green-50 text-green-700 border border-green-200",
  rejected:  "bg-red-50 text-red-700 border border-red-200",
  returned:  "bg-orange-50 text-orange-700 border border-orange-200",
  po_issued: "bg-blue-50 text-blue-700 border border-blue-200",
};

const REQUEST_COLUMNS: Column<ProcurementListItem>[] = [
  { key: "reference", label: "Reference", render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  { key: "category", label: "Category", render: (v) => v ? <span className="text-sm capitalize">{String(v).replace(/_/g, " ")}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "created_at", label: "Date", render: (v) => <span className="text-brand-text-secondary text-xs">{formatDateTime(v as string)}</span> },
  { key: "estimated_amount", label: "Est. Value", render: (v) => v ? <span className="text-sm font-medium">{formatCurrency(Number(v))}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "status", label: "Status", render: (v) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[String(v)] ?? "bg-gray-100 text-gray-600"}`}>{capitalize(String(v).replace(/_/g, " "))}</span> },
  {
    key: "payment_status",
    label: "Payment",
    render: (_v, row) => {
      const isPaid = row.status === "completed";
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isPaid ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>
          {isPaid ? "Paid" : "Unpaid"}
        </span>
      );
    },
  },
];

export default function AdminVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmReactivate, setConfirmReactivate] = useState(false);
  const { data: vendor, isLoading, isError } = useVendor(id);
  const { data: requests = [], isLoading: reqLoading } = useProcurementByVendor(id);

  const deleteVendor = useDeleteVendor();
  const deactivateVendor = useDeactivateVendor();
  const reactivateVendor = useReactivateVendor();

  if (isLoading) {
    return <AppLayout pageTitle="Admin — Vendors"><VendorDetailSkeleton /></AppLayout>;
  }

  if (isError || !vendor) {
    return <AppLayout pageTitle="Admin — Vendors"><div className="text-center py-20 text-brand-text-secondary">Vendor not found.</div></AppLayout>;
  }

  const catColour = CATEGORY_COLOURS[vendor.category] ?? "bg-gray-100 text-gray-600";
  const avatarColour = AVATAR_COLOURS[vendor.category] ?? "bg-gray-500";

  function handleDelete() {
    deleteVendor.mutate(id, {
      onSuccess: () => { toast.success("Vendor removed"); router.push("/admin/vendors"); },
      onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
    });
  }

  function handleDeactivate() {
    deactivateVendor.mutate(id, {
      onSuccess: () => { toast.success("Vendor deactivated"); setConfirmDeactivate(false); },
      onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
    });
  }

  function handleReactivate() {
    reactivateVendor.mutate(id, {
      onSuccess: () => { toast.success("Vendor reactivated"); setConfirmReactivate(false); },
      onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
    });
  }

  return (
    <AppLayout pageTitle="Admin — Vendors">
      <Link href="/admin/vendors" className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Vendors
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className={`h-14 w-14 rounded-xl shrink-0 flex items-center justify-center overflow-hidden ${vendor.logo_url ? "bg-white border border-brand-border" : `text-white font-bold text-xl ${avatarColour}`}`}>
            {vendor.logo_url
              ? <Image src={vendor.logo_url} alt={vendor.name} width={56} height={56} className="object-contain h-full w-full" />
              : vendor.name.charAt(0).toUpperCase()
            }
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-brand-text-primary">{vendor.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${catColour}`}>{vendor.category.replace(/_/g, " ").toUpperCase()}</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${vendor.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>{capitalize(vendor.status)}</span>
            </div>
            {vendor.vendor_code && (
              <span className="inline-block mt-1 text-xs font-mono bg-gray-100 text-brand-text-secondary px-2 py-0.5 rounded">{vendor.vendor_code}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button href={`/admin/vendors/${id}/edit`} variant="ghost" size="sm" leftIcon={<Pencil size={14} />} title="Edit vendor" />
          {vendor.is_active ? (
            <Button variant="ghost" size="sm" leftIcon={<PowerOff size={14} />} onClick={() => setConfirmDeactivate(true)} title="Deactivate vendor" />
          ) : (
            <Button variant="ghost" size="sm" leftIcon={<Power size={14} />} onClick={() => setConfirmReactivate(true)} title="Reactivate vendor" />
          )}
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} title="Delete vendor" />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to remove "${vendor.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate Vendor"
        message={`Deactivating "${vendor.name}" will hide them from procurement request forms. Existing requests are not affected.`}
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
      />
      <ConfirmDialog
        open={confirmReactivate}
        title="Reactivate Vendor"
        message={`Reactivating "${vendor.name}" will make them available again on procurement request forms.`}
        confirmLabel="Reactivate"
        onConfirm={handleReactivate}
        onCancel={() => setConfirmReactivate(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <SectionCard title="Company Information" icon={<Building2 size={16} />}>
          <DetailRow label="Contact Person" value={vendor.contact_person} />
          <DetailRow label="Phone" value={vendor.phone ? <span className="flex items-center gap-1.5"><Phone size={13} />{vendor.phone}</span> : null} />
          <DetailRow label="Email" value={vendor.email ? <span className="flex items-center gap-1.5"><Mail size={13} />{vendor.email}</span> : null} />
          <DetailRow label="Address" value={vendor.address ? <span className="flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" />{vendor.address}</span> : null} />
          <DetailRow label="Added" value={formatDate(vendor.created_at)} />
        </SectionCard>
        <SectionCard title="Bank Details" icon={<CreditCard size={16} />}>
          <DetailRow label="Bank Name" value={vendor.bank_name} />
          <DetailRow label="Account Name" value={vendor.account_name} />
          <DetailRow label="Account Number" value={vendor.account_number} />
        </SectionCard>
      </div>

      {/* Compliance Documents */}
      <div className="bg-white border border-brand-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-brand-text-secondary"><FileText size={16} /></span>
          <h2 className="text-sm font-semibold text-brand-text-primary uppercase tracking-wide">Compliance Documents</h2>
        </div>
        {vendor.cac_certificate_url || vendor.tin_certificate_url || vendor.vat_certificate_url ? (
          <div className="divide-y divide-brand-border">
            {vendor.cac_certificate_url && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <FileText size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text-primary">CAC Certificate</p>
                    <p className="text-xs text-brand-text-secondary">Corporate Affairs Commission</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={vendor.cac_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={14} /> View
                  </a>
                  <a
                    href={vendor.cac_certificate_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>
            )}
            {vendor.tin_certificate_url && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text-primary">TIN Certificate</p>
                    <p className="text-xs text-brand-text-secondary">Tax Identification Number</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={vendor.tin_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={14} /> View
                  </a>
                  <a
                    href={vendor.tin_certificate_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>
            )}
            {vendor.vat_certificate_url && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text-primary">VAT Certificate</p>
                    <p className="text-xs text-brand-text-secondary">Value Added Tax Registration</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={vendor.vat_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={14} /> View
                  </a>
                  <a
                    href={vendor.vat_certificate_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-brand-text-secondary">This vendor doesn&apos;t have any compliance documents.</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-brand-text-secondary"><ShoppingCart size={16} /></span>
          <h2 className="text-sm font-semibold text-brand-text-primary uppercase tracking-wide">Purchase & Service Requests</h2>
          <span className="ml-auto text-xs text-brand-text-secondary">{requests.length} request{requests.length !== 1 ? "s" : ""}</span>
        </div>
        <DataTable columns={REQUEST_COLUMNS} data={requests} isLoading={reqLoading} rowHref={(row) => `/procurement/${row.id}`} emptyMessage="No requests linked to this vendor" emptyDescription="Purchase and service requests assigned to this vendor will appear here." searchable={false} />
      </div>
    </AppLayout>
  );
}
