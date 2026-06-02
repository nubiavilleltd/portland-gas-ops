"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Package, Pencil, Trash2, X, AlertCircle, Wrench,
  Plus, ClipboardList, Car, ArrowRight, History, Download,
} from "lucide-react";
import QRCode from "react-qr-code";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useAsset, useUpdateAsset, useDeleteAsset, useTransferAsset,
  useMaintenanceLogs, useCreateMaintenanceLog, useAssetCategories,
  useAssetTypes, useAssignmentLogs,
} from "@/hooks/useAssets";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate, capitalize } from "@/lib/utils";
import type { AssetMaintenanceLog, MaintenanceType, AssetAssignmentLog } from "@/types";

const conditionOptions = [
  { value: "new", label: "New" }, { value: "good", label: "Good" },
  { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" },
];
const statusOptions = [
  { value: "available", label: "Available" }, { value: "assigned", label: "Assigned" },
  { value: "under_repair", label: "Under Repair" }, { value: "retired", label: "Retired" },
];
const maintenanceTypeOptions = [
  { value: "routine", label: "Routine Service" }, { value: "inspection", label: "Inspection" },
  { value: "calibration", label: "Calibration" }, { value: "repair", label: "Repair" },
];
const frequencyOptions = [
  { value: "1", label: "Every month" }, { value: "3", label: "Every 3 months" },
  { value: "6", label: "Every 6 months" }, { value: "12", label: "Every year" },
  { value: "24", label: "Every 2 years" },
];

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-700", assigned: "bg-blue-100 text-blue-700",
  under_repair: "bg-amber-100 text-amber-700", retired: "bg-gray-100 text-gray-500",
};
const CONDITION_STYLES: Record<string, string> = {
  new: "bg-purple-100 text-purple-700", good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700", poor: "bg-red-100 text-red-700",
};
const LOG_EVENT_COLOURS: Record<string, string> = {
  registered: "bg-green-100 text-green-700", assigned: "bg-blue-100 text-blue-700",
  transferred: "bg-purple-100 text-purple-700", returned: "bg-teal-100 text-teal-700",
  status_changed: "bg-amber-100 text-amber-700", retired: "bg-gray-100 text-gray-500",
};

function logEventDescription(log: AssetAssignmentLog): string {
  switch (log.event_type) {
    case "registered": return log.to_person ? `Registered — assigned to ${log.to_person}${log.to_location ? ` at ${log.to_location}` : ""}` : `Registered — available${log.to_location ? ` at ${log.to_location}` : ""}`;
    case "assigned": return `Assigned to ${log.to_person ?? "—"}${log.to_location ? ` at ${log.to_location}` : ""}`;
    case "transferred": { const from = [log.from_person, log.from_location].filter(Boolean).join(" / ") || "—"; const to = [log.to_person, log.to_location].filter(Boolean).join(" / ") || "—"; return `Transferred: ${from} → ${to}`; }
    case "returned": return `Returned / Repaired${log.to_location ? ` — available at ${log.to_location}` : ""}`;
    case "status_changed": return log.notes ?? "Status changed";
    case "retired": return `Retired${log.notes ? ` — ${log.notes}` : ""}`;
    default: return log.notes ?? capitalize(log.event_type);
  }
}

