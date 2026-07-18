"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useProductById } from "@/lib/modules/products/hooks/useProducts";
import type { UpdateProductFormOutput } from "@/lib/modules/products/schemas/product.schema";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import ProductForm from "@/lib/modules/products/components/ProductForm";
import { toast } from "sonner";
import FormSection from "@/components/ui/FormSection";
import { useUpdateProduct } from "@/lib/modules/products/hooks/useProductMutations";
import { ProductImage } from "@/lib/modules/products/types/product.types";
import { parseError } from "@/lib/errors";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { product, isLoading, error } = useProductById(id);

    const { mutateAsync: updateProduct } = useUpdateProduct(id);

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

async function handleSubmit(
  data: UpdateProductFormOutput,
  newImages: File[],
  keptImages: ProductImage[],
) {
  try {
    await updateProduct({
      ...data,
      _newImageFiles: newImages,
      _keptImageIds: keptImages.map((img) => img.id),
    } as any);

    toast.success("Product updated successfully");

    router.push(PRODUCT_ROUTES.detail(id));
  } catch (err) {
    toast.error(parseError(err));
  }
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



      <FormSection
        title="Product Information"
        description="Enter product details and pricing information"
      >
        <ProductForm
          initial={product}
          onSubmit={handleSubmit}
          onCancel={() => router.push(PRODUCT_ROUTES.detail(id))}
          submitLabel="Save Changes"
          submitLoadingLabel="Saving…"
        />
      </FormSection>




    </AppLayout>
  );
}