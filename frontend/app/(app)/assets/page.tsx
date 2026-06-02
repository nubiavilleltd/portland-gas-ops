"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Package } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useAssets } from "@/hooks/useAssets";
import { capitalize } from "@/lib/utils";
import type { Asset, AssetStatus } from "@/types";

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

function AssetCard({ asset }: { asset: Asset }) {
  const statusStyle = STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500";
  const conditionStyle = CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500";
  return (
    <Link href={`/assets/${asset.id}`} className="bg-white border border-brand-border rounded-xl overflow-hidden hover:shadow-md hover:border-brand-purple transition-all group flex flex-col">
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
        <div className="mt-auto pt-2 border-t border-brand-border">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${conditionStyle}`}>{capitalize(asset.condition)}</span>
        </div>
      </div>
    </Link>
  );
}

const TABLE_COLUMNS: Column<Asset>[] = [
  {
    key: "name",
    label: "Asset",
    render: (_, asset) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          {asset.image_url ? <Image src={asset.image_url} alt={asset.name} width={36} height={36} className="object-cover h-full w-full" /> : <Package size={16} className="text-gray-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-text-primary truncate">{asset.name}</p>
          {asset.serial_number && <p className="text-xs text-brand-text-secondary font-mono">{asset.serial_number}</p>}
        </div>
      </div>
    ),
  },
  { key: "asset_tag", label: "Tag", render: (v) => v ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{String(v)}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "category", label: "Category", render: (_, asset) => asset.category ? <span className="text-sm text-brand-text-primary">{asset.category.name}</span> : <span className="text-brand-text-secondary">—</span> },
  { key: "status", label: "Status", render: (_, asset) => <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.status.replace(/_/g, " "))}</span> },
  { key: "condition", label: "Condition", render: (_, asset) => <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[asset.condition] ?? "bg-gray-100 text-gray-500"}`}>{capitalize(asset.condition)}</span> },
];

type ViewMode = "card" | "table";

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const { data: assets = [], isLoading, isError } = useAssets({
    search: search || undefined,
    status: "available",
  });

  return (
    <AppLayout pageTitle="Assets">
      <PageHeader
        title="Available Assets"
        description="Browse assets available to request"
        action={
          <Button href="/assets/requests/new" leftIcon={<Plus size={15} />} size="sm">
            New Request
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or tag…" className="w-full pl-9 pr-4 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-brand-text-secondary">{!isLoading && `${assets.length} asset${assets.length !== 1 ? "s" : ""} available`}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-white border border-brand-border rounded-lg p-0.5">
            <button onClick={() => setViewMode("card")} title="Card view" className={["p-1.5 rounded-md transition-colors", viewMode === "card" ? "bg-brand-purple text-white" : "text-brand-text-secondary hover:text-brand-text-primary"].join(" ")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>
            <button onClick={() => setViewMode("table")} title="Table view" className={["p-1.5 rounded-md transition-colors", viewMode === "table" ? "bg-brand-purple text-white" : "text-brand-text-secondary hover:text-brand-text-primary"].join(" ")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
          </div>
          <Link href="/assets/requests" className="text-xs text-brand-purple hover:underline font-medium">My Requests →</Link>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner /></div>
        : isError ? <div className="text-center py-20 text-brand-text-secondary">Failed to load assets.</div>
        : assets.length === 0 ? (
          <EmptyState title="No assets available" description={search ? "Try a different search" : "There are no assets available to request right now"} />
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
          </div>
        ) : (
          <DataTable columns={TABLE_COLUMNS} data={assets} rowHref={(asset) => `/assets/${asset.id}`} emptyMessage="No assets found." searchable={false} />
        )}
    </AppLayout>
  );
}
