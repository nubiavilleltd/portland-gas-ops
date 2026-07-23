"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

import {
  useInventoryItems,
  useConsumableStock,
  useTrackedInventoryKPIs,
  useConsumableInventoryKPIs,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";

import {
  getProductById,
} from "@/lib/modules/products/selectors/products.selectors";
import { formatDate } from "@/lib/utils";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";

import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";
import type { ConsumableStock } from "@/lib/modules/inventory/types/inventory.types";
import { BadgeVariant } from "@/config/badge.config";
import TrackedInventoryKpis from "@/lib/modules/inventory/components/TrackedInventoryKpis";
import ConsumableInventoryKpis from "@/lib/modules/inventory/components/ConsumableInventoryKpis";
import { InventoryTab } from "@/lib/modules/inventory/constants/inventory-tabs";

// ── Status badge map ──────────────────────────────────────
const STATUS_VARIANT: Record<InventoryItem["status"], BadgeVariant> = {
  available: "success",
  reserved: "warning",
  checked_out: "info",
  with_customer: "cyan",
  maintenance: "orange",
  retired: "neutral",
  returned: "neutral",
};

const STATUS_LABEL: Record<InventoryItem["status"], string> = {
  available: "Available",
  reserved: "Reserved",
  checked_out: "Checked Out",
  with_customer: "With Customer",
  maintenance: "Maintenance",
  retired: "Retired",
  returned: "Returned",
};

// ── Page ──────────────────────────────────────────────────
export default function InventoryListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: InventoryTab =
    searchParams.get("tab") === "consumable"
      ? "consumable"
      : "tracked";

  const { items, isLoading: itemsLoading } = useInventoryItems();
  const { stock, isLoading: stockLoading } = useConsumableStock();
  const { products, isLoading: productsLoading } = useProducts();




  const {
    kpis: trackedKpis,
  } = useTrackedInventoryKPIs();

  const {
    kpis: consumableKpis,
  } = useConsumableInventoryKPIs();

  const isLoading =
    itemsLoading ||
    stockLoading ||
    productsLoading;


  const trackedColumns: Column<InventoryItem>[] = [

    {
      key: "product_name",
      label: "Product",
    },

    {
      key: "tag_number",
      label: "Tag Number",
      render: (value) => (
        <span className="font-medium font-mono text-sm">{value as string}</span>
      ),
    },
    // {
    //   key: "serial_number",
    //   label: "Serial No.",
    //   render: (value) => (value as string) ?? "—",
    // },
    {
      key: "condition",
      label: "Condition",
      render: (value) => {
        const v = value as InventoryItem["condition"];
        const variant: BadgeVariant =
          v === "new" ? "success" :
            v === "refurbished" ? "info" :
              v === "used" ? "neutral" : "danger";
        return <Badge variant={variant} label={v} />;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const v = value as InventoryItem["status"];
        return <Badge variant={STATUS_VARIANT[v]} label={STATUS_LABEL[v]} />;
      },
    },
    {
      key: "location_name",
      label: "Location",
    },
    {
      key: "received_at",
      label: "Received",
      render: (value) => formatDate(value as string)
    },
  ];

  const consumableColumns: Column<ConsumableStock>[] = [
    {
      key: "product_name",
      label: "Product",
    },
    {
      key: "location_name",
      label: "Location",
    },
    {
      key: "quantity",
      label: "Current Stock",
      render: (value, row) => {
        const product = getProductById(products, row.product_id);
        return `${(value as number).toLocaleString()} ${product?.unit ?? ""}`;
      },
    },
    {
      key: "location_id",
      label: "Min. Stock",
      render: (_, row) => {
        const product = getProductById(products, row.product_id);
        return product?.minimumStock
          ? `${product.minimumStock.toLocaleString()} ${product.unit}`
          : "—";
      },
    },
    {
      key: "id",
      label: "Status",
      render: (_, row) => {
        const product = getProductById(products, row.product_id);
        const minStock = product?.minimumStock ?? 0;
        const isLow = minStock > 0 && row.quantity <= minStock;
        return (
          <Badge
            variant={isLow ? "danger" : "success"}
            label={isLow ? "Low Stock" : "OK"}
          />
        );
      },
    },
    {
      key: "updated_at",
      label: "Last Updated",
      render: (value) => formatDate(value as string)
    },
  ];

  function handleTabChange(tab: InventoryTab) {
    router.replace(
      `${pathname}?tab=${tab}`,
      {
        scroll: false,
      },
    );
  }


  return (
    <AppLayout pageTitle="Inventory">
      <PageHeader
        title="Inventory"
        description="Track stock levels, tagged assets, and movements"
        action={
          <Button
            href={INVENTORY_ROUTES.checkIn()}
            leftIcon={<Plus size={16} />}
          >
            Check In Stock
          </Button>
        }
        className="mb-6"
      />

      {activeTab === "tracked" ? (
        <TrackedInventoryKpis
          kpis={trackedKpis}
          isLoading={isLoading}
        />
      ) : (
        <ConsumableInventoryKpis
          kpis={consumableKpis}
          isLoading={isLoading}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {(["tracked", "consumable"] as InventoryTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab
              ? "bg-white text-brand-text-primary shadow-sm"
              : "text-brand-text-secondary hover:text-brand-text-primary"
              }`}
          >
            {tab === "tracked" ? "Tracked Assets" : "Consumable Stock"}
          </button>
        ))}
      </div>

      {/* Table */}
      {activeTab === "tracked" ? (
        <DataTable<InventoryItem>
          columns={trackedColumns}
          data={items}
          isLoading={isLoading}
          rowHref={(item) => INVENTORY_ROUTES.trackedDetail(item.id)}
          emptyMessage="No inventory items found."
        />
      ) : (
        <DataTable<ConsumableStock>
          columns={consumableColumns}
          data={stock}
          isLoading={isLoading}
          emptyMessage="No consumable stock found."
          rowHref={(stock) => INVENTORY_ROUTES.stockDetail(stock.id)}
        />
      )}
    </AppLayout>
  );
}