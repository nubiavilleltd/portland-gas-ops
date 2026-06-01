"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useProductById } from "@/lib/modules/products/hooks/useProducts";
import type { CreateProductFormOutput, UpdateProductFormOutput } from "@/lib/modules/products/schemas/product.schema";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import ProductForm from "@/lib/modules/products/components/ProductForm";
import { toast } from "sonner";

export default function EditProductPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;

  const { product, isLoading, error } = useProductById(id);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Edit Product">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout pageTitle="Product Not Found">
        <ErrorBanner message={error ?? "This product could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(PRODUCT_ROUTES.list())}
        >
          Back to Products
        </Button>
      </AppLayout>
    );
  }

  async function handleSubmit(data: UpdateProductFormOutput) {
    await ProductsService.updateProduct(id, data);
    toast.success("Product successfully updated")
    router.push(PRODUCT_ROUTES.detail(id));
  }

  return (
    <AppLayout pageTitle={`Edit — ${product.name}`}>
      <button
        onClick={() => router.push(PRODUCT_ROUTES.detail(id))}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Product
      </button>

      <PageHeader
        title={`Edit — ${product.name}`}
        description="Update product details. Changes apply to future orders only."
        className="mb-6"
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Product Details</h2>

        {/*
          Pass initial={product} — ProductForm uses it to pre-fill
          defaultValues. The form is identical to the create form,
          the only difference is the pre-filled values and submit labels.
        */}
        <ProductForm
          initial={product}
          onSubmit={handleSubmit}
          onCancel={() => router.push(PRODUCT_ROUTES.detail(id))}
          submitLabel="Save Changes"
          submitLoadingLabel="Saving…"
        />
      </div>
    </AppLayout>
  );
}