"use client";

import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import FormSelect from "@/components/forms/FormSelect";

import {
  useStockMovements,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";

import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import { getMovementsByProduct } from "@/lib/modules/inventory/selectors/inventory.selectors";
import { formatDate } from "@/lib/utils";

import type { StockMovement } from "@/lib/modules/inventory/types/inventory.types";
import { BadgeVariant } from "@/config/badge.config";

// ── Movement config ───────────────────────────────────────
const MOVEMENT_VARIANT: Record<StockMovement["movement_type"], BadgeVariant> = {
  check_in:    "success",
  check_out:   "info",
  reservation: "warning",
  return:      "cyan",
  adjustment:  "neutral",
};

const MOVEMENT_LABEL: Record<StockMovement["movement_type"], string> = {
  check_in:    "Check In",
  check_out:   "Check Out",
  reservation: "Reservation",
  return:      "Return",
  adjustment:  "Adjustment",
};

const REFERENCE_LABEL: Record<string, string> = {
  order:          "Order",
  trip:           "Trip",
  purchase_order: "Purchase Order",
  manual:         "Manual",
};

// ── Page ──────────────────────────────────────────────────
export default function MovementsPage() {
  const [productFilter, setProductFilter] = useState<string>("");

  const { movements, isLoading: movementsLoading } = useStockMovements();
  const { products,  isLoading: productsLoading  } = useProducts();

  const isLoading = movementsLoading || productsLoading;

  // ── Filter ────────────────────────────────────────────────
  const filtered = productFilter
    ? getMovementsByProduct(movements, productFilter)
    : movements;

  // Sort newest first
  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // ── Product filter options ────────────────────────────────
  const productOptions = [
    { value: "", label: "All Products" },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];

  // ── Columns ───────────────────────────────────────────────
  const columns: Column<StockMovement>[] = [
    {
      key: "created_at",
      label: "Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "movement_type",
      label: "Type",
      render: (value) => {
        const v = value as StockMovement["movement_type"];
        return (
          <Badge
            variant={MOVEMENT_VARIANT[v]}
            label={MOVEMENT_LABEL[v]}
          />
        );
      },
    },
    {
      key: "product_id",
      label: "Product",
      render: (value) =>
        getProductById(products, value as string)?.name ?? "—",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (value, row) => {
        const product  = getProductById(products, row.product_id);
        const qty      = value as number;
        const unit     = product?.unit ?? "";
        const isOut    =
          row.movement_type === "check_out" ||
          row.movement_type === "reservation";

        return (
          <span
            className={
              isOut
                ? "text-red-600 font-medium"
                : "text-green-700 font-medium"
            }
          >
            {isOut ? "−" : "+"}{qty.toLocaleString()} {unit}
          </span>
        );
      },
    },
    {
      key: "item_ids",
      label: "Units",
      render: (value) => {
        const ids = value as string[] | undefined;
        if (!ids || ids.length === 0) return "—";
        return (
          <span className="text-xs text-brand-text-secondary">
            {ids.length} unit{ids.length > 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      key: "reference_type",
      label: "Reference",
      render: (value, row) => {
        if (!value) return "—";
        const type  = value as string;
        const label = REFERENCE_LABEL[type] ?? type;
        return row.reference_id ? (
          <div className="text-sm">
            <span className="text-brand-text-secondary">{label}: </span>
            <span className="font-medium font-mono text-xs">
              {row.reference_id}
            </span>
          </div>
        ) : (
          <span className="text-brand-text-secondary text-sm">{label}</span>
        );
      },
    },
    {
      key: "notes",
      label: "Notes",
      render: (value) => (
        <span className="text-sm text-brand-text-secondary">
          {(value as string) ?? "—"}
        </span>
      ),
    },
    {
      key: "recorded_by_name",
      label: "Recorded By",
      render: (value) => (
        <span className="text-sm">{value as string}</span>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Stock Movements">
      <PageHeader
        title="Stock Movements"
        description="Full audit trail of all inventory check-ins, check-outs, reservations and returns"
        className="mb-6"
      />

      {/* Filter */}
      <div className="mb-5 max-w-xs">
        <FormSelect
          label=""
          placeholder="Filter by product"
          options={productOptions}
          value={productFilter}
          onValueChange={setProductFilter}
          sortOptions={false}
        />
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="flex items-center gap-6 mb-5 text-sm text-brand-text-secondary">
          <span>
            <strong className="text-brand-text-primary">
              {sorted.length}
            </strong>{" "}
            movement{sorted.length !== 1 ? "s" : ""}
            {productFilter && (
              <>
                {" "}for{" "}
                <strong className="text-brand-text-primary">
                  {getProductById(products, productFilter)?.name}
                </strong>
              </>
            )}
          </span>
          <span>
            <strong className="text-green-700">
              {sorted.filter((m) => m.movement_type === "check_in").length}
            </strong>{" "}
            check-ins
          </span>
          <span>
            <strong className="text-blue-700">
              {sorted.filter((m) => m.movement_type === "check_out").length}
            </strong>{" "}
            check-outs
          </span>
          <span>
            <strong className="text-cyan-700">
              {sorted.filter((m) => m.movement_type === "return").length}
            </strong>{" "}
            returns
          </span>
        </div>
      )}

      <DataTable<StockMovement>
        columns={columns}
        data={sorted}
        isLoading={isLoading}
        emptyMessage="No stock movements found."
      />
    </AppLayout>
  );
}