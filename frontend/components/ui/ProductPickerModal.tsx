"use client";

import { Package, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import PickerModal from "@/components/ui/PickerModal";
import type { Product, ProductPickerProduct } from "@/lib/modules/products/types/product.types";
import { useUnits } from "@/lib/modules/products/hooks/useProducts";
import { isIndividualItems } from "@/lib/modules/products/types/product.types";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  products: ProductPickerProduct[];
  selectedProductIds?: string[];
}

function ProductCard({
  product,
  isSelected,
  unitLabel,
}: {
  product: ProductPickerProduct;
  isSelected: boolean;
  unitLabel?: string;
}) {
  const primaryImage = product.images?.[0];
  const hasInventory = product.isOrderable;

  const isIndividual = isIndividualItems(product);

  const stockLabel = hasInventory
    ? isIndividual
      ? `✓ ${product.available.toLocaleString()} items available`
      : `✓ ${product.available.toLocaleString()} ${unitLabel ?? ""} available`.trim()
    : isIndividual
      ? "⚠ No inventory available"
      : "⚠ No stock available";

  const trackingLabel = isIndividual ? "Individual Items" : "Stock Quantity";

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-brand-border bg-gray-50 shrink-0 flex items-center justify-center">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={22} className="text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-brand-purple" : "text-brand-text-primary",
            )}
          >
            {product.name}
          </p>
          {isSelected && (
            <span className="shrink-0 text-xs text-brand-purple font-medium">
              Already added
            </span>
          )}
        </div>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          {trackingLabel}
          {unitLabel ? ` · ${unitLabel}` : ""}
        </p>
        <div className="mt-1">
          <span
            className={cn(
              "text-xs font-medium",
              hasInventory ? "text-green-700" : "text-amber-700",
            )}
          >
            {stockLabel}
          </span>

          <p className="mt-1 text-xs text-brand-text-secondary">
            {formatCurrency(product.defaultUnitPrice)}
            {unitLabel ? ` / ${unitLabel}` : ""}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors",
          isSelected
            ? "bg-brand-purple border-brand-purple"
            : "border-brand-border",
        )}
      >
        {isSelected && <Check size={12} className="text-white" />}
      </div>
    </div>
  );
}

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
  products,
  selectedProductIds = [],
}: ProductPickerModalProps) {
  const { units } = useUnits();

  const unitLabelById = new Map(units.map((u) => [u.id, u.label]));

  return (
    <PickerModal<ProductPickerProduct>
      open={open}
      onClose={onClose}
      onSelect={onSelect}
      items={products}
      selectedIds={selectedProductIds}
      title="Select Product"
      subtitle={`${products.length} product${products.length !== 1 ? "s" : ""} in catalogue`}
      searchPlaceholder="Search by name, code, or description…"
      searchKeys={(p) => [p.name, p.description ?? "", p.code ?? ""]}
      getKey={(p) => p.id}
      emptyIcon={<Package size={32} />}
      emptyMessage="No products in catalogue"
      isSelectable={(product) => product.isOrderable}
      renderCard={(product, isSelected) => (
        <ProductCard
          product={product}
          isSelected={isSelected}
          unitLabel={unitLabelById.get(product.unitId)}
        />
      )}
    />
  );
}