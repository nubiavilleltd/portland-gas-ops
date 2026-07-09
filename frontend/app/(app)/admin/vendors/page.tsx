"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
// import { useRouter } from "next/navigation";
import { Plus, Pencil, PowerOff, Power } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import { useVendors, useDeactivateVendor, useReactivateVendor, VENDOR_ERRORS } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { capitalize } from "@/lib/utils";
import type { Vendor, VendorCategory } from "@/types";

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

/* ── Card view (commented out — kept for future use) ───────────────────────────
function VendorCard({ vendor, onDelete }: { vendor: Vendor; onDelete: (v: Vendor) => void }) {
  const router = useRouter();
  const catColour = CATEGORY_COLOURS[vendor.category] ?? "bg-gray-100 text-gray-600";
  const avatarColour = AVATAR_COLOURS[vendor.category] ?? "bg-gray-500";

  return (
    <div
      onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
      className="bg-white border border-brand-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3 group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden ${vendor.logo_url ? "bg-white border border-brand-border" : `text-white font-semibold text-sm ${avatarColour}`}`}>
          {vendor.logo_url
            ? <Image src={vendor.logo_url} alt={vendor.name} width={40} height={40} className="object-contain h-full w-full" />
            : vendor.name.charAt(0).toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-brand-text-primary leading-tight truncate group-hover:text-brand-purple transition-colors">{vendor.name}</p>
              {vendor.vendor_code && (
                <span className="inline-block mt-0.5 text-[10px] font-mono bg-gray-100 text-brand-text-secondary px-1.5 py-0.5 rounded">{vendor.vendor_code}</span>
              )}
            </div>
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${catColour}`}>
              {capitalize(vendor.category.replace(/_/g, " "))}
            </span>
          </div>
          {vendor.contact_person && <p className="text-xs text-brand-text-secondary mt-0.5">{vendor.contact_person}</p>}
        </div>
      </div>
      <div className="space-y-1 text-xs text-brand-text-secondary">
        {vendor.phone && <div className="flex items-center gap-1.5"><Phone size={11} />{vendor.phone}</div>}
        {vendor.email && <div className="flex items-center gap-1.5"><Mail size={11} />{vendor.email}</div>}
        {vendor.address && <div className="flex items-start gap-1.5"><MapPin size={11} className="mt-0.5 shrink-0" />{vendor.address}</div>}
      </div>
      {(vendor.bank_name || vendor.account_name || vendor.account_number) && (
        <div className="space-y-1 text-xs text-brand-text-secondary border-t border-brand-border pt-2">
          {vendor.bank_name && <div className="flex items-center gap-1.5"><span className="text-brand-text-secondary">Bank:</span><span className="font-medium text-brand-text-primary">{vendor.bank_name}</span></div>}
          {vendor.account_name && <div className="flex items-center gap-1.5"><span className="text-brand-text-secondary">Name:</span><span className="font-medium text-brand-text-primary">{vendor.account_name}</span></div>}
          {vendor.account_number && <div className="flex items-center gap-1.5"><span className="text-brand-text-secondary">Acct:</span><span className="font-mono font-medium text-brand-text-primary">{vendor.account_number}</span></div>}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-brand-border">
        <Link href={`/admin/vendors/${vendor.id}/edit`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-purple transition-colors px-2 py-1 rounded hover:bg-purple-50">
          <Pencil size={12} /> Edit
        </Link>
        <button onClick={(e) => { e.stopPropagation(); onDelete(vendor); }} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}
────────────────────────────────────────────────────────────────────────────── */

