"use client";

import { Plus, Trash2 } from "lucide-react";

/**
 * DynamicLineItems — a configurable add/remove rows table for forms.
 *
 * Usage:
 *   const columns: LineItemColumn[] = [
 *     {
 *       key: "description",
 *       label: "Description",
 *       width: "2fr",
 *       render: (value, onChange) => (
 *         <input
 *           value={value as string}
 *           onChange={(e) => onChange(e.target.value)}
 *           placeholder="Item description"
 *           className="w-full text-sm outline-none bg-transparent"
 *         />
 *       ),
 *     },
 *     {
 *       key: "quantity",
 *       label: "Qty",
 *       width: "80px",
 *       render: (value, onChange) => (
 *         <input
 *           type="number"
 *           min="1"
 *           value={value as number}
 *           onChange={(e) => onChange(Number(e.target.value))}
 *           className="w-full text-sm outline-none bg-transparent"
 *         />
 *       ),
 *     },
 *   ];
 *
 *   const defaultRow = { description: "", quantity: 1 };
 *
 *   <DynamicLineItems
 *     columns={columns}
 *     rows={rows}
 *     onChange={setRows}
 *     defaultRow={defaultRow}
 *     addLabel="Add Item"
 *   />
 */

export interface LineItemColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  /**
   * CSS grid column width. Use fr units for flexible, px for fixed.
   * e.g. "1fr", "80px", "120px", "2fr"
   * Default: "1fr"
   */
  width?: string;
  render: (
    value: T[keyof T],
    onChange: (val: T[keyof T]) => void,
    row: T,
    rowIndex: number
  ) => React.ReactNode;
}

interface Props<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: LineItemColumn<T>[];
  rows: T[];
  onChange: (rows: T[]) => void;
  /** Template used when "+ Add" is clicked */
  defaultRow: T;
  addLabel?: string;
  /** Minimum rows — remove button is hidden when at this count. Default: 1 */
  minRows?: number;
  error?: string;
}

export default function DynamicLineItems<T extends Record<string, unknown>>({
  columns,
  rows,
  onChange,
  defaultRow,
  addLabel = "Add Row",
  minRows = 1,
  error,
}: Props<T>) {
  function updateRow(rowIndex: number, key: keyof T, value: T[keyof T]) {
    const next = rows.map((row, i) =>
      i === rowIndex ? { ...row, [key]: value } : row
    );
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { ...defaultRow }]);
  }

  function removeRow(rowIndex: number) {
    onChange(rows.filter((_, i) => i !== rowIndex));
  }

  // Build grid template: columns + 40px remove button column
  const gridTemplate = [...columns.map((c) => c.width ?? "1fr"), "40px"].join(" ");

  return (
    <div className="flex flex-col gap-3">
      {/* Table */}
      <div className="border border-brand-border rounded-xl overflow-visible">
        {/* Header */}
        <div
          className="grid bg-gray-50 border-b border-brand-border rounded-t-xl"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className="px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide"
            >
              {col.label}
            </div>
          ))}
          {/* Empty header for remove column */}
          <div />
        </div>

        {/* Rows */}
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={[
              "grid border-b border-brand-border last:border-b-0",
              rowIndex % 2 === 1 ? "bg-gray-50/40" : "bg-white",
            ].join(" ")}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="px-3 py-2 border-r border-brand-border/40 last:border-r-0"
              >
                {col.render(
                  row[col.key],
                  (val) => updateRow(rowIndex, col.key, val as T[keyof T]),
                  row,
                  rowIndex
                )}
              </div>
            ))}

            {/* Remove button */}
            <div className="flex items-center justify-center">
              {rows.length > minRows && (
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  aria-label="Remove row"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors font-medium w-fit"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}
