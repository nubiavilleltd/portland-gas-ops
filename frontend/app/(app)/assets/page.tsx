"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Package } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useAssets } from "@/lib/modules/assets";
import { capitalize } from "@/lib/utils";
import type { Asset, AssetStatus } from "@/types";

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
    render: (_, asset) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          {asset.attachment_url
            ? <Image src={asset.attachment_url} alt={asset.name} width={36} height={36} className="object-cover h-full w-full" />
            : <Package size={16} className="text-gray-400" />}
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

export default function AssetsPage() {
  const { data: assets = [], isLoading, isError } = useAssets({ mine: true });

  return (
    <AppLayout pageTitle="Assets">
      <PageHeader
        title="Assets"
        description="Available assets and assets assigned to you"
        action={
          <Button href="/assets/requests/new" leftIcon={<Plus size={15} />} size="sm">
            New Request
          </Button>
        }
      />

      <div className="flex justify-end mb-4">
        <Link href="/assets/requests" className="text-xs text-brand-purple hover:underline font-medium">My Requests →</Link>
      </div>

      {isError ? (
        <div className="text-center py-20 text-brand-text-secondary">Failed to load assets.</div>
      ) : assets.length === 0 && !isLoading ? (
        <EmptyState title="No assets" description="There are no assets available to you right now" />
      ) : (
        <DataTable columns={TABLE_COLUMNS} data={assets} isLoading={isLoading} rowHref={(asset) => `/assets/${asset.id}`} emptyMessage="No assets found." searchPlaceholder="Search by name or tag…" />
      )}
    </AppLayout>
  );
}
