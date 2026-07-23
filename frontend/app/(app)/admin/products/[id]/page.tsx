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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import FormSection from "@/components/ui/FormSection";
import { useToggleProductStatus } from "@/lib/modules/products/hooks/useProductMutations";
import { Product, ProductImage } from "@/lib/modules/products/types/product.types";
import {
  useConsumableStockByProduct,
  useStockMovementsByProduct,
} from "@/lib/modules/inventory/hooks/useInventory";
import Badge from "@/components/ui/Badge";
import { isConsumable } from "@/lib/modules/products/types/product.types";
import { getStockStatus } from "@/lib/modules/products/selectors/products.selectors";
import PageErrorState from "@/components/ui/PageError";
import ProductDetailsSkeleton from "@/lib/modules/products/components/ProductDetailsSkeleton";
import { parseError } from "@/lib/errors";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { product, isLoading, error } = useProductById(id);
  const { stock, quantity } = useConsumableStockByProduct(id);
  const { movements } = useStockMovementsByProduct(id);
  const isLow = getStockStatus(product as Product, quantity);
  // product?.minimumStock != null && quantity <= product?.minimumStock;
  // const [actionError, setActionError] = useState<string | null>(null);

  const isActive = product?.status == "active";
  const { mutate: toggleStatus, isPending: isToggling } =
    useToggleProductStatus(id);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Product">
        <ProductDetailsSkeleton />
      </AppLayout>
    );
  }


  if (error || !product) {
    return (
      <AppLayout pageTitle="Product">
        <PageErrorState
          title="Unable to load product"
          message={error ?? "This product could not be found."}
        >
          <Button
            variant="outline"
            onClick={() => router.push(PRODUCT_ROUTES.list())}
          >
            Back to Products
          </Button>
        </PageErrorState>
      </AppLayout>
    );
  }


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
            Added {formatDate(product.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            href={PRODUCT_ROUTES.edit(id)}
            leftIcon={<Pencil size={14} />}
          >
            Edit
          </Button>
          {/* <Button
            variant={isActive ? "danger" : "primary"}
            loading={isToggling}
            loadingText={isActive ? "Deactivating…" : "Activating…"}
            onClick={() => toggleStatus(isActive ?? false)}
            leftIcon={isActive ? <PowerOff size={14} /> : <Power size={14} />}
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button> */}

          <Button
            variant={isActive ? "danger" : "primary"}
            loading={isToggling}
            loadingText={
              isActive
                ? "Deactivating…"
                : "Activating…"
            }
            onClick={() =>
              toggleStatus(isActive ?? false, {
                onSuccess: () => {
                  toast.success(
                    isActive
                      ? "Product deactivated successfully."
                      : "Product activated successfully."
                  );
                },
                onError: (err) => {
                  toast.error(parseError(err));
                },
              })
            }
            leftIcon={
              isActive
                ? <PowerOff size={14} />
                : <Power size={14} />
            }
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
            value={`${formatCurrency(product.defaultUnitPrice)} / ${product.unit}`}
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
                  product.minimumStock
                    ? `${product.minimumStock.toLocaleString()} ${product.unit}`
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
