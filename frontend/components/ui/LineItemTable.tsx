"use client";

import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
//  LineItemTable
//
//  A reusable inline-editable table for collecting line items
//  (order products, invoice lines, procurement items, etc.)
//
//  Each column defines how to render its header and each cell.
//  The table manages add/remove rows and shows a totals row.
//
//  UPDATED: Now matches procurement styling with proper borders
//  and grid layout. Grand total computes reactively.
// ─────────────────────────────────────────────────────────────

// ── Column definition ─────────────────────────────────────

export interface LineItemColumn<TRow> {
  /** Unique identifier for this column */
  key: string;
  /** Header label */
  label: string;
  /** CSS width — accepts any valid CSS value e.g. "1fr", "120px", "80px" */
  width: string;
  /** Render the cell for a given row. Receives the row and a change handler. */
  renderCell: (
    row: TRow,
    index: number,
    onChange: (patch: Partial<TRow>) => void,
    cellError?: string,
  ) => React.ReactNode;
  /** Optional header class override */
  headerClassName?: string;
  /** Optional cell class override */
  cellClassName?: string;
}

// ── Totals row cell ───────────────────────────────────────

export interface LineItemTotalCell {
  /** Number of columns this cell spans */
  colSpan?: number;
  /** Text label (left-aligned) */
  label?: string;
  /** Value to display (right-aligned when label is absent) */
  value?: React.ReactNode;
  className?: string;
}

// ── Props ─────────────────────────────────────────────────

interface LineItemTableProps<TRow> {
  /** Column definitions */
  columns: LineItemColumn<TRow>[];
  /** Current rows (from useFieldArray fields or plain state) */
  rows: TRow[];
  /** Called when user clicks Add Row */
  onAdd: () => void;
  disableAdd?: boolean;
  /** Called when user removes a row by index */
  onRemove: (index: number) => void;
  /** Called when a cell changes a field on a row */
  onChange: (index: number, patch: Partial<TRow>) => void;
  /** Label for the add row button. Default: "Add Item" */
  addLabel?: string;
  /** Cells for the totals row. Omit to hide the totals row. */
  totals?: LineItemTotalCell[];
  /** Minimum rows — remove button is hidden when at this count */
  minRows?: number;
  /** Error message shown above the table */
  error?: string;
  /** Extra class on the outer wrapper */
  className?: string;
  /** Disable the whole table (no add/remove) */
  disabled?: boolean;
  /** rowErrors[rowIndex][columnKey] = error message */
  rowErrors?: Record<number, Record<string, string>>;
}

// ── Component ─────────────────────────────────────────────

export default function LineItemTable<TRow>({
  columns,
  rows,
  onAdd,
  disableAdd = false,
  onRemove,
  onChange,
  addLabel = "Add Item",
  totals,
  minRows = 1,
  error,
  className,
  rowErrors,
  disabled = false,
}: LineItemTableProps<TRow>) {
  // Build the CSS grid template: columns + 40px remove button
  const gridTemplate = [...columns.map((c) => c.width), "40px"].join(" ");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Table */}
      <div className="border border-brand-border rounded-xl overflow-hidden">
        {/* Header row */}
        <div
          className="grid bg-gray-50 border-b border-brand-border"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide",
                col.headerClassName,
              )}
            >
              {col.label}
            </div>
          ))}
          {/* Empty header for remove column */}
          <div />
        </div>

        {/* Data rows */}
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              "grid border-b border-brand-border last:border-b-0",
              rowIndex % 2 === 1 ? "bg-gray-50/40" : "bg-white",
            )}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {/* {columns.map((col, colIndex) => (
              <div
                key={col.key}
                className={cn(
                  "px-3 py-2",
                  colIndex > 0 && "border-l border-brand-border/50",
                  col.cellClassName
                )}
              >
                {col.renderCell(row, rowIndex, (patch) =>
                  onChange(rowIndex, patch)
                )}
              </div>
            ))} */}

            {columns.map((col, colIndex) => {
              const cellError = rowErrors?.[rowIndex]?.[col.key];
              return (
                <div
                  key={col.key}
                  className={cn(
                    "px-3 py-2",
                    colIndex > 0 && "border-l border-brand-border/50",
                    cellError && "bg-red-50/40",
                    col.cellClassName,
                  )}
                >
                  {col.renderCell(
                    row,
                    rowIndex,
                    (patch) => onChange(rowIndex, patch),
                    cellError,
                  )}
                </div>
              );
            })}

            {/* Remove button */}
            <div className="flex items-center justify-center border-l border-brand-border/50">
              {!disabled && rows.length > minRows && (
                <button
                  type="button"
                  onClick={() => onRemove(rowIndex)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  aria-label="Remove row"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Totals row */}
        {totals && totals.length > 0 && (
          <div
            className="grid bg-brand-purple/5 border-t-2 border-brand-purple/20"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {totals.map((cell, i) => {
              const isLastDataCell = i === totals.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    gridColumn: cell.colSpan
                      ? `span ${cell.colSpan}`
                      : undefined,
                  }}
                  className={cn(
                    "px-3 py-2.5",
                    cell.label
                      ? "text-xs font-semibold text-brand-text-secondary uppercase tracking-wide"
                      : "font-semibold text-sm text-brand-purple",
                    isLastDataCell && "border-l border-brand-border/50",
                    cell.className,
                  )}
                >
                  {cell.label ?? cell.value}
                </div>
              );
            })}
            {/* Spacer for remove column */}
            <div />
          </div>
        )}
      </div>

      {/* Add row button */}
      {!disabled && (
        <button
          type="button"
          onClick={onAdd}
          disabled={disableAdd}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors",
            disableAdd
              ? "text-brand-text-muted cursor-not-allowed opacity-50"
              : "text-brand-purple hover:text-brand-purple-dark",
          )}
        >
          <Plus size={15} />
          {addLabel}
        </button>
      )}
    </div>
  );
}
