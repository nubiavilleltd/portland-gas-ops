"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Package, Pencil, Trash2, Tag, History } from "lucide-react";
import SelectInput from "@/components/forms/SelectInput";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Tip from "@/components/ui/Tip";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import { useAssets, useAssetCategories, useDeleteAsset } from "@/lib/modules/assets";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, capitalize } from "@/lib/utils";
import type { Asset, AssetStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "available",         label: "Available" },
  { value: "assigned",          label: "Assigned" },
  { value: "under_maintenance", label: "Under Maintenance" },
  { value: "decommissioned",    label: "Decommissioned" },
];

const STATUS_STYLES: Record<AssetStatus, string> = {
  available:         "bg-green-100 text-green-700",
  assigned:          "bg-blue-100 text-blue-700",
  under_maintenance: "bg-amber-100 text-amber-700",
  decommissioned:    "bg-gray-100 text-gray-500",
};

const CONDITION_STYLES: Record<string, string> = {
  new:  "bg-purple-100 text-purple-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

const TABLE_COLUMNS: Column<Asset>[] = [
  {
    key: "name",
    label: "Asset",
    // Search by name AND serial number (serial is shown in the cell render)
    getSearchValue: (asset) => [asset.name, asset.serial_number].filter(Boolean).join(" "),
    render: (_, asset) => (
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden ${!asset.is_active ? "opacity-40" : ""}`}>
          {asset.attachment_url
            ? <Image src={asset.attachment_url} alt={asset.name} width={36} height={36} className="object-cover h-full w-full" />
            : <Package size={16} className="text-gray-400" />}
        </div>
        <div className="min-w-0 max-w-[260px]">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${asset.is_active ? "text-brand-text-primary" : "text-brand-text-secondary line-through"}`} title={asset.name}>{asset.name}</p>
            {!asset.is_active && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Deactivated</span>}
          </div>
          {asset.serial_number && <p className="text-xs text-brand-text-secondary font-mono">{asset.serial_number}</p>}
        </div>
      </div>
    ),
  },
  {
    key: "asset_tag",
    label: "Tag",
    render: (v) => v
      ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">{String(v)}</span>
      : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "category",
    label: "Category",
    getSearchValue: (asset) => asset.category?.name ?? "",
    render: (_, asset) => asset.category
      ? <span className="text-sm text-brand-text-primary">{asset.category.name}</span>
      : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (_, asset) => (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>
        {capitalize(asset.status.replace(/_/g, " "))}
      </span>
    ),
  },
  {
    key: "assigned_to_name",
    label: "Assigned To",
    render: (_, asset) => asset.assigned_to_name
      ? <span className="text-sm text-brand-text-primary">{asset.assigned_to_name}</span>
      : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "location",
    label: "Location",
    render: (v) => v
      ? <span className="text-sm text-brand-text-primary">{String(v)}</span>
      : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "condition",
    label: "Condition",
    render: (_, asset) => (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>
        {capitalize(asset.condition)}
      </span>
    ),
  },
  {
    key: "purchase_cost",
    label: "Cost",
    render: (_, asset) => asset.purchase_cost
      ? <span className="text-sm text-brand-text-primary">{formatCurrency(Number(asset.purchase_cost))}</span>
      : <span className="text-brand-text-secondary">—</span>,
  },
];

export default function AdminAssetsPage() {
  const [activeStatus, setActiveStatus] = useState<AssetStatus | undefined>(undefined);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "deactivated">("active");
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  // Fetch all assets — status/category filtering is client-side; text search is handled by DataTable
  const { data: assets = [], isLoading, isError } = useAssets({ include_inactive: activeFilter !== "active" });
  const { data: categories = [] } = useAssetCategories();
  const deleteAsset = useDeleteAsset();
  const toast = useToast();

  const displayedAssets = assets.filter((a) => {
    if (activeFilter === "active" && !a.is_active) return false;
    if (activeFilter === "deactivated" && a.is_active) return false;
    if (activeStatus && a.status !== activeStatus) return false;
    if (activeCategoryId && a.category?.id !== activeCategoryId) return false;
    return true;
  });

  function handleDelete() {
    if (!deleteTarget) return;
    deleteAsset.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success(`"${deleteTarget.name}" deactivated`); setDeleteTarget(null); },
      onError:   (err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        toast.error(detail ?? "Failed to deactivate asset");
        setDeleteTarget(null);
      },
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
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors"
          >
            <Tip label="Edit Asset"><Pencil size={14} /></Tip>
          </a>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(asset); }}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Tip label="Delete Asset"><Trash2 size={14} /></Tip>
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button href="/assets/history" variant="outline" size="sm" leftIcon={<History size={15} />}>Asset History</Button>
            <Button href="/admin/assets/categories" variant="outline" size="sm" leftIcon={<Tag size={15} />}>Categories</Button>
            <Button href="/admin/assets/new" leftIcon={<Plus size={15} />} size="sm">Register Asset</Button>
          </div>
        }
        className="mb-6"
      />

      {isError ? (
        <div className="text-center py-20 text-brand-text-secondary">Failed to load assets.</div>
      ) : (
        <DataTable
          columns={TABLE_COLUMNS}
          data={displayedAssets}
          isLoading={isLoading}
          rowHref={(asset) => `/admin/assets/${asset.id}`}
          emptyMessage="No assets found."
          emptyDescription={activeStatus || activeCategoryId ? "Try clearing the filters." : "Register your first asset to get started."}
          searchable
          showActions
          actions={tableActions}
          minWidthClassName="min-w-[1100px]"
          toolbarActions={
            <>
              <div className="w-40 shrink-0">
                <SelectInput
                  placeholder="All Statuses"
                  sortOptions={false}
                  value={activeStatus ?? ""}
                  onValueChange={(v) => setActiveStatus((v || undefined) as AssetStatus | undefined)}
                  options={STATUS_OPTIONS}
                />
              </div>
              {categories.length > 0 && (
                <div className="w-40 shrink-0">
                  <SelectInput
                    placeholder="All Categories"
                    value={activeCategoryId ?? ""}
                    onValueChange={(v) => setActiveCategoryId(v || undefined)}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
              )}
              <div className="w-40 shrink-0">
                <SelectInput
                  placeholder="All Assets"
                  sortOptions={false}
                  value={activeFilter}
                  onValueChange={(v) => setActiveFilter((v || "active") as typeof activeFilter)}
                  options={[
                    { value: "active",      label: "Activated" },
                    { value: "deactivated", label: "Deactivated" },
                    { value: "all",         label: "All" },
                  ]}
                />
              </div>
            </>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Asset"
        message={`Deactivate "${deleteTarget?.name}"? It will be hidden from all users and requests but remain in the system for record-keeping. This cannot be done if the asset is currently assigned.`}
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
