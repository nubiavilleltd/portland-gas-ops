"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageErrorState from "@/components/ui/PageError";

import {
  useProductById,
  useCategories,
  useUnits,
} from "@/lib/modules/products/hooks/useProducts";
import {
  useProductAvailability,
  useInventoryItemsByProduct,
  useConsumableStock,
  useStockMovementsByProduct,
} from "@/lib/modules/inventory/hooks/useInventory";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";

import AvailabilityKpis from "@/lib/modules/inventory/components/AvailabilityKpis";
import IndividualItemsSection from "@/lib/modules/inventory/components/IndividualItemsSection";
import StockQuantitySection from "@/lib/modules/inventory/components/StockQuantitySection";
import InventoryListSkeleton from "@/lib/modules/inventory/components/InventoryListSkeleton";

const TRACKING_LABEL = {
  INDIVIDUAL_ITEMS: "Individual Items",
  STOCK_QUANTITY: "Stock Quantity",
} as const;

export default function ProductInventoryDrillDownPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const { product, isLoading: productLoading, error } = useProductById(productId);
  const { categories } = useCategories();
  const { units } = useUnits();

  const { availability, isLoading: availabilityLoading } =
    useProductAvailability(productId);

  const { items, isLoading: itemsLoading } =
    useInventoryItemsByProduct(productId);

  const { stock, isLoading: stockLoading } = useConsumableStock();
  const { movements, isLoading: movementsLoading } =
    useStockMovementsByProduct(productId);

  const isLoading =
    productLoading || availabilityLoading || itemsLoading || stockLoading || movementsLoading;

  if (isLoading) {
    return <InventoryListSkeleton />;
  }

  if (error || !product) {
    return (
      <AppLayout pageTitle="Product Inventory">
        <PageErrorState
          title="Unable to load product"
          message={error ?? "This product could not be found."}
        >
          <Button
            variant="outline"
            onClick={() => router.push(INVENTORY_ROUTES.list())}
          >
            Back to Inventory
          </Button>
        </PageErrorState>
      </AppLayout>
    );
  }

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? "—";
  const unitLabel =
    units.find((u) => u.id === product.unitId)?.label ?? undefined;

  const isIndividualItems =
    product.inventoryTracking === "INDIVIDUAL_ITEMS";

  const productStock = stock.filter((s) => s.product_id === productId);
  const isStockQuantityProduct = !isIndividualItems;

  const displayUnitLabel = isStockQuantityProduct
    ? productStock[0]?.unit_label ?? unitLabel
    : undefined;

  return (
    <AppLayout pageTitle={`${product.name} — Inventory`}>
      <button
        onClick={() => router.push(INVENTORY_ROUTES.list())}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Inventory
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-text-primary">
          {product.name}
        </h1>
        <p className="text-sm text-brand-text-secondary mt-1 flex items-center gap-2">
          <span className="font-mono text-xs">
            {product.code ?? product.productNo}
          </span>
          <span>•</span>
          <span>{categoryName}</span>
          <span>•</span>
          <Badge
            variant={
              isIndividualItems ? "info" : "neutral"
            }
            label={TRACKING_LABEL[product.inventoryTracking]}
          />
        </p>
      </div>

      <AvailabilityKpis
        total={availability?.total ?? 0}
        available={availability?.available ?? 0}
        reserved={availability?.reserved ?? 0}
        sold={availability?.sold ?? 0}
        unitLabel={displayUnitLabel}
        isLoading={availabilityLoading}
      />

      {isIndividualItems ? (
        <IndividualItemsSection items={items} isLoading={itemsLoading} />
      ) : (
        <StockQuantitySection
          stock={productStock}
          movements={movements}
          productId={productId}
          isLoading={stockLoading || movementsLoading}
        />
      )}
    </AppLayout>
  );
}