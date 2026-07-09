"use client";

import { Package, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import PickerModal from "@/components/ui/PickerModal";
import type { Product } from "@/lib/modules/products/types/product.types";
import type { InventoryItem, ConsumableStock } from "@/lib/modules/inventory/types/inventory.types";
import { getAvailableCount, getConsumableStockLevel } from "@/lib/modules/inventory/selectors/inventory.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  products: Product[];
  inventoryItems: InventoryItem[];
  consumableStock: ConsumableStock[];
  selectedProductIds?: string[];
}

function ProductCard({
  product,
  inventoryItems,
  consumableStock,
  isSelected,
}: {
  product: Product;
  inventoryItems: InventoryItem[];
  consumableStock: ConsumableStock[];
  isSelected: boolean;
}) {
  const primaryImage = product.images?.[0];

  const stockLabel = isTracked(product)
    ? `${getAvailableCount(inventoryItems, product.id)} unit(s) available`
    : `${getConsumableStockLevel(consumableStock, product.id).toLocaleString()} ${product.unit} in stock`;

  const isLow = isTracked(product)
    ? getAvailableCount(inventoryItems, product.id) === 0
    : product.minimumStock != null &&
      getConsumableStockLevel(consumableStock, product.id) <= product.minimumStock;

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-brand-border bg-gray-50 shrink-0 flex items-center justify-center">
        {primaryImage ? (
          <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={22} className="text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-brand-purple" : "text-brand-text-primary"
          )}>
            {product.name}
          </p>
          {isSelected && (
            <span className="shrink-0 text-xs text-brand-purple font-medium">
              Already added
            </span>
          )}
        </div>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          {isTracked(product) ? "Tracked Asset" : "Consumable"} · {product.unit}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn("text-xs font-medium", isLow ? "text-red-600" : "text-green-700")}>
            {stockLabel}
          </span>
          <span className="text-xs text-brand-text-secondary">
            {formatCurrency(product.defaultUnitPrice)} / {product.unit}
          </span>
        </div>
      </div>

      {/* Check */}
      <div className={cn(
        "w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors",
        isSelected ? "bg-brand-purple border-brand-purple" : "border-brand-border"
      )}>
        {isSelected && <Check size={12} className="text-white" />}
      </div>
    </div>
  );
}

export default function ProductPickerModal({
  open, onClose, onSelect,
  products, inventoryItems, consumableStock,
  selectedProductIds = [],
}: ProductPickerModalProps) {
  return (
    <PickerModal<Product>
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
      renderCard={(product, isSelected) => (
        <ProductCard
          product={product}
          inventoryItems={inventoryItems}
          consumableStock={consumableStock}
          isSelected={isSelected}
        />
      )}
    />
  );
}