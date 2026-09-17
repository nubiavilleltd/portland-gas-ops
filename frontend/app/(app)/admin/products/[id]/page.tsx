"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil, PowerOff, Power, ArrowLeft } from "lucide-react";
import { ReactNode, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormSection from "@/components/ui/FormSection";
import PageErrorState from "@/components/ui/PageError";

import {
  useProductById,
  useCategories,
  useUnits,
} from "@/lib/modules/products/hooks/useProducts";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useToggleProductStatus } from "@/lib/modules/products/hooks/useProductMutations";
import {
  type Product,
  type ProductImage,
  type InventoryTracking,
} from "@/lib/modules/products/types/product.types";
import ProductDetailsSkeleton from "@/lib/modules/products/components/ProductDetailsSkeleton";
import { parseError } from "@/lib/errors";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";

const TRACKING_LABEL: Record<InventoryTracking, string> = {
  INDIVIDUAL_ITEMS: "Individual Items",
  STOCK_QUANTITY: "Stock Quantity",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { product, isLoading, error } = useProductById(id);
  const { categories } = useCategories();
  const { units } = useUnits();

  const isActive = product?.status === "active";
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

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? "—";
  const unitLabel =
    units.find((u) => u.id === product.unitId)?.label ?? "—";
  const unitCode =
    units.find((u) => u.id === product.unitId)?.code ?? "";

  return (
    <AppLayout pageTitle={product.name}>
      <button
        onClick={() => router.push(PRODUCT_ROUTES.list())}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Products
      </button>

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

          <Button
            variant={isActive ? "danger" : "primary"}
            loading={isToggling}
            loadingText={isActive ? "Deactivating…" : "Activating…"}
            onClick={() =>
              toggleStatus(isActive ?? false, {
                onSuccess: () => {
                  toast.success(
                    isActive
                      ? "Product deactivated successfully."
                      : "Product activated successfully.",
                  );
                },
                onError: (err) => {
                  toast.error(parseError(err));
                },
              })
            }
            leftIcon={
              isActive ? <PowerOff size={14} /> : <Power size={14} />
            }
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

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
            label="Inventory Tracking"
            value={
              <Badge
                variant={
                  product.inventoryTracking === "INDIVIDUAL_ITEMS"
                    ? "info"
                    : "neutral"
                }
                label={TRACKING_LABEL[product.inventoryTracking]}
              />
            }
          />
          <InfoRow label="Category" value={categoryName} />
          <InfoRow
            label="SKU"
            value={
              product.code ? (
                <span className="font-mono">{product.code}</span>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            label="Product Number"
            value={<span className="font-mono">{product.productNo}</span>}
          />
          <InfoRow
            label="Tag Prefix"
            value={
              product.tagPrefix ? (
                <span className="font-mono">{product.tagPrefix}</span>
              ) : (
                "—"
              )
            }
          />
          <InfoRow label="Unit of Measurement" value={`${unitLabel} (${unitCode})`} />
          <InfoRow
            label="Default Unit Price"
            value={`${formatCurrency(product.defaultUnitPrice)} / ${unitCode}`}
          />
          <InfoRow
            label="Minimum Stock Threshold"
            value={
              product.minimumStock
                ? product.minimumStock.toLocaleString()
                : "Not set"
            }
          />
          <InfoRow
            label="Description"
            value={product.description ?? "—"}
          />
        </div>
      </FormSection>

      <FormSection
        title="Inventory"
        description="Stock levels and movements for this product"
        className="mb-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-brand-text-secondary">
            View the current inventory for this product, broken down by status.
          </p>
          <Button
            size="sm"
            href={INVENTORY_ROUTES.productDetail(id)}
          >
            View Inventory →
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="Product Images"
        description="Images uploaded for this product"
      >
        <ProductImageGallery images={product.images ?? []} />
      </FormSection>
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