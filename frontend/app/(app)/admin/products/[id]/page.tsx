"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil, PowerOff, Power, ArrowLeft } from "lucide-react";
import { ReactNode, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useProductById } from "@/lib/modules/products/hooks/useProducts";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { parseError } from "@/lib/errors";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import FormSection from "@/components/ui/FormSection";
import { useToggleProductStatus } from "@/lib/modules/products/hooks/useProductMutations";
import { ProductImage } from "@/lib/modules/products/types/product.types";
import {
  useConsumableStockByProduct,
  useStockMovementsByProduct,
} from "@/lib/modules/inventory/hooks/useInventory";
import Badge from "@/components/ui/Badge";
import { isConsumable } from "@/lib/modules/products/types/product.types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { product, isLoading, error } = useProductById(id);
  const { stock, quantity } = useConsumableStockByProduct(
    product?.id as string,
  );
  const { movements } = useStockMovementsByProduct(product?.id as string);
  const isLow =
    product?.minimum_stock != null && quantity <= product?.minimum_stock;
  // const [actionError, setActionError] = useState<string | null>(null);

  const isActive = product?.status == "active";
  const { mutate: toggleStatus, isPending: isToggling } =
    useToggleProductStatus(id);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Product">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
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

  // async function handleToggleStatus() {
  //     if (!product) return;
  //     setIsToggling(true);
  //     setActionError(null);
  //     try {
  //         const updated = product.status === "active"
  //             ? await ProductsService.deactivateProduct(product.id)
  //             : await ProductsService.activateProduct(product.id);
  //         toast.success(`${updated.name} is now ${updated.status}`);
  //         // Refresh by navigating back to list — refetch will pick up the change
  //         // router.push(PRODUCT_ROUTES.list());
  //         router.push(`/admin${PRODUCT_ROUTES.list()}`)
  //     } catch (err) {
  //         setActionError(parseError(err));
  //     } finally {
  //         setIsToggling(false);
  //     }
  // }

  //   const unitLabel = getUnitLabel(product);

  return (
    <AppLayout pageTitle={product.name}>
      {/* Back */}
      <button
        onClick={() => router.push(PRODUCT_ROUTES.list())}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Products
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-text-primary">
            {product.name}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Added {formatDate(product.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            // href={PRODUCT_ROUTES.edit(product.id)}
            href={PRODUCT_ROUTES.edit(product.id)}
            leftIcon={<Pencil size={14} />}
          >
            Edit
          </Button>
          <Button
            variant={isActive ? "danger" : "primary"}
            loading={isToggling}
            loadingText={isActive ? "Deactivating…" : "Activating…"}
            onClick={() => toggleStatus(isActive ?? false)}
            leftIcon={isActive ? <PowerOff size={14} /> : <Power size={14} />}
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* <ErrorBanner message={actionError} className="mb-4" /> */}

      {/* Details card */}
      <FormSection
        title="Product Details"
        className="mb-4"
        description="View product information and pricing details"
      >
        <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-3">
          <InfoRow
            label="Status"
            value={
              <span
                className={
                  isActive
                    ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
                    : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
                }
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            }
          />
          <InfoRow
            label="Unit of Measurement"
            value={product.unit}
          />
          <InfoRow
            label="Default Unit Price"
            value={`${formatCurrency(product.default_unit_price)} / ${product.unit}`}
          />
          <InfoRow
            label="Description"
            value={product.description ?? "—"}
          />
        </div>
      </FormSection>

      <FormSection
        title="Product Images"
        description="Images uploaded for this product"
      >
        <ProductImageGallery images={product.images ?? []} />
      </FormSection>

      {isConsumable(product) && (
        <FormSection
          title="Stock Level"
          description="Current stock and recent movement history"
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="grid grid-cols-3 gap-5 flex-1">
              <InfoRow
                label="Current Stock"
                value={`${quantity.toLocaleString()} ${product.unit}`}
              />
              <InfoRow
                label="Minimum Threshold"
                value={
                  product.minimum_stock
                    ? `${product.minimum_stock.toLocaleString()} ${product.unit}`
                    : "Not set"
                }
              />
              <InfoRow
                label="Status"
                value={
                  <Badge
                    variant={isLow ? "danger" : "success"}
                    label={isLow ? "Low Stock" : "OK"}
                  />
                }
              />
            </div>
            <Button
              size="sm"
              href="/admin/inventory/check-in"
            >
              Check In Stock →
            </Button>
          </div>

          {/* Movement history */}
          {movements.length === 0 ? (
            <p className="text-sm text-brand-text-secondary py-4 text-center">
              No movements recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-brand-border border-t border-brand-border">
              {[...movements]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .slice(0, 10)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {m.movement_type === "check_in"
                          ? "Check In"
                          : "Check Out"}
                      </p>
                      {m.notes && (
                        <p className="text-xs text-brand-text-secondary mt-0.5">
                          {m.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${m.movement_type === "check_in" ? "text-green-700" : "text-red-600"}`}
                      >
                        {m.movement_type === "check_in" ? "+" : "−"}
                        {m.quantity.toLocaleString()} {product.unit}
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        {formatDate(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </FormSection>
      )}
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>

      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function ProductImageGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl border-2 border-dashed border-brand-border bg-gray-50">
        <p className="text-sm text-brand-text-secondary">No images uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Hero */}
      <div className="relative w-full aspect-16/7 rounded-xl overflow-hidden border border-brand-border bg-gray-50">
        <img
          src={images[activeIndex].url}
          alt={images[activeIndex].name}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors shrink-0",
                i === activeIndex
                  ? "border-brand-purple"
                  : "border-brand-border hover:border-brand-purple/50",
              )}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
