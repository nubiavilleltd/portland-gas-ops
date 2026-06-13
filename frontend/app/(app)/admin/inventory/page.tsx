"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

import {
  useInventoryItems,
  useInventoryKPIs,
  useConsumableStock,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";

import {
  getProductById,
  getActiveProducts,
} from "@/lib/modules/products/selectors/products.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";
import { formatCurrency } from "@/lib/utils";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";

import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";
import type { ConsumableStock } from "@/lib/modules/inventory/types/inventory.types";
import { BadgeVariant } from "@/config/badge.config";
import { KpiCard } from "@/lib/modules/orders/components/KpiCard";

// ── Status badge map ──────────────────────────────────────
const STATUS_VARIANT: Record<InventoryItem["status"], BadgeVariant> = {
  available:     "success",
  reserved:      "warning",
  checked_out:   "info",
  with_customer: "cyan",
  maintenance:   "orange",
  retired:       "neutral",
  returned:       "neutral",
};

const STATUS_LABEL: Record<InventoryItem["status"], string> = {
  available:     "Available",
  reserved:      "Reserved",
  checked_out:   "Checked Out",
  with_customer: "With Customer",
  maintenance:   "Maintenance",
  retired:       "Retired",
  returned:       "Returned",
};

// ── Tab type ──────────────────────────────────────────────
type Tab = "tracked" | "consumable";

// ── Page ──────────────────────────────────────────────────
export default function InventoryListPage() {
  const [activeTab, setActiveTab] = useState<Tab>("tracked");

  const { items,   isLoading: itemsLoading   } = useInventoryItems();
  const { stock,   isLoading: stockLoading   } = useConsumableStock();
  const { kpis,    isLoading: kpisLoading    } = useInventoryKPIs();
  const { products, isLoading: productsLoading } = useProducts();

  const isLoading = itemsLoading || stockLoading || productsLoading;

  // ── Tracked columns ───────────────────────────────────────
//   const trackedColumns: Column<InventoryItem>[] = [
//     {
//       key: "tag_number",
//       label: "Tag Number",
//       render: (value) => (
//         <span className="font-medium font-mono text-sm">{value as string}</span>
//       ),
//     },
//     {
//       key: "product_id",
//       label: "Product",
//       render: (value) =>
//         getProductById(products, value as string)?.name ?? "—",
//     },
//     {
//       key: "serial_number",
//       label: "Serial No.",
//       render: (value) => (value as string) ?? "—",
//     },
//     {
//       key: "condition",
//       label: "Condition",
//       render: (value) => {
//         const v = value as InventoryItem["condition"];
//         const variant: BadgeVariant =
//           v === "new"         ? "success"  :
//           v === "refurbished" ? "info"     :
//           v === "used"        ? "neutral"  : "danger";
//         return <Badge variant={variant} label={v} />;
//       },
//     },
//     {
//       key: "status",
//       label: "Status",
//       render: (value) => {
//         const v = value as InventoryItem["status"];
//         return (
//           <Badge
//             variant={STATUS_VARIANT[v]}
//             label={STATUS_LABEL[v]}
//           />
//         );
//       },
//     },
//     {
//       key: "location_id",
//       label: "Location",
//       render: () => "Main Warehouse",
//     },
//     {
//       key: "received_at",
//       label: "Received",
//     },
//   ];

//   // ── Consumable columns ────────────────────────────────────
//  const consumableColumns: Column<ConsumableStock>[] = [
//   {
//     key: "product_id",
//     label: "Product",
//     render: (_, row) => {
//       const product = getProductById(products, row.product_id);
//       return <span className="font-medium">{product?.name ?? "—"}</span>;
//     },
//   },
//   {
//     key: "quantity",
//     label: "Current Stock",
//     render: (value, row) => {
//       const product = getProductById(products, row.product_id);
//       return `${(value as number).toLocaleString()} ${product?.unit ?? ""}`;
//     },
//   },
//   {
//     key: "id",
//     label: "Min. Stock",
//     render: (_, row) => {
//       const product = getProductById(products, row.product_id);
//       return product?.minimum_stock
//         ? `${product.minimum_stock.toLocaleString()} ${product.unit}`
//         : "—";
//     },
//   },
//   {
//     key: "location_id",
//     label: "Status",
//     render: (_, row) => {
//       const product  = getProductById(products, row.product_id);
//       const minStock = product?.minimum_stock ?? 0;
//       const isLow    = minStock > 0 && row.quantity <= minStock;
//       return (
//         <Badge
//           variant={isLow ? "danger" : "success"}
//           label={isLow ? "Low Stock" : "OK"}
//         />
//       );
//     },
//   },
//   {
//     key: "updated_at",
//     label: "Last Updated",
//   },
// ];


const trackedColumns: Column<InventoryItem>[] = [
  {
    key: "tag_number",
    label: "Tag Number",
    render: (value) => (
      <span className="font-medium font-mono text-sm">{value as string}</span>
    ),
  },
  {
    key: "product_id",
    label: "Product",
    render: (value) =>
      getProductById(products, value as string)?.name ?? "—",
  },
  {
    key: "serial_number",
    label: "Serial No.",
    render: (value) => (value as string) ?? "—",
  },
  {
    key: "condition",
    label: "Condition",
    render: (value) => {
      const v = value as InventoryItem["condition"];
      const variant: BadgeVariant =
        v === "new"         ? "success"  :
        v === "refurbished" ? "info"     :
        v === "used"        ? "neutral"  : "danger";
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
    key: "location_id",
    label: "Location",
    render: () => "Main Warehouse",
  },
  {
    key: "received_at",
    label: "Received",
  },
];

const consumableColumns: Column<ConsumableStock>[] = [
  {
    key: "product_id",
    label: "Product",
    render: (value) => {
      const product = getProductById(products, value as string);
      return <span className="font-medium">{product?.name ?? "—"}</span>;
    },
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
    key: "updated_at",
    label: "Min. Stock",
    render: (_, row) => {
      const product = getProductById(products, row.product_id);
      return product?.minimum_stock
        ? `${product.minimum_stock.toLocaleString()} ${product.unit}`
        : "—";
    },
  },
  {
    key: "id",
    label: "Status",
    render: (_, row) => {
      const product  = getProductById(products, row.product_id);
      const minStock = product?.minimum_stock ?? 0;
      const isLow    = minStock > 0 && row.quantity <= minStock;
      return (
        <Badge
          variant={isLow ? "danger" : "success"}
          label={isLow ? "Low Stock" : "OK"}
        />
      );
    },
  },
  {
    key: "location_id",
    label: "Last Updated",
    render: (_, row) => row.updated_at,
  },
];


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

      {/* KPI Cards — tracked items only */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Total Items"
          value={kpis.totalTrackedItems}
          variant="primary"
        />
        <KpiCard
          label="Available"
          value={kpis.availableItems}
          variant="success"
        />
        <KpiCard
          label="Reserved"
          value={kpis.reservedItems}
          variant="warning"
        />
        <KpiCard
          label="Checked Out"
          value={kpis.checkedOutItems}
          variant="info"
        />
        <KpiCard
          label="With Customer"
          value={kpis.withCustomerItems}
          variant="info"
        />
        <KpiCard
          label="Maintenance"
          value={kpis.maintenanceItems}
          variant="warning"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {(["tracked", "consumable"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
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
          rowHref={(item) => INVENTORY_ROUTES.detail(item.id)}
          emptyMessage="No inventory items found."
        />
      ) : (
        <DataTable<ConsumableStock>
          columns={consumableColumns}
          data={stock}
          isLoading={isLoading}
          emptyMessage="No consumable stock found."
        />
      )}
    </AppLayout>
  );
}