const TABLE_COLUMNS: Column<Vendor>[] = [
  {
    key: "name",
    label: "Vendor",
    render: (_, v) => {
      const ac = AVATAR_COLOURS[v.category] ?? "bg-gray-500";
      return (
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden ${v.logo_url ? "bg-white border border-brand-border" : `text-white font-semibold text-xs ${ac}`}`}>
            {v.logo_url
              ? <Image src={v.logo_url} alt={v.name} width={32} height={32} className="object-contain h-full w-full" />
              : v.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-brand-text-primary">{v.name}</span>
              {!v.is_active && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
            </div>
            {v.vendor_code && <p className="text-xs font-mono text-brand-text-secondary">{v.vendor_code}</p>}
          </div>
        </div>
      );
    },
  },
  { key: "category", label: "Category", render: (_, v) => { const cc = CATEGORY_COLOURS[v.category] ?? "bg-gray-100 text-gray-600"; return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cc}`}>{v.category.replace(/_/g, " ").toUpperCase()}</span>; } },
  { key: "contact_person", label: "Contact", render: (_, v) => v.contact_person ? <span className="text-sm text-brand-text-primary">{v.contact_person}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "phone", label: "Phone", render: (_, v) => v.phone ? <span className="text-sm text-brand-text-primary">{v.phone}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "email", label: "Email", render: (_, v) => v.email ? <span className="text-sm text-brand-text-primary">{v.email}</span> : <span className="text-brand-text-secondary">—</span> },
];

export default function AdminVendorsPage() {
  const toast = useToast();
  const [deactivateTarget, setDeactivateTarget] = useState<Vendor | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Vendor | null>(null);

  const { data: vendors = [], isLoading, isError } = useVendors(undefined, true);
  const deactivateVendor = useDeactivateVendor();
  const reactivateVendor = useReactivateVendor();

  function handleDeactivate() {
    if (!deactivateTarget) return;
    deactivateVendor.mutate(deactivateTarget.id, {
      onSuccess: () => { toast.success("Vendor deactivated"); setDeactivateTarget(null); },
      onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
    });
  }

  function handleReactivate() {
    if (!reactivateTarget) return;
    reactivateVendor.mutate(reactivateTarget.id, {
      onSuccess: () => { toast.success("Vendor reactivated"); setReactivateTarget(null); },
      onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
    });
  }

  const tableActions: DataTableAction<Vendor>[] = [
    {
      key: "row-actions",
      label: "",
      render: (v) => (
        <div className="flex items-center gap-1">
          <a
            href={`/admin/vendors/${v.id}/edit`}
            title="Edit vendor"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </a>
          {v.is_active ? (
            <button
              type="button"
              title="Deactivate vendor"
              onClick={(e) => { e.stopPropagation(); setDeactivateTarget(v); }}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <PowerOff size={14} />
            </button>
          ) : (
            <button
              type="button"
              title="Reactivate vendor"
              onClick={(e) => { e.stopPropagation(); setReactivateTarget(v); }}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-brand-text-secondary hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer"
            >
              <Power size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Admin — Vendors">
      <PageHeader
        title="Vendors"
        description="Manage suppliers and service providers"
        action={
          <Link href="/admin/vendors/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors whitespace-nowrap">
            <Plus size={16} /> Add Vendor
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : isError ? (
        <div className="text-center py-20 text-brand-text-secondary">Failed to load vendors.</div>
      ) : (
        <DataTable
          columns={TABLE_COLUMNS}
          data={vendors}
          searchPlaceholder="Search vendors…"
          emptyMessage="No vendors found."
          emptyDescription="Add your first vendor to get started."
          rowHref={(v) => `/admin/vendors/${v.id}`}
          showActions
          actions={tableActions}
        />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Vendor"
        message={`Deactivating "${deactivateTarget?.name}" will hide them from procurement request forms. Existing requests are not affected.`}
        confirmLabel="Deactivate"
        destructive
        loading={deactivateVendor.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
      <ConfirmDialog
        open={!!reactivateTarget}
        title="Reactivate Vendor"
        message={`Reactivating "${reactivateTarget?.name}" will make them available again on procurement request forms.`}
        confirmLabel="Reactivate"
        loading={reactivateVendor.isPending}
        onConfirm={handleReactivate}
        onCancel={() => setReactivateTarget(null)}
      />
    </AppLayout>
  );
}
