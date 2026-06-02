"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import type { CreateProductFormOutput } from "@/lib/modules/products/schemas/product.schema";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import ProductForm from "@/lib/modules/products/components/ProductForm";
import { toast } from "sonner";
import FormSection from "@/components/ui/FormSection";

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateProductFormOutput) {

    await ProductsService.createProduct(data);
    toast.success("Product Created")
    router.push(`/admin${PRODUCT_ROUTES.list()}`);
  }

  return (
    <AppLayout pageTitle="New Product">
      <PageHeader
        title="New Product"
        description="Add a product to the catalogue. It will be available for selection when creating orders"
        className="mb-6"
      />

      {/* <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
        <h2 className="text-base font-semibold mb-5">Product Details</h2>

       
      </div> */}

      <FormSection
        title="Product Information"
        description="Enter product details and pricing information"
      >
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Create Product"
          submitLoadingLabel="Creating…"
        />
      </FormSection>
    </AppLayout>
  );
}