// components/ui/ProductPickerModal.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, X, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/modules/products/types/product.types";
import type { InventoryItem, ConsumableStock } from "@/lib/modules/inventory/types/inventory.types";
import {
  getAvailableCount,
  getConsumableStockLevel,
} from "@/lib/modules/inventory/selectors/inventory.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";

// ── Props ─────────────────────────────────────────────────
interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  products: Product[];
  inventoryItems: InventoryItem[];
  consumableStock: ConsumableStock[];
  selectedProductIds?: string[];   // already in the order — shown as dimmed
}

// ── Stock info helper ─────────────────────────────────────
function getStockInfo(
  product: Product,
  inventoryItems: InventoryItem[],
  consumableStock: ConsumableStock[]
): { label: string; isLow: boolean } {
  if (isTracked(product)) {
    const count = getAvailableCount(inventoryItems, product.id);
    return {
      label:  `${count} unit${count !== 1 ? "s" : ""} available`,
      isLow:  count === 0,
    };
  }

  const qty = getConsumableStockLevel(consumableStock, product.id);
  return {
    label:  `${qty.toLocaleString()} ${product.unit} in stock`,
    isLow:  product.minimum_stock != null && qty <= product.minimum_stock,
  };
}

// ── Product card ──────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  inventoryItems: InventoryItem[];
  consumableStock: ConsumableStock[];
  isSelected: boolean;
  onSelect: (product: Product) => void;
}

function ProductCard({
  product,
  inventoryItems,
  consumableStock,
  isSelected,
  onSelect,
}: ProductCardProps) {
  const stock       = getStockInfo(product, inventoryItems, consumableStock);
  const primaryImage = product.images?.[0];
  const isOutOfStock = stock.isLow && isTracked(product)
    ? getAvailableCount(inventoryItems, product.id) === 0
    : false;

  return (
    <button
      type="button"
      disabled={isSelected}
      onClick={() => !isSelected && onSelect(product)}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors border-b border-brand-border last:border-b-0",
        isSelected
          ? "bg-brand-purple/5 cursor-default"
          : "hover:bg-gray-50 cursor-pointer"
      )}
    >
      {/* Image */}
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
          <span className={cn(
            "text-xs font-medium",
            stock.isLow ? "text-red-600" : "text-green-700"
          )}>
            {stock.label}
          </span>
          <span className="text-xs text-brand-text-secondary">
            {formatCurrency(product.default_unit_price)} / {product.unit}
          </span>
        </div>
      </div>

      {/* Check indicator */}
      <div className={cn(
        "w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors",
        isSelected
          ? "bg-brand-purple border-brand-purple"
          : "border-brand-border"
      )}>
        {isSelected && <Check size={12} className="text-white" />}
      </div>
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────
export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
  products,
  inventoryItems,
  consumableStock,
  selectedProductIds = [],
}: ProductPickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q)
    );
  }, [products, query]);

  function handleSelect(product: Product) {
    onSelect(product);
    onClose();
    setQuery("");
  }

  function handleClose() {
    onClose();
    setQuery("");
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
            <div>
              <h2 className="text-base font-semibold text-brand-text-primary">
                Select Product
              </h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                {products.length} product{products.length !== 1 ? "s" : ""} in catalogue
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-brand-border shrink-0">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"
              />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, code, or description…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-brand-border bg-gray-50 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Product list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package size={32} className="text-gray-300 mb-3" />
                <p className="text-sm text-brand-text-secondary">
                  No products match <strong>"{query}"</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-2 text-xs text-brand-purple"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inventoryItems={inventoryItems}
                  consumableStock={consumableStock}
                  isSelected={selectedProductIds.includes(product.id)}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-brand-border bg-gray-50/50 shrink-0">
            <p className="text-xs text-brand-text-secondary">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {query ? ` for "${query}"` : ""}
              {selectedProductIds.length > 0 && (
                <> · {selectedProductIds.length} already in order</>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}