"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";

import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import type { Product } from "@/lib/modules/products/types/product.types";
// import { getUnitLabel } from "@/lib/modules/products/types/product.types";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { formatCurrency } from "@/lib/utils";
import { ProductStatusBadge } from "@/lib/modules/products/badges/ProductStatusBadge";


export default function ProductsPage() {
  const { products, isLoading, error } = useProducts();

  const columns: Column<Product>[] = [
    {
      key:   "name",
      label: "Product Name",
    },
    {
      key:   "unit",
      label: "Unit",
    //   render: (_value, product) => getUnitLabel(product) || product.unit,
      render: (_value, product) => product.unit,
    },
    {
      key:   "defaultUnitPrice",
      label: "Default Unit Price",
    //   render: (value, product) =>
    //     `${formatCurrency(value as number)} / ${getUnitLabel(product) || product.unit}`,
      render: (_value, product:Product) => formatCurrency(product.defaultUnitPrice),
    },
    {
      key:   "description",
      label: "Description",
      render: (value) => (value as string) || "—",
    },
    {
      key:   "status",
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
          <Button
            href={PRODUCT_ROUTES.new()}
            leftIcon={<Plus size={16} />}
          >
            New Product
          </Button>
        }
        className="mb-6"
      />

      <DataTable<Product>
        columns={columns}
        data={products}
        isLoading={isLoading}
        // error={error}
        rowHref={(product) => PRODUCT_ROUTES.detail(product.productNo)}
        emptyMessage="No products found. Add your first product to get started."
      />
    </AppLayout>
  );
}