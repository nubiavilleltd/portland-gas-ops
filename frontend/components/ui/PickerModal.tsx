"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickerModalProps<T> {
  open: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  items: T[];
  selectedIds?: string[];
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchKeys: (item: T) => string[];     // fields to search against
  getKey: (item: T) => string;           // unique identifier
  renderCard: (item: T, isSelected: boolean) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
}

export default function PickerModal<T>({
  open,
  onClose,
  onSelect,
  items,
  selectedIds = [],
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      searchKeys(item).some((val) =>
        val?.toLowerCase().includes(q)
      )
    );
  }, [items, query, searchKeys]);

  function handleSelect(item: T) {
    onSelect(item);
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
                  {query
                    ? <>No results for <strong>"{query}"</strong></>
                    : emptyMessage
                  }
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
                const key        = getKey(item);
                const isSelected = selectedIds.includes(key);
                return (
                  <div
                    key={key}
                    onClick={() => !isSelected && handleSelect(item)}
                    className={cn(
                      "border-b border-brand-border last:border-b-0 transition-colors",
                      isSelected
                        ? "bg-brand-purple/5 cursor-default"
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
          <div className="px-5 py-3 border-t border-brand-border bg-gray-50/50 shrink-0">
            <p className="text-xs text-brand-text-secondary">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {query ? ` for "${query}"` : ""}
              {selectedIds.length > 0 && (
                <> · {selectedIds.length} already selected</>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}