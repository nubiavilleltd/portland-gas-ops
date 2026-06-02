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
      key:   "default_unit_price",
      label: "Default Unit Price",
    //   render: (value, product) =>
    //     `${formatCurrency(value as number)} / ${getUnitLabel(product) || product.unit}`,
      render: (_value, product:Product) => formatCurrency(product.default_unit_price),
    },
    {
      key:   "description",
      label: "Description",
      render: (value) => (value as string) || "—",
    },
    {
      key:   "status",
      label: "Status",
      render: (value) => (
        <span
          className={
            value === "active"
              ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
              : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
          }
        >
          {value === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Products">
      <PageHeader
        title="Products"
        description="Manage the product catalogue available for order creation"
        // action={
        //   <Button
        //     href={PRODUCT_ROUTES.new()}
        //     leftIcon={<Plus size={16} />}
        //   >
        //     New Product
        //   </Button>
        // }
        className="mb-6"
      />

      <DataTable<Product>
        columns={columns}
        data={products}
        isLoading={isLoading}
        // error={error}
        rowHref={(product) => PRODUCT_ROUTES.detail(product.id)}
        emptyMessage="No products found. Add your first product to get started."
      />
    </AppLayout>
  );
}