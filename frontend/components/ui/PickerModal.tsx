
"use client";

import { useState, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickerModalProps<T> {
  open: boolean;
  onClose: () => void;
  // Single select
  onSelect?: (item: T) => void;
  // Multi select
  multiSelect?: boolean;
  selectedIds?: string[];
  onConfirm?: (ids: string[]) => void;
  maxSelect?: number;
  // Common
  items: T[];
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchKeys: (item: T) => string[];
  getKey: (item: T) => string;
  renderCard: (item: T, isSelected: boolean) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
}

export default function PickerModal<T>({
  open,
  onClose,
  onSelect,
  multiSelect = false,
  selectedIds = [],
  onConfirm,
  maxSelect,
  items,
  title,
  subtitle,
  searchPlaceholder = "Search…",
  searchKeys,
  getKey,
  renderCard,
  emptyIcon,
  emptyMessage = "No results found",
}: PickerModalProps<T>) {
  const [query, setQuery] = useState("");
  // Internal multi-select state — initialised from selectedIds
  const [internalSelected, setInternalSelected] =
    useState<string[]>(selectedIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      searchKeys(item).some((val) => val?.toLowerCase().includes(q))
    );
  }, [items, query]);

  function handleClose() {
    onClose();
    setQuery("");
    // Reset internal state back to prop value on close without confirm
    setInternalSelected(selectedIds);
  }

  function handleSingleSelect(item: T) {
    onSelect?.(item);
    onClose();
    setQuery("");
  }

  function handleMultiToggle(key: string) {
    setInternalSelected((prev) => {
      if (prev.includes(key)) {
        return prev.filter((id) => id !== key);
      }
      if (maxSelect && prev.length >= maxSelect) return prev; // enforce max
      return [...prev, key];
    });
  }

  function handleConfirm() {
    onConfirm?.(internalSelected);
    onClose();
    setQuery("");
  }

  // Sync internal state when modal opens with updated selectedIds
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setInternalSelected(selectedIds);
    setPrevOpen(true);
  }
  if (!open && prevOpen) {
    setPrevOpen(false);
  }

  if (!open) return null;

  const atMax = maxSelect != null && internalSelected.length >= maxSelect;
  const selectedCount = internalSelected.length;

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
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {subtitle}
                </p>
              )}
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
                placeholder={searchPlaceholder}
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

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                {emptyIcon && (
                  <div className="text-gray-300 mb-3">{emptyIcon}</div>
                )}
                <p className="text-sm text-brand-text-secondary">
                  {query ? (
                    <>No results for <strong>"{query}"</strong></>
                  ) : (
                    emptyMessage
                  )}
                </p>
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-2 text-xs text-brand-purple"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filtered.map((item) => {
                const key = getKey(item);
                const isSelected = multiSelect
                  ? internalSelected.includes(key)
                  : selectedIds.includes(key);
                const isDisabled =
                  multiSelect && !isSelected && atMax;

                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (isDisabled) return;
                      multiSelect
                        ? handleMultiToggle(key)
                        : handleSingleSelect(item);
                    }}
                    className={cn(
                      "border-b border-brand-border last:border-b-0 transition-colors",
                      isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-brand-purple/5 cursor-pointer"
                        : "hover:bg-gray-50 cursor-pointer"
                    )}
                  >
                    {renderCard(item, isSelected)}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-brand-border bg-gray-50/50 shrink-0 flex items-center justify-between">
            <p className="text-xs text-brand-text-secondary">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {query ? ` for "${query}"` : ""}
              {multiSelect && maxSelect && (
                <> · {selectedCount} of {maxSelect} selected</>
              )}
            </p>
            {multiSelect && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={maxSelect != null && selectedCount !== maxSelect}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  maxSelect != null && selectedCount !== maxSelect
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-purple text-white hover:bg-brand-purple-dark"
                )}
              >
                Done ({selectedCount}{maxSelect ? ` of ${maxSelect}` : ""})
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}