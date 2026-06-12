"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Package, Pencil, Trash2 /*, LayoutGrid, Table2, MapPin, User */ } from "lucide-react";
import SelectInput from "@/components/forms/SelectInput";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import { useAssets, useAssetCategories, useDeleteAsset } from "@/hooks/useAssets";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, capitalize } from "@/lib/utils";
import type { Asset, AssetStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "available",    label: "Available" },
  { value: "assigned",     label: "Assigned" },
  { value: "under_repair", label: "Under Repair" },
  { value: "retired",      label: "Retired" },
];

const STATUS_STYLES: Record<AssetStatus, string> = {
  available:    "bg-green-100 text-green-700",
  assigned:     "bg-blue-100 text-blue-700",
  under_repair: "bg-amber-100 text-amber-700",
  retired:      "bg-gray-100 text-gray-500",
};

const CONDITION_STYLES: Record<string, string> = {
  new:  "bg-purple-100 text-purple-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

/* ── Card view (commented out — kept for future use) ───────────────────────────
import Link from "next/link";
import { MapPin, User } from "lucide-react";

function AssetCard({ asset }: { asset: Asset }) {
  const statusStyle = STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500";
  const conditionStyle = CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500";
  return (
    <Link href={`/admin/assets/${asset.id}`} className="bg-white border border-brand-border rounded-xl overflow-hidden hover:shadow-md hover:border-brand-purple transition-all group flex flex-col">
      <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
        {asset.image_url ? <Image src={asset.image_url} alt={asset.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" /> : <Package size={36} className="text-gray-300" />}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-brand-text-primary text-sm leading-tight line-clamp-2">{asset.name}</p>
          <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>{capitalize(asset.status.replace(/_/g, " "))}</span>
        </div>
        {asset.category && <p className="text-xs text-brand-text-secondary">{asset.category.name}</p>}
        {asset.asset_tag && <span className="self-start text-[10px] font-mono text-brand-text-secondary bg-gray-100 px-1.5 py-0.5 rounded">{asset.asset_tag}</span>}
        <div className="mt-auto pt-2 border-t border-brand-border space-y-1">
          {asset.assigned_to_name && <div className="flex items-center gap-1 text-xs text-brand-text-secondary"><User size={10} className="shrink-0" /><span className="truncate">{asset.assigned_to_name}</span></div>}
          {asset.location && <div className="flex items-center gap-1 text-xs text-brand-text-secondary"><MapPin size={10} className="shrink-0" /><span className="truncate">{asset.location}</span></div>}
          {!asset.assigned_to_name && !asset.location && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${conditionStyle}`}>{capitalize(asset.condition)}</span>}
        </div>
        {asset.purchase_cost && <p className="text-xs text-brand-text-secondary">{formatCurrency(Number(asset.purchase_cost))}</p>}
      </div>
    </Link>
  );
}
────────────────────────────────────────────────────────────────────────────── */

const TABLE_COLUMNS: Column<Asset>[] = [
  { key: "name", label: "Asset", render: (_, asset) => <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">{asset.image_url ? <Image src={asset.image_url} alt={asset.name} width={36} height={36} className="object-cover h-full w-full" /> : <Package size={16} className="text-gray-400" />}</div><div className="min-w-0"><p className="text-sm font-medium text-brand-text-primary truncate">{asset.name}</p>{asset.serial_number && <p className="text-xs text-brand-text-secondary font-mono">{asset.serial_number}</p>}</div></div> },
  { key: "asset_tag", label: "Tag", render: (v) => v ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">{String(v)}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "category", label: "Category", render: (_, asset) => asset.category ? <span className="text-sm text-brand-text-primary">{asset.category.name}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "status", label: "Status", render: (_, asset) => <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.status.replace(/_/g, " "))}</span> },
  { key: "assigned_to_name", label: "Assigned To", render: (v) => v ? <span className="text-sm text-brand-text-primary">{String(v)}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "location", label: "Location", render: (v) => v ? <span className="text-sm text-brand-text-primary">{String(v)}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "condition", label: "Condition", render: (_, asset) => <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.condition)}</span> },
  { key: "purchase_cost", label: "Cost", render: (_, asset) => asset.purchase_cost ? <span className="text-sm text-brand-text-primary">{formatCurrency(Number(asset.purchase_cost))}</span> : <span className="text-brand-text-secondary">—</span> },
];

export default function AdminAssetsPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<AssetStatus | undefined>(undefined);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  // const [viewMode, setViewMode] = useState<"card" | "table">("card"); // view toggle removed — table only

  const { data: assets = [], isLoading, isError } = useAssets({ search: search || undefined, status: activeStatus, category_id: activeCategoryId });
  const { data: categories = [] } = useAssetCategories();
  const deleteAsset = useDeleteAsset();
  const toast = useToast();

  function handleDelete() {
    if (!deleteTarget) return;
    deleteAsset.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Asset deleted"); setDeleteTarget(null); },
      onError: () => toast.error("Failed to delete asset"),
    });
  }

  const tableActions: DataTableAction<Asset>[] = [
    {
      key: "row-actions",
      label: "",
      render: (asset) => (
        <div className="flex items-center gap-1">
          <a
            href={`/admin/assets/${asset.id}?edit=true`}
            title="Edit asset"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors"
          >
            <Pencil size={14} />
          </a>
          <button
            type="button"
            title="Delete asset"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(asset); }}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Admin — Assets">
      <PageHeader
        title="Asset Registry"
        description="Manage all company assets"
        action={
          <div className="flex items-center gap-2">
            <Button href="/assets/history" variant="outline" size="sm">Asset History</Button>
            <Button href="/admin/assets/categories" variant="outline" size="sm">Categories</Button>
            <Button href="/admin/assets/new" leftIcon={<Plus size={15} />} size="sm">Register Asset</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, tag, assignee…" className="w-full pl-9 pr-4 py-2 bg-white border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
        <div className="w-44 shrink-0">
          <SelectInput placeholder="All Statuses" sortOptions={false} value={activeStatus ?? ""} onValueChange={(v) => setActiveStatus((v || undefined) as AssetStatus | undefined)} options={STATUS_OPTIONS} />
        </div>
        {categories.length > 0 && (
          <div className="w-44 shrink-0">
            <SelectInput placeholder="All Categories" value={activeCategoryId ?? ""} onValueChange={(v) => setActiveCategoryId(v || undefined)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-brand-text-secondary">{!isLoading && `${assets.length} asset${assets.length !== 1 ? "s" : ""}`}</p>
        {/* View toggle removed — table only
        <div className="flex items-center gap-0.5 bg-white border border-brand-border rounded-lg p-0.5">
          <button onClick={() => setViewMode("card")} title="Card view" className={["p-1.5 rounded-md transition-colors", viewMode === "card" ? "bg-brand-purple text-white" : "text-brand-text-secondary hover:text-brand-text-primary"].join(" ")}><LayoutGrid size={14} /></button>
          <button onClick={() => setViewMode("table")} title="Table view" className={["p-1.5 rounded-md transition-colors", viewMode === "table" ? "bg-brand-purple text-white" : "text-brand-text-secondary hover:text-brand-text-primary"].join(" ")}><Table2 size={14} /></button>
        </div>
        */}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner /></div>
        : isError ? <div className="text-center py-20 text-brand-text-secondary">Failed to load assets.</div>
        : assets.length === 0 ? (
          <EmptyState title="No assets found" description={search ? "Try a different search" : "No assets registered yet"} action={<Button href="/admin/assets/new" leftIcon={<Plus size={15} />}>Register First Asset</Button>} />
        ) : (
          /* Card view commented out — kept for future use
          viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
            </div>
          ) :
          */
          <DataTable
            columns={TABLE_COLUMNS}
            data={assets}
            rowHref={(asset) => `/admin/assets/${asset.id}`}
            emptyMessage="No assets found."
            searchable={false}
            showActions
            actions={tableActions}
            minWidthClassName="min-w-[1100px]"
          />
        )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
