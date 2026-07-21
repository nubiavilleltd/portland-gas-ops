"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";

export interface SortableColumn<T> {
  label: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface Props<T extends { id: string }> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  columns: SortableColumn<T>[];
  /** Render action buttons for a row */
  actions?: (item: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * A sortable table that uses HTML5 drag-and-drop.
 *
 * Maintains its own internal order so the list updates instantly on drop
 * without waiting for the server refetch (which would cause a visible flash).
 * Syncs from the `items` prop only when not mid-drag.
 */
export default function SortableList<T extends { id: string }>({
  items,
  onReorder,
  columns,
  actions,
  isLoading,
  emptyMessage = "No items yet.",
}: Props<T>) {
  const [localItems,  setLocalItems]  = useState<T[]>(items);
  const [dragIdx,     setDragIdx]     = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const isDragging = useRef(false);

  // Sync from server only when the set of items actually changed (add/delete),
  // not on every reorder refetch — avoids the flash after drag-and-drop.
  useEffect(() => {
    if (isDragging.current) return;
    const sameIds =
      items.length === localItems.length &&
      items.every((item, i) => item.id === localItems[i]?.id);
    if (!sameIds) setLocalItems(items);
  }, [items]);

  function onDragStart(e: React.DragEvent, idx: number) {
    isDragging.current = true;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  }

  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      reset();
      return;
    }
    const next = [...localItems];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setLocalItems(next);  // instant visual update — no flash
    onReorder(next);       // async server save in background
    reset();
  }

  function reset() {
    isDragging.current = false;
    setDragIdx(null);
    setDragOverIdx(null);
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-brand-border last:border-0">
            <div className="h-4 w-4 rounded bg-gray-200" />
            <div className="h-4 flex-1 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (localItems.length === 0) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl py-16 text-center">
        <p className="text-sm text-brand-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b border-brand-border bg-gray-50/60">
        <div className="w-10 shrink-0" />
        {columns.map((col, i) => (
          <div
            key={i}
            className={`px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide ${col.className ?? "flex-1"}`}
          >
            {col.label}
          </div>
        ))}
        {actions && (
          <div className="px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide shrink-0 min-w-[100px]">
            Actions
          </div>
        )}
      </div>

      {/* Rows */}
      {localItems.map((item, idx) => {
        const isBeingDragged = dragIdx === idx;
        const isDropTarget   = dragOverIdx === idx && dragIdx !== idx;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e)  => onDragOver(e, idx)}
            onDrop={(e)      => onDrop(e, idx)}
            onDragEnd={reset}
            className={[
              "flex items-center border-b border-brand-border last:border-0 transition-colors select-none",
              isBeingDragged ? "opacity-40 bg-gray-50" : "bg-white",
              isDropTarget   ? "border-t-2 border-t-brand-purple" : "",
            ].join(" ")}
          >
            {/* Drag handle */}
            <div className="w-10 flex items-center justify-center shrink-0 py-4 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors">
              <GripVertical size={15} />
            </div>

            {/* Data columns */}
            {columns.map((col, i) => (
              <div key={i} className={`px-4 py-4 ${col.className ?? "flex-1 min-w-0"}`}>
                {col.render(item)}
              </div>
            ))}

            {/* Action buttons */}
            {actions && (
              <div className="px-4 py-4 shrink-0 flex items-center gap-0.5 min-w-[100px]">
                {actions(item)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Small ghost icon button matching DataTable's action button style */
export function SortableAction({
  onClick,
  className = "",
  children,
}: {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 w-7 flex items-center justify-center rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
