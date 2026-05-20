"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, AlertTriangle, Package, LayoutGrid, Table2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useAssets, useAssetCategories } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency, capitalize } from "@/lib/utils";
import type { Asset, AssetStatus } from "@/types";

const STATUS_TABS: { label: string; value: AssetStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Available", value: "available" },
  { label: "In Use", value: "in_use" },
  { label: "Maintenance", value: "under_maintenance" },
  { label: "Decommissioned", value: "decommissioned" },
];

const STATUS_STYLES: Record<AssetStatus, string> = {
  available:         "bg-green-100 text-green-700",
  in_use:            "bg-blue-100 text-blue-700",
  under_maintenance: "bg-amber-100 text-amber-700",
  decommissioned:    "bg-gray-100 text-gray-500",
};

const CONDITION_STYLES: Record<string, string> = {
  new:  "bg-purple-100 text-purple-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

// ── Card view ──────────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: Asset }) {
  const statusStyle = STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500";
  const conditionStyle = CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500";

  return (
    <Link
      href={`/assets/${asset.id}`}
      className="bg-white border border-brand-border rounded-xl overflow-hidden hover:shadow-md hover:border-brand-purple transition-all group flex flex-col"
    >
      <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
        {asset.image_url ? (
          <Image
            src={asset.image_url}
            alt={asset.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package size={36} className="text-gray-300" />
        )}
        {asset.is_low_stock && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Low Stock
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-brand-text-primary text-sm leading-tight line-clamp-2">{asset.name}</p>
          <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
            {capitalize(asset.status.replace(/_/g, " "))}
          </span>
        </div>

        {asset.category && (
          <p className="text-xs text-brand-text-secondary">{asset.category.name}</p>
        )}
        {asset.asset_tag && (
          <span className="self-start text-[10px] font-mono text-brand-text-secondary bg-gray-100 px-1.5 py-0.5 rounded">{asset.asset_tag}</span>
        )}
        {asset.asset_type && (
          <p className="text-xs text-brand-text-secondary">{asset.asset_type.name}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-brand-border">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${conditionStyle}`}>
            {capitalize(asset.condition)}
          </span>
          <div className="text-right">
            <p className="text-xs text-brand-text-secondary">Available</p>
            <p className={`text-sm font-semibold ${asset.available_quantity === 0 ? "text-red-500" : "text-brand-text-primary"}`}>
              {asset.available_quantity} / {asset.total_quantity}
            </p>
          </div>
        </div>

        {asset.purchase_cost && (
          <p className="text-xs text-brand-text-secondary">{formatCurrency(Number(asset.purchase_cost))}</p>
        )}
      </div>
    </Link>
  );
}

// ── Table columns ──────────────────────────────────────────────────────────────

const TABLE_COLUMNS: Column<Asset>[] = [
  {
    key: "name",
    label: "Asset",
    render: (_, asset) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          {asset.image_url ? (
            <Image src={asset.image_url} alt={asset.name} width={36} height={36} className="object-cover h-full w-full" />
          ) : (
            <Package size={16} className="text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-text-primary truncate">{asset.name}</p>
          {asset.serial_number && (
            <p className="text-xs text-brand-text-secondary font-mono">{asset.serial_number}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "asset_tag",
    label: "Tag",
    render: (v) => v ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{String(v)}</span> : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "category",
    label: "Category",
    render: (_, asset) =>
      asset.category ? (
        <span className="text-sm text-brand-text-primary">{asset.category.name}</span>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
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
    key: "condition",
    label: "Condition",
    render: (_, asset) => (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>
        {capitalize(asset.condition)}
      </span>
    ),
  },
  {
    key: "available_quantity",
    label: "Available / Total",
    render: (_, asset) => (
      <span className={`text-sm font-semibold ${asset.available_quantity === 0 ? "text-red-500" : "text-brand-text-primary"}`}>
        {asset.available_quantity} / {asset.total_quantity}
        {asset.is_low_stock && (
          <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Low</span>
        )}
      </span>
    ),
  },
  {
    key: "purchase_cost",
    label: "Cost",
    render: (_, asset) =>
      asset.purchase_cost ? (
        <span className="text-sm text-brand-text-primary">{formatCurrency(Number(asset.purchase_cost))}</span>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

type ViewMode = "card" | "table";

export default function AssetsPage() {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<AssetStatus | undefined>(undefined);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const { data: assets = [], isLoading, isError } = useAssets({
    search: search || undefined,
    status: activeStatus,
    category_id: activeCategoryId,
  });
  const { data: categories = [] } = useAssetCategories();

  return (
    <AppLayout pageTitle="Assets">
      <PageHeader
        title="Asset Registry"
        description="Browse and manage company assets"
        action={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Button href="/assets/categories" variant="outline" size="sm">
                Categories
              </Button>
              <Button href="/assets/new" leftIcon={<Plus size={15} />} size="sm">
                Register Asset
              </Button>
            </div>
          ) : (
            <Button href="/assets/requests/new" leftIcon={<Plus size={15} />} size="sm">
              New Request
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full pl-9 pr-4 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={activeCategoryId ?? ""}
            onChange={(e) => setActiveCategoryId(e.target.value || undefined)}
            className="px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Status tabs */}
      <div className="inline-flex gap-1 mb-5 bg-white border border-brand-border rounded-xl p-1 max-w-full overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={[
              "px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap",
              activeStatus === tab.value
                ? "bg-brand-purple text-white font-medium"
                : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Count + view toggle + requests link */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-brand-text-secondary">
          {!isLoading && `${assets.length} asset${assets.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-white border border-brand-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("card")}
              title="Card view"
              className={[
                "p-1.5 rounded-md transition-colors",
                viewMode === "card"
                  ? "bg-brand-purple text-white"
                  : "text-brand-text-secondary hover:text-brand-text-primary",
              ].join(" ")}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={[
                "p-1.5 rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-brand-purple text-white"
                  : "text-brand-text-secondary hover:text-brand-text-primary",
              ].join(" ")}
            >
              <Table2 size={14} />
            </button>
          </div>

          <Link href="/assets/requests" className="text-xs text-brand-purple hover:underline font-medium">
            View my requests →
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : isError ? (
        <div className="text-center py-20 text-brand-text-secondary">Failed to load assets.</div>
      ) : assets.length === 0 ? (
        <EmptyState
          title="No assets found"
          description={search ? "Try a different search" : "No assets registered yet"}
          action={isAdmin ? <Button href="/assets/new" leftIcon={<Plus size={15} />}>Register First Asset</Button> : undefined}
        />
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={TABLE_COLUMNS}
          data={assets}
          rowHref={(asset) => `/assets/${asset.id}`}
          emptyMessage="No assets found."
        />
      )}
    </AppLayout>
  );
}
