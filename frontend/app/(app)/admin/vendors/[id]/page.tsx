"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Building2, CreditCard, ShoppingCart, Pencil, Trash2, PowerOff, Power } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useVendor, useDeleteVendor, useDeactivateVendor, useReactivateVendor } from "@/hooks/useVendors";
import { useProcurementByVendor } from "@/hooks/useProcurement";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import type { VendorCategory, ProcurementRequest, PaymentStatus } from "@/types";

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

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  unpaid:    "bg-red-50 text-red-700 border border-red-200",
  part_paid: "bg-amber-50 text-amber-700 border border-amber-200",
  paid:      "bg-green-50 text-green-700 border border-green-200",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid", part_paid: "Part Paid", paid: "Paid",
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

const REQUEST_COLUMNS: Column<ProcurementRequest>[] = [
  { key: "reference", label: "Reference", render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  { key: "category", label: "Category", render: (v) => <span className="capitalize text-sm">{String(v).replace(/_/g, " ")}</span> },
  { key: "created_at", label: "Date", render: (v) => <span className="text-brand-text-secondary text-xs">{formatDate(v as string)}</span> },
  { key: "items", label: "Total Value", render: (_, row) => { const total = row.items.reduce((sum, item) => sum + item.total_cost, 0); return <span className="text-sm font-medium">{formatCurrency(total)}</span>; } },
  { key: "payment_status", label: "Payment", render: (v) => { const ps = v as PaymentStatus; return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_BADGE[ps] ?? ""}`}>{PAYMENT_LABELS[ps] ?? String(v)}</span>; } },
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
    return <AppLayout pageTitle="Admin — Vendors"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;
  }

  if (isError || !vendor) {
    return <AppLayout pageTitle="Admin — Vendors"><div className="text-center py-20 text-brand-text-secondary">Vendor not found.</div></AppLayout>;
  }

  const catColour = CATEGORY_COLOURS[vendor.category] ?? "bg-gray-100 text-gray-600";
  const avatarColour = AVATAR_COLOURS[vendor.category] ?? "bg-gray-500";

  function handleDelete() {
    deleteVendor.mutate(id, {
      onSuccess: () => { toast.success("Vendor removed"); router.push("/admin/vendors"); },
      onError: () => toast.error("Failed to delete vendor"),
    });
  }

  function handleDeactivate() {
    deactivateVendor.mutate(id, {
      onSuccess: () => { toast.success("Vendor deactivated"); setConfirmDeactivate(false); },
      onError: () => toast.error("Failed to deactivate vendor"),
    });
  }

  function handleReactivate() {
    reactivateVendor.mutate(id, {
      onSuccess: () => { toast.success("Vendor reactivated"); setConfirmReactivate(false); },
      onError: () => toast.error("Failed to reactivate vendor"),
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
          <Button href={`/admin/vendors/${id}/edit`} variant="ghost" size="sm" leftIcon={<Pencil size={14} />} />
          {vendor.is_active ? (
            <Button variant="ghost" size="sm" leftIcon={<PowerOff size={14} />} onClick={() => setConfirmDeactivate(true)} title="Deactivate vendor" />
          ) : (
            <Button variant="ghost" size="sm" leftIcon={<Power size={14} />} onClick={() => setConfirmReactivate(true)} title="Reactivate vendor" />
          )}
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} />
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
