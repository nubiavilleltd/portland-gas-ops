"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

import { useCategories, useProducts, useUnits } from "@/lib/modules/products/hooks/useProducts";
import type { Product, InventoryTracking } from "@/lib/modules/products/types/product.types";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { formatCurrency } from "@/lib/utils";
import { ProductStatusBadge } from "@/lib/modules/products/badges/ProductStatusBadge";
import PageErrorState from "@/components/ui/PageError";

type TruncateParams = {
  text: string;
  maxChar: number;
  suffix?: string;
};

function truncateText({ text, maxChar = 100, suffix = "..." }: TruncateParams) {
  if (!text || typeof text !== "string") return "-";
  if (maxChar <= 0) return suffix;
  if (text.length <= maxChar) return text;
  return text.slice(0, maxChar) + suffix;
}

const TRACKING_LABEL: Record<InventoryTracking, string> = {
  INDIVIDUAL_ITEMS: "Individual Items",
  STOCK_QUANTITY: "Stock Quantity",
};

export default function ProductsPage() {
  const { products, isLoading, error, refetch } = useProducts();
  const { categories } = useCategories();
  const { units } = useUnits();

  if (error) {
    return (
      <AppLayout pageTitle="Products">
        <PageHeader
          title="Products"
          description="Manage the product catalogue available for order creation"
          className="mb-6"
        />
        <PageErrorState message={error} onRetry={refetch} />
      </AppLayout>
    );
  }

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const unitLabelById = new Map(units.map((u) => [u.id, u.label]));

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Product",
      render: (_value, product) => (
        <div className="flex flex-col">
          <span className="font-medium">{product.name}</span>
          <span className="text-xs text-brand-text-secondary">
            {product.code ?? product.productNo}
          </span>
        </div>
      ),
    },
    {
      key: "inventoryTracking",
      label: "Tracking",
      render: (_value, product) => (
        <Badge
          variant={product.inventoryTracking === "INDIVIDUAL_ITEMS" ? "info" : "neutral"}
          label={TRACKING_LABEL[product.inventoryTracking]}
        />
      ),
    },
    {
      key: "categoryId",
      label: "Category",
      render: (_value, product) => categoryNameById.get(product.categoryId) ?? "—",
    },
    {
      key: "unitId",
      label: "Unit",
      render: (_value, product) => unitLabelById.get(product.unitId) ?? "—",
    },
    {
      key: "defaultUnitPrice",
      label: "Default Unit Price",
      render: (_value, product) => formatCurrency(product.defaultUnitPrice),
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => <ProductStatusBadge status={row.status} />,
    },
  ];

  return (
    <AppLayout pageTitle="Products">
      <PageHeader
        title="Products"
        description="Manage the product catalogue available for order creation"
        action={
          <Button href={PRODUCT_ROUTES.new()} leftIcon={<Plus size={16} />}>
            New Product
          </Button>
        }
        className="mb-6"
      />

      <DataTable<Product>
        columns={columns}
        data={products}
        isLoading={isLoading}
        rowHref={(product) => PRODUCT_ROUTES.detail(product.id)}
        emptyMessage="No products found. Add your first product to get started."
      />
    </AppLayout>
  );
}