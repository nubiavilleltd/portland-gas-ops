"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Wrench,
  Plus,
  ClipboardList,
  Car,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useAsset, useUpdateAsset, useDeleteAsset, useMaintenanceLogs, useCreateMaintenanceLog, useAssetCategories } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate, capitalize } from "@/lib/utils";
import type { AssetMaintenanceLog, MaintenanceType } from "@/types";

// ── Options ────────────────────────────────────────────────────────────────────

const conditionOptions = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "under_maintenance", label: "Under Maintenance" },
  { value: "decommissioned", label: "Decommissioned" },
];

const maintenanceTypeOptions = [
  { value: "routine", label: "Routine Service" },
  { value: "inspection", label: "Inspection" },
  { value: "calibration", label: "Calibration" },
  { value: "repair", label: "Repair" },
];

const frequencyOptions = [
  { value: "1", label: "Every month" },
  { value: "3", label: "Every 3 months" },
  { value: "6", label: "Every 6 months" },
  { value: "12", label: "Every year" },
  { value: "24", label: "Every 2 years" },
];

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  in_use: "bg-blue-100 text-blue-700",
  under_maintenance: "bg-amber-100 text-amber-700",
  decommissioned: "bg-gray-100 text-gray-500",
};

const CONDITION_STYLES: Record<string, string> = {
  new: "bg-purple-100 text-purple-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

// ── Edit Modal ─────────────────────────────────────────────────────────────────

interface EditModalProps {
  asset: {
    id: string;
    name: string;
    category_id: string | null;
    serial_number: string | null;
    purchase_date: string | null;
    purchase_cost: number | null;
    condition: string;
    status: string;
    total_quantity: number;
    low_stock_threshold: number;
    assigned_to: string | null;
    description: string | null;
    maintenance_type: string | null;
    maintenance_frequency_months: number | null;
  };
  categoryOptions: { value: string; label: string }[];
  onClose: () => void;
}

function EditModal({ asset, categoryOptions, onClose }: EditModalProps) {
  const toast = useToast();
  const updateAsset = useUpdateAsset(asset.id);

  const [form, setForm] = useState({
    name: asset.name,
    category_id: asset.category_id ?? "",
    serial_number: asset.serial_number ?? "",
    purchase_date: asset.purchase_date ?? "",
    purchase_cost: asset.purchase_cost !== null ? String(asset.purchase_cost) : "",
    condition: asset.condition,
    status: asset.status,
    total_quantity: String(asset.total_quantity),
    low_stock_threshold: String(asset.low_stock_threshold),
    assigned_to: asset.assigned_to ?? "",
    description: asset.description ?? "",
    maintenance_type: asset.maintenance_type ?? "",
    maintenance_frequency_months: asset.maintenance_frequency_months ? String(asset.maintenance_frequency_months) : "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Asset name is required");
      return;
    }
    try {
      await updateAsset.mutateAsync({
        data: {
          name: form.name,
          category_id: form.category_id || undefined,
          serial_number: form.serial_number || undefined,
          purchase_date: form.purchase_date || undefined,
          purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : undefined,
          condition: form.condition as import("@/types").AssetCondition,
          status: form.status as import("@/types").AssetStatus,
          total_quantity: parseInt(form.total_quantity) || 1,
          low_stock_threshold: parseInt(form.low_stock_threshold) || 1,
          assigned_to: form.assigned_to || undefined,
          description: form.description || undefined,
          maintenance_type: (form.maintenance_type || undefined) as import("@/types").MaintenanceType | undefined,
          maintenance_frequency_months: form.maintenance_frequency_months ? parseInt(form.maintenance_frequency_months) : undefined,
        },
        image: imageFile,
      });
      toast.success("Asset updated successfully");
      onClose();
    } catch {
      toast.error("Failed to update asset");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl sticky top-0">
          <h3 className="text-base font-semibold text-brand-text-primary">Edit Asset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Asset name"
              className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"
              >
                <option value="">No category</option>
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Serial Number</label>
              <input
                value={form.serial_number}
                onChange={(e) => set("serial_number", e.target.value)}
                placeholder="Serial number"
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => set("condition", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"
              >
                {conditionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Purchase Date</label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => set("purchase_date", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Purchase Cost (NGN)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.purchase_cost}
                onChange={(e) => set("purchase_cost", e.target.value)}
                placeholder="0.00"
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Total Quantity</label>
              <input
                type="number"
                min="1"
                value={form.total_quantity}
                onChange={(e) => set("total_quantity", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Low Stock Threshold</label>
              <input
                type="number"
                min="1"
                value={form.low_stock_threshold}
                onChange={(e) => set("low_stock_threshold", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Assigned To</label>
            <input
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
              placeholder="e.g. IT Department"
              className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Asset description…"
              className="rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
            />
          </div>

          {/* Maintenance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Maintenance Type</label>
              <select
                value={form.maintenance_type}
                onChange={(e) => set("maintenance_type", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"
              >
                <option value="">None</option>
                {maintenanceTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Frequency</label>
              <select
                value={form.maintenance_frequency_months}
                onChange={(e) => set("maintenance_frequency_months", e.target.value)}
                disabled={!form.maintenance_type}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white disabled:opacity-50"
              >
                <option value="">Not set</option>
                {frequencyOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Replace Image</label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-brand-border" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-brand-border rounded-lg cursor-pointer hover:border-brand-purple hover:bg-purple-50/30 transition-colors w-fit">
                <span className="text-sm text-brand-text-secondary">Choose image (PNG/JPG/WebP, max 5 MB)</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setImageFile(f);
                      setImagePreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-gray-50/50 sticky bottom-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateAsset.isPending}
            className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {updateAsset.isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log Maintenance Modal ──────────────────────────────────────────────────────

interface LogMaintenanceModalProps {
  assetId: string;
  onClose: () => void;
}

function LogMaintenanceModal({ assetId, onClose }: LogMaintenanceModalProps) {
  const toast = useToast();
  const createLog = useCreateMaintenanceLog(assetId);

  const [form, setForm] = useState({
    performed_date: new Date().toISOString().split("T")[0],
    maintenance_type: "routine" as MaintenanceType,
    technician: "",
    cost: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.performed_date) {
      toast.error("Date performed is required");
      return;
    }
    try {
      await createLog.mutateAsync({
        performed_date: form.performed_date,
        maintenance_type: form.maintenance_type,
        technician: form.technician || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        notes: form.notes || undefined,
      });
      toast.success("Maintenance log added");
      onClose();
    } catch {
      toast.error("Failed to save maintenance log");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <h3 className="text-base font-semibold text-brand-text-primary">Log Maintenance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">
                Date Performed <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.performed_date}
                onChange={(e) => set("performed_date", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text-primary">Type</label>
              <select
                value={form.maintenance_type}
                onChange={(e) => set("maintenance_type", e.target.value)}
                className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"
              >
                {maintenanceTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Technician / Company</label>
            <input
              value={form.technician}
              onChange={(e) => set("technician", e.target.value)}
              placeholder="e.g. ABC Services Ltd"
              autoCapitalize="none"
              autoCorrect="off"
              className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Cost (NGN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="0.00"
              className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-text-primary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="What was done, parts replaced, observations…"
              className="rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-gray-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={createLog.isPending}
            className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {createLog.isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              "Save Log"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();

  const { data: asset, isLoading, isError } = useAsset(id);
  const deleteAsset = useDeleteAsset();
  const { data: logs = [] } = useMaintenanceLogs(id);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "maintenance">("details");

  async function handleDelete() {
    try {
      await deleteAsset.mutateAsync(id);
      toast.success("Asset deleted");
      router.push("/assets");
    } catch {
      toast.error("Failed to delete asset");
    }
    setDeleteOpen(false);
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (isError || !asset) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Asset not found or you don&apos;t have access.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  const categoryOptions = asset.category
    ? [{ value: asset.category.id, label: asset.category.name }]
    : [];

  const availablePct = asset.total_quantity > 0
    ? Math.round((asset.available_quantity / asset.total_quantity) * 100)
    : 0;

  return (
    <AppLayout pageTitle="Assets">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Assets
      </button>

      <div className="max-w-5xl space-y-5">

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-brand-text-primary">{asset.name}</h1>
              {asset.category && (
                <p className="text-sm text-brand-text-secondary mt-0.5">{asset.category.name}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {capitalize(asset.status.replace(/_/g, " "))}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>
                  {capitalize(asset.condition)}
                </span>
                {asset.is_low_stock && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    <AlertTriangle size={10} /> Low Stock
                  </span>
                )}
                {asset.is_maintenance_due && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    <Wrench size={10} /> Maintenance Due
                  </span>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors text-brand-text-primary"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-brand-border rounded-xl p-1 w-fit">
          {(["details", "maintenance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-1.5 text-sm rounded-lg transition-colors capitalize",
                activeTab === tab
                  ? "bg-brand-purple text-white font-medium"
                  : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50",
              ].join(" ")}
            >
              {tab === "maintenance" ? "Maintenance" : "Details"}
            </button>
          ))}
        </div>

        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Left: image + details ──────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Asset image */}
              <div className="bg-white border border-brand-border rounded-2xl">
                <div className="relative h-64 bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden">
                  {asset.image_url ? (
                    <Image
                      src={asset.image_url}
                      alt={asset.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <Package size={48} />
                      <p className="text-sm">No image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="bg-white border border-brand-border rounded-2xl">
                <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
                  <h2 className="text-sm font-semibold text-brand-text-primary">Asset Details</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                    {[
                      ["Category", asset.category?.name ?? "—"],
                      ["Serial Number", asset.serial_number ?? "—"],
                      ["Purchase Date", formatDate(asset.purchase_date)],
                      ...(isAdmin ? [["Purchase Cost", asset.purchase_cost ? formatCurrency(Number(asset.purchase_cost)) : "—"]] : []),
                      ["Assigned To", asset.assigned_to ?? "—"],
                      ["Added", formatDate(asset.created_at)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-brand-text-secondary mb-0.5">{label}</p>
                        <p className="font-medium text-brand-text-primary">{value}</p>
                      </div>
                    ))}
                  </div>

                  {asset.description && (
                    <div className="mt-5 pt-5 border-t border-brand-border">
                      <p className="text-xs text-brand-text-secondary mb-1">Description</p>
                      <p className="text-sm text-brand-text-primary">{asset.description}</p>
                    </div>
                  )}

                  {/* Vehicle details */}
                  {asset.vehicle_details && (
                    <div className="mt-5 pt-5 border-t border-brand-border">
                      <div className="flex items-center gap-2 mb-4">
                        <Car size={14} className="text-brand-purple" />
                        <p className="text-sm font-semibold text-brand-text-primary">Vehicle Details</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                        {[
                          ["Plate Number", asset.vehicle_details.plate_number ?? "—"],
                          ["Vehicle Type", asset.vehicle_details.vehicle_type ? capitalize(asset.vehicle_details.vehicle_type.replace(/_/g, " ")) : "—"],
                          ["Fuel Type", asset.vehicle_details.fuel_type ? capitalize(asset.vehicle_details.fuel_type) : "—"],
                          ["Year of Manufacture", asset.vehicle_details.year_of_manufacture ? String(asset.vehicle_details.year_of_manufacture) : "—"],
                          ["Color", asset.vehicle_details.color ?? "—"],
                          ["Seating Capacity", asset.vehicle_details.seating_capacity ? `${asset.vehicle_details.seating_capacity} seats` : "—"],
                          ["Engine Number", asset.vehicle_details.engine_number ?? "—"],
                          ["Chassis Number (VIN)", asset.vehicle_details.chassis_number ?? "—"],
                          ["Mileage at Registration", asset.vehicle_details.mileage_at_registration != null ? `${asset.vehicle_details.mileage_at_registration.toLocaleString()} km` : "—"],
                          ["Insurance Expiry", formatDate(asset.vehicle_details.insurance_expiry_date)],
                          ["Road Worthiness Expiry", formatDate(asset.vehicle_details.road_worthiness_expiry_date)],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="text-xs text-brand-text-secondary mb-0.5">{label}</p>
                            <p className="font-medium text-brand-text-primary">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity bar */}
                  <div className="mt-5 pt-5 border-t border-brand-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-brand-text-secondary">Availability</p>
                      <p className="text-sm font-semibold text-brand-text-primary">
                        {asset.available_quantity} / {asset.total_quantity} available
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          availablePct === 0
                            ? "bg-red-400"
                            : availablePct <= 25
                            ? "bg-amber-400"
                            : "bg-green-400"
                        }`}
                        style={{ width: `${availablePct}%` }}
                      />
                    </div>
                    {asset.is_low_stock && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} />
                        Below low stock threshold ({asset.low_stock_threshold})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Quick info + request ───────────────────────────────── */}
            <div className="space-y-5">
              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-brand-text-primary mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Status</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {capitalize(asset.status.replace(/_/g, " "))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Condition</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>
                      {capitalize(asset.condition)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Total Qty</span>
                    <span className="font-medium text-brand-text-primary">{asset.total_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Available</span>
                    <span className={`font-semibold ${asset.available_quantity === 0 ? "text-red-500" : "text-green-600"}`}>
                      {asset.available_quantity}
                    </span>
                  </div>
                  {asset.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-brand-text-secondary">Category</span>
                      <span className="font-medium text-brand-text-primary">{asset.category.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Request Asset</h3>
                <p className="text-xs text-brand-text-secondary mb-4">
                  Submit a loan or requisition request for this asset.
                </p>
                {asset.available_quantity === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-sm text-red-500 font-medium">Not Available</p>
                    <p className="text-xs text-brand-text-secondary mt-1">All units are currently in use</p>
                  </div>
                ) : (
                  <Link
                    href={`/assets/requests/new?asset_id=${asset.id}`}
                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors"
                  >
                    Request this Asset
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="space-y-5">
            {/* Schedule card */}
            <div className="bg-white border border-brand-border rounded-2xl">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-brand-text-primary">Maintenance Schedule</h2>
                  <p className="text-xs text-brand-text-secondary mt-0.5">Recurring maintenance configuration for this asset</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setLogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
                  >
                    <Plus size={14} /> Log Maintenance
                  </button>
                )}
              </div>
              <div className="p-6">
                {asset.maintenance_type ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-brand-text-secondary mb-1">Type</p>
                      <p className="text-sm font-medium text-brand-text-primary capitalize">{asset.maintenance_type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-text-secondary mb-1">Frequency</p>
                      <p className="text-sm font-medium text-brand-text-primary">
                        {asset.maintenance_frequency_months
                          ? asset.maintenance_frequency_months === 1
                            ? "Every month"
                            : asset.maintenance_frequency_months === 12
                            ? "Every year"
                            : asset.maintenance_frequency_months === 24
                            ? "Every 2 years"
                            : `Every ${asset.maintenance_frequency_months} months`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-text-secondary mb-1">Next Due</p>
                      <p className={`text-sm font-medium ${asset.is_maintenance_due ? "text-red-600" : "text-brand-text-primary"}`}>
                        {asset.next_maintenance_due ? formatDate(asset.next_maintenance_due) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-text-secondary mb-1">Status</p>
                      {asset.is_maintenance_due ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          <AlertTriangle size={10} /> Due Now
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                          On Schedule
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-brand-text-secondary">
                    <Wrench size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No maintenance schedule configured</p>
                    {isAdmin && (
                      <p className="text-xs mt-1">Edit the asset to add a maintenance schedule</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Maintenance history */}
            <div className="bg-white border border-brand-border rounded-2xl">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-sm font-semibold text-brand-text-primary">Maintenance History</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">{logs.length} log{logs.length !== 1 ? "s" : ""} recorded</p>
              </div>
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand-text-secondary">
                  <ClipboardList size={28} className="mb-2 text-gray-300" />
                  <p className="text-sm">No maintenance logs yet</p>
                  {isAdmin && (
                    <button
                      onClick={() => setLogOpen(true)}
                      className="mt-3 text-sm text-brand-purple hover:underline font-medium"
                    >
                      + Log first maintenance
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {logs.map((log) => (
                    <div key={log.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-brand-text-primary capitalize">
                              {log.maintenance_type.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                              {log.maintenance_type}
                            </span>
                          </div>
                          {log.technician && (
                            <p className="text-xs text-brand-text-secondary">By: {log.technician}</p>
                          )}
                          {log.notes && (
                            <p className="text-sm text-brand-text-primary mt-1">{log.notes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-brand-text-primary">{formatDate(log.performed_date)}</p>
                          {log.cost != null && (
                            <p className="text-xs text-brand-text-secondary mt-0.5">{formatCurrency(Number(log.cost))}</p>
                          )}
                          {log.logged_by_name && (
                            <p className="text-[10px] text-brand-text-secondary mt-1">Logged by {log.logged_by_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditModal
          asset={asset}
          categoryOptions={categoryOptions}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Log maintenance modal */}
      {logOpen && (
        <LogMaintenanceModal
          assetId={id}
          onClose={() => setLogOpen(false)}
        />
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Asset"
        message={`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`}
        confirmLabel="Delete Asset"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AppLayout>
  );
}
