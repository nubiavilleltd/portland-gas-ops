"use client";

import Badge from "@/components/ui/Badge";
import DataTable, { type Column } from "@/components/ui/DataTable";

import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import { formatDate } from "@/lib/utils";
import type { InventoryItem, InventoryItemStatus } from "@/lib/modules/inventory/types/inventory.types";
import type { BadgeVariant } from "@/config/badge.config";

const STATUS_VARIANT: Record<InventoryItemStatus, BadgeVariant> = {
  available: "success",
  reserved: "warning",
  checked_out: "info",
  with_customer: "cyan",
  maintenance: "orange",
  sold: "neutral",
  retired: "neutral",
};

const STATUS_LABEL: Record<InventoryItemStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  checked_out: "Checked Out",
  with_customer: "With Customer",
  maintenance: "Maintenance",
  sold: "Sold",
  retired: "Retired",
};

const CONDITION_VARIANT: Record<string, BadgeVariant> = {
  new: "success",
  refurbished: "info",
  used: "neutral",
  damaged: "danger",
};

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
}

export default function IndividualItemsSection({
  items,
  isLoading,
}: Props) {
  const columns: Column<InventoryItem>[] = [
    {
      key: "tag_number",
      label: "Tag Number",
      render: (value) => (
        <span className="font-mono font-medium text-sm">
          {value as string}
        </span>
      ),
    },
    {
      key: "serial_number",
      label: "Serial",
      render: (value) => (value as string | undefined) ?? "—",
    },
    {
      key: "condition",
      label: "Condition",
      render: (value) => {
        const v = value as InventoryItem["condition"];
        return <Badge variant={CONDITION_VARIANT[v]} label={v} />;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const v = value as InventoryItemStatus;
        return (
          <Badge variant={STATUS_VARIANT[v]} label={STATUS_LABEL[v]} />
        );
      },
    },
    {
      key: "location_name",
      label: "Location",
    },
    {
      key: "received_into_inventory_at",
      label: "Received",
      render: (value) => formatDate(value as string),
    },
  ];

  return (
    <DataTable<InventoryItem>
      columns={columns}
      data={items}
      isLoading={isLoading}
      rowHref={(item) => INVENTORY_ROUTES.trackedDetail(item.id)}
      emptyMessage="No inventory items for this product."
    />
  );
}