function EditModal({ asset, categoryOptions, onClose }: { asset: { id: string; name: string; category_id: string | null; asset_type_id: string | null; serial_number: string | null; purchase_date: string | null; purchase_cost: number | null; condition: string; status: string; location: string | null; assigned_to_name: string | null; description: string | null; maintenance_type: string | null; maintenance_frequency_months: number | null }; categoryOptions: { value: string; label: string }[]; onClose: () => void }) {
  const toast = useToast();
  const updateAsset = useUpdateAsset(asset.id);
  const [form, setForm] = useState({
    name: asset.name, category_id: asset.category_id ?? "", asset_type_id: asset.asset_type_id ?? "",
    serial_number: asset.serial_number ?? "", purchase_date: asset.purchase_date ?? "",
    purchase_cost: asset.purchase_cost !== null ? String(asset.purchase_cost) : "",
    condition: asset.condition, status: asset.status, location: asset.location ?? "",
    assigned_to_name: asset.assigned_to_name ?? "", description: asset.description ?? "",
    maintenance_type: asset.maintenance_type ?? "",
    maintenance_frequency_months: asset.maintenance_frequency_months ? String(asset.maintenance_frequency_months) : "",
  });
  const { data: assetTypes = [] } = useAssetTypes(form.category_id || undefined);
  function set(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })); }
  function setCategory(value: string) { setForm((prev) => ({ ...prev, category_id: value, asset_type_id: "" })); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Asset name is required"); return; }
    if (!form.location.trim()) { toast.error("Location is required"); return; }
    try {
      await updateAsset.mutateAsync({ data: { name: form.name, category_id: form.category_id || undefined, asset_type_id: form.asset_type_id || undefined, serial_number: form.serial_number || undefined, purchase_date: form.purchase_date || undefined, purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : undefined, condition: form.condition as import("@/types").AssetCondition, status: form.status as import("@/types").AssetStatus, location: form.location || undefined, assigned_to_name: form.assigned_to_name || undefined, description: form.description || undefined, maintenance_type: (form.maintenance_type || undefined) as import("@/types").MaintenanceType | undefined, maintenance_frequency_months: form.maintenance_frequency_months ? parseInt(form.maintenance_frequency_months) : undefined } });
      toast.success("Asset updated successfully");
      onClose();
    } catch { toast.error("Failed to update asset"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-white rounded-t-2xl sticky top-0 z-10">
          <h3 className="text-base font-semibold text-brand-text-primary">Edit Asset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Asset Name <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Asset name" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Category</label><select value={form.category_id} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"><option value="">No category</option>{categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Asset Type</label><select value={form.asset_type_id} onChange={(e) => set("asset_type_id", e.target.value)} disabled={!form.category_id || assetTypes.length === 0} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white disabled:opacity-50"><option value="">{form.category_id ? "No type" : "Select a category first"}</option>{assetTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Serial Number</label><input value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} placeholder="Serial number" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Condition</label><select value={form.condition} onChange={(e) => set("condition", e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white">{conditionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white">{statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Purchase Date</label><input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Purchase Cost (NGN)</label><input type="number" min="0" step="0.01" value={form.purchase_cost} onChange={(e) => set("purchase_cost", e.target.value)} placeholder="0.00" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Location <span className="text-red-500">*</span></label><input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lekki Office, Floor 2" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Assigned To</label><input value={form.assigned_to_name} onChange={(e) => set("assigned_to_name", e.target.value)} placeholder="e.g. Tunde Okafor" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Description</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Asset description…" className="rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Maintenance Type</label><select value={form.maintenance_type} onChange={(e) => set("maintenance_type", e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white"><option value="">None</option>{maintenanceTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Frequency</label><select value={form.maintenance_frequency_months} onChange={(e) => set("maintenance_frequency_months", e.target.value)} disabled={!form.maintenance_type} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white disabled:opacity-50"><option value="">Not set</option>{frequencyOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-white sticky bottom-0 z-10 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={updateAsset.isPending} className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2">
            {updateAsset.isPending ? <><span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ asset, onClose }: { asset: { id: string; name: string; assigned_to_name: string | null; location: string | null }; onClose: () => void }) {
  const toast = useToast();
  const transfer = useTransferAsset();
  const [form, setForm] = useState({ to_person: "", to_location: "", notes: "" });
  function set(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })); }
  async function handleTransfer() {
    if (!form.to_person.trim() || !form.to_location.trim()) { toast.error("Person and location are required"); return; }
    try { await transfer.mutateAsync({ id: asset.id, data: { to_person: form.to_person, to_location: form.to_location, notes: form.notes || undefined } }); toast.success("Asset transferred successfully"); onClose(); }
    catch { toast.error("Failed to transfer asset"); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl"><h3 className="text-base font-semibold text-brand-text-primary">Transfer Asset</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button></div>
        {(asset.assigned_to_name || asset.location) && <div className="px-6 pt-4"><p className="text-xs text-brand-text-secondary mb-1">Current</p><p className="text-sm text-brand-text-primary">{[asset.assigned_to_name, asset.location].filter(Boolean).join(" — ")}</p></div>}
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Transfer To (Person/Team) <span className="text-red-500">*</span></label><input value={form.to_person} onChange={(e) => set("to_person", e.target.value)} placeholder="e.g. Ngozi Eze" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">New Location <span className="text-red-500">*</span></label><input value={form.to_location} onChange={(e) => set("to_location", e.target.value)} placeholder="e.g. Apapa Depot Store" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Notes (optional)</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Reason for transfer…" className="rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none" /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-gray-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleTransfer} disabled={transfer.isPending} className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2">{transfer.isPending ? <><span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Transferring…</> : "Confirm Transfer"}</button>
        </div>
      </div>
    </div>
  );
}

function LogMaintenanceModal({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const toast = useToast();
  const createLog = useCreateMaintenanceLog(assetId);
  const [form, setForm] = useState({ performed_date: new Date().toISOString().split("T")[0], maintenance_type: "routine" as MaintenanceType, technician: "", cost: "", notes: "" });
  function set(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })); }
  async function handleSave() {
    if (!form.performed_date) { toast.error("Date performed is required"); return; }
    try { await createLog.mutateAsync({ performed_date: form.performed_date, maintenance_type: form.maintenance_type, technician: form.technician || undefined, cost: form.cost ? parseFloat(form.cost) : undefined, notes: form.notes || undefined }); toast.success("Maintenance log added"); onClose(); }
    catch { toast.error("Failed to save maintenance log"); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl"><h3 className="text-base font-semibold text-brand-text-primary">Log Maintenance</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button></div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Date Performed <span className="text-red-500">*</span></label><input type="date" value={form.performed_date} onChange={(e) => set("performed_date", e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Type</label><select value={form.maintenance_type} onChange={(e) => set("maintenance_type", e.target.value)} className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white">{maintenanceTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Technician / Company</label><input value={form.technician} onChange={(e) => set("technician", e.target.value)} placeholder="e.g. ABC Services Ltd" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Cost (NGN)</label><input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set("cost", e.target.value)} placeholder="0.00" className="h-10 rounded-lg border border-brand-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-brand-text-primary">Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="What was done, parts replaced, observations…" className="rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none" /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border bg-gray-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={createLog.isPending} className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2">{createLog.isPending ? <><span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "Save Log"}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: asset, isLoading, isError } = useAsset(id);
  const deleteAsset = useDeleteAsset();
  const { data: logs = [] } = useMaintenanceLogs(id);
  const { data: assignmentLogs = [] } = useAssignmentLogs(id);
  const { data: categories = [] } = useAssetCategories();
  const qrRef = useRef<HTMLDivElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "log" | "maintenance">("details");

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

  async function handleDelete() {
    try { await deleteAsset.mutateAsync(id); toast.success("Asset deleted"); router.push("/admin/assets"); }
    catch { toast.error("Failed to delete asset"); }
    setDeleteOpen(false);
  }

  if (isLoading) return <AppLayout pageTitle="Admin — Assets"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;
  if (isError || !asset) {
    return <AppLayout pageTitle="Admin — Assets"><div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary"><AlertCircle size={32} /><p className="text-sm">Asset not found.</p><button onClick={() => router.push("/admin/assets")} className="text-brand-purple text-sm hover:underline">Go back</button></div></AppLayout>;
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <AppLayout pageTitle="Admin — Assets">
      <button onClick={() => router.push("/admin/assets")} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors">
        <ArrowLeft size={14} /> Back to Assets
      </button>
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
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
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button onClick={() => setTransferOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors text-brand-text-primary"><ArrowRight size={13} /> Transfer</button>
              <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors text-brand-text-primary"><Pencil size={13} /> Edit</button>
              <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-brand-border rounded-xl p-1 w-fit">
          {(["details", "log", "maintenance"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={["px-4 py-1.5 text-sm rounded-lg transition-colors capitalize", activeTab === tab ? "bg-brand-purple text-white font-medium" : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50"].join(" ")}>
              {tab === "log" ? "Activity Log" : tab === "maintenance" ? "Maintenance" : "Details"}
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
                      ["Category", asset.category?.name ?? "—"], ["Asset Type", asset.asset_type?.name ?? "—"],
                      ["Asset Tag", asset.asset_tag ?? "—"], ["Serial Number", asset.serial_number ?? "—"],
                      ["Location", asset.location ?? "—"], ["Assigned To", asset.assigned_to_name ?? "—"],
                      ["Purchase Date", formatDate(asset.purchase_date)],
                      ["Purchase Cost", asset.purchase_cost ? formatCurrency(Number(asset.purchase_cost)) : "—"],
                      ["Added", formatDate(asset.created_at)],
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
                  {asset.assigned_to_name && <div className="flex items-start justify-between gap-2"><span className="text-brand-text-secondary shrink-0">Assigned To</span><span className="font-medium text-brand-text-primary text-right">{asset.assigned_to_name}</span></div>}
                  {asset.location && <div className="flex items-start justify-between gap-2"><span className="text-brand-text-secondary shrink-0">Location</span><span className="font-medium text-brand-text-primary text-right">{asset.location}</span></div>}
                  {asset.category && <div className="flex items-center justify-between"><span className="text-brand-text-secondary">Category</span><span className="font-medium text-brand-text-primary">{asset.category.name}</span></div>}
                  {asset.asset_type && <div className="flex items-center justify-between"><span className="text-brand-text-secondary">Asset Type</span><span className="font-medium text-brand-text-primary">{asset.asset_type.name}</span></div>}
                </div>
              </div>
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
                        {log.notes && log.event_type !== "status_changed" && log.event_type !== "retired" && <p className="text-xs text-brand-text-secondary mt-0.5">{log.notes}</p>}
                      </div>
                      <div className="text-right shrink-0"><p className="text-xs text-brand-text-secondary">{formatDate(log.performed_at)}</p>{log.performed_by_name && <p className="text-[10px] text-brand-text-secondary mt-0.5">{log.performed_by_name}</p>}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
          <div className="space-y-5">
            <div className="bg-white border border-brand-border rounded-2xl">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl flex items-center justify-between">
                <div><h2 className="text-sm font-semibold text-brand-text-primary">Maintenance Schedule</h2><p className="text-xs text-brand-text-secondary mt-0.5">Recurring maintenance configuration</p></div>
                <button onClick={() => setLogOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"><Plus size={14} /> Log Maintenance</button>
              </div>
              <div className="p-6">
                {asset.maintenance_type ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div><p className="text-xs text-brand-text-secondary mb-1">Type</p><p className="text-sm font-medium text-brand-text-primary capitalize">{asset.maintenance_type.replace(/_/g, " ")}</p></div>
                    <div><p className="text-xs text-brand-text-secondary mb-1">Frequency</p><p className="text-sm font-medium text-brand-text-primary">{asset.maintenance_frequency_months ? asset.maintenance_frequency_months === 1 ? "Every month" : asset.maintenance_frequency_months === 12 ? "Every year" : asset.maintenance_frequency_months === 24 ? "Every 2 years" : `Every ${asset.maintenance_frequency_months} months` : "—"}</p></div>
                    <div><p className="text-xs text-brand-text-secondary mb-1">Next Due</p><p className={`text-sm font-medium ${asset.is_maintenance_due ? "text-red-600" : "text-brand-text-primary"}`}>{asset.next_maintenance_due ? formatDate(asset.next_maintenance_due) : "—"}</p></div>
                    <div><p className="text-xs text-brand-text-secondary mb-1">Status</p>{asset.is_maintenance_due ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Due Now</span> : <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">On Schedule</span>}</div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-brand-text-secondary"><Wrench size={28} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No maintenance schedule configured</p><p className="text-xs mt-1">Edit the asset to add a maintenance schedule</p></div>
                )}
              </div>
            </div>
            <div className="bg-white border border-brand-border rounded-2xl">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl"><h2 className="text-sm font-semibold text-brand-text-primary">Maintenance History</h2><p className="text-xs text-brand-text-secondary mt-0.5">{logs.length} log{logs.length !== 1 ? "s" : ""} recorded</p></div>
              {logs.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-brand-text-secondary"><ClipboardList size={28} className="mb-2 text-gray-300" /><p className="text-sm">No maintenance logs yet</p><button onClick={() => setLogOpen(true)} className="mt-3 text-sm text-brand-purple hover:underline font-medium">+ Log first maintenance</button></div> : (
                <div className="divide-y divide-brand-border">
                  {logs.map((log) => (
                    <div key={log.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium text-brand-text-primary capitalize">{log.maintenance_type.replace(/_/g, " ")}</span></div>{log.technician && <p className="text-xs text-brand-text-secondary">By: {log.technician}</p>}{log.notes && <p className="text-sm text-brand-text-primary mt-1">{log.notes}</p>}</div>
                        <div className="text-right shrink-0"><p className="text-sm font-medium text-brand-text-primary">{formatDate(log.performed_date)}</p>{log.cost != null && <p className="text-xs text-brand-text-secondary mt-0.5">{formatCurrency(Number(log.cost))}</p>}{log.logged_by_name && <p className="text-[10px] text-brand-text-secondary mt-1">Logged by {log.logged_by_name}</p>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editOpen && <EditModal asset={asset} categoryOptions={categoryOptions} onClose={() => setEditOpen(false)} />}
      {transferOpen && <TransferModal asset={asset} onClose={() => setTransferOpen(false)} />}
      {logOpen && <LogMaintenanceModal assetId={id} onClose={() => setLogOpen(false)} />}
      <ConfirmDialog open={deleteOpen} title="Delete Asset" message={`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`} confirmLabel="Delete Asset" destructive onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </AppLayout>
  );
}
