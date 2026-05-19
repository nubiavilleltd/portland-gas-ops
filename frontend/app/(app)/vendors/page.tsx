"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Building2, Phone, Mail, MapPin } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@/hooks/useVendors";
import { useToast } from "@/hooks/useToast";
import { capitalize } from "@/lib/utils";
import type { Vendor, VendorCategory } from "@/types";

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "equipment",     label: "Equipment" },
  { value: "ppe",           label: "PPE" },
  { value: "technical",     label: "Technical" },
  { value: "consumables",   label: "Consumables" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "services",      label: "Services" },
  { value: "it",            label: "IT" },
  { value: "logistics",     label: "Logistics" },
];

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

const EMPTY_FORM = {
  name: "",
  category: "" as VendorCategory | "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  bank_name: "",
  account_name: "",
  account_number: "",
};

type FormData = typeof EMPTY_FORM;

// ── Vendor form (shared by add + edit) ─────────────────────────────────────────
function VendorFormModal({
  initial,
  onClose,
  onSubmit,
  loading,
  title,
}: {
  initial: FormData;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  title: string;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Vendor name is required";
    if (!form.category) e.category = "Category is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-border px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-text-primary">{title}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info */}
          <section>
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Vendor Name <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Persianas Furniture Limited"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Contact Person</label>
                <input
                  value={form.contact_person}
                  onChange={(e) => set("contact_person", e.target.value)}
                  placeholder="e.g. Emeka Okafor"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+234 (0) 800 000 0000"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street, City, State"
                  rows={2}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Bank details */}
          <section>
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-3">Bank Details <span className="font-normal normal-case">(optional)</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Bank Name</label>
                <input
                  value={form.bank_name}
                  onChange={(e) => set("bank_name", e.target.value)}
                  placeholder="e.g. GTBank"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Account Name</label>
                <input
                  value={form.account_name}
                  onChange={(e) => set("account_name", e.target.value)}
                  placeholder="Account holder name"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">Account Number</label>
                <input
                  value={form.account_number}
                  onChange={(e) => set("account_number", e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vendor card ─────────────────────────────────────────────────────────────────
function VendorCard({
  vendor,
  onEdit,
  onDelete,
}: {
  vendor: Vendor;
  onEdit: (v: Vendor) => void;
  onDelete: (v: Vendor) => void;
}) {
  const catColour = CATEGORY_COLOURS[vendor.category] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white border border-brand-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-text-primary leading-tight">{vendor.name}</p>
          {vendor.contact_person && (
            <p className="text-xs text-brand-text-secondary mt-0.5">{vendor.contact_person}</p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${catColour}`}>
          {capitalize(vendor.category.replace(/_/g, " "))}
        </span>
      </div>

      {/* Contact details */}
      <div className="space-y-1 text-xs text-brand-text-secondary">
        {vendor.phone && (
          <div className="flex items-center gap-1.5"><Phone size={11} />{vendor.phone}</div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-1.5"><Mail size={11} />{vendor.email}</div>
        )}
        {vendor.address && (
          <div className="flex items-start gap-1.5"><MapPin size={11} className="mt-0.5 shrink-0" />{vendor.address}</div>
        )}
      </div>

      {/* Bank details */}
      {vendor.bank_name && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-brand-text-secondary space-y-0.5">
          <p className="font-medium text-brand-text-primary">{vendor.bank_name}</p>
          {vendor.account_name && <p>{vendor.account_name}</p>}
          {vendor.account_number && <p className="font-mono">{vendor.account_number}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-brand-border">
        <button
          onClick={() => onEdit(vendor)}
          className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-purple transition-colors px-2 py-1 rounded hover:bg-purple-50"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={() => onDelete(vendor)}
          className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const { data: vendors = [], isLoading, isError } = useVendors(search || undefined);
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor(editTarget?.id ?? "");
  const deleteVendor = useDeleteVendor();

  function handleCreate(form: FormData) {
    createVendor.mutate(
      { ...form, category: form.category as VendorCategory },
      {
        onSuccess: () => { toast.success("Vendor added"); setShowForm(false); },
        onError: () => toast.error("Failed to add vendor"),
      }
    );
  }

  function handleUpdate(form: FormData) {
    if (!editTarget) return;
    updateVendor.mutate(
      { ...form, category: form.category as VendorCategory },
      {
        onSuccess: () => { toast.success("Vendor updated"); setEditTarget(null); },
        onError: () => toast.error("Failed to update vendor"),
      }
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteVendor.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Vendor removed"); setDeleteTarget(null); },
      onError: () => toast.error("Failed to delete vendor"),
    });
  }

  const editInitial: FormData = editTarget
    ? {
        name: editTarget.name ?? "",
        category: editTarget.category ?? "",
        contact_person: editTarget.contact_person ?? "",
        phone: editTarget.phone ?? "",
        email: editTarget.email ?? "",
        address: editTarget.address ?? "",
        bank_name: editTarget.bank_name ?? "",
        account_name: editTarget.account_name ?? "",
        account_number: editTarget.account_number ?? "",
      }
    : EMPTY_FORM;

  return (
    <AppLayout pageTitle="Vendors">
      <PageHeader
        title="Vendors"
        description="Manage suppliers and service providers"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
          >
            <Plus size={16} /> Add Vendor
          </button>
        }
      />

      {/* Search */}
      <div className="mb-6 relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors…"
          className="w-full pl-9 pr-4 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : isError ? (
        <div className="text-center py-20 text-brand-text-secondary">Failed to load vendors.</div>
      ) : vendors.length === 0 ? (
        <EmptyState
          title={search ? "No vendors match your search" : "No vendors yet"}
          description={search ? "Try a different search term" : "Add your first vendor to get started"}
          action={
            !search ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
              >
                Add Vendor
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-xs text-brand-text-secondary mb-4">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <VendorCard
                key={v.id}
                vendor={v}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </>
      )}

      {/* Add modal */}
      {showForm && (
        <VendorFormModal
          title="Add New Vendor"
          initial={EMPTY_FORM}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
          loading={createVendor.isPending}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <VendorFormModal
          title="Edit Vendor"
          initial={editInitial}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          loading={updateVendor.isPending}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Vendor"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
