import React from "react";

export interface SimpleTableColumn<T> {
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => React.ReactNode;
}

interface SimpleTableProps<T> {
  columns: SimpleTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  footer?: React.ReactNode;
}

export default function SimpleTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyMessage = "No data available.",
  footer,
}: SimpleTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-brand-text-secondary italic">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-2 font-medium text-brand-text-secondary text-xs ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : ""
                }`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={keyExtractor(row, index)} className="border-b last:border-0">
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={`py-2 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : ""
                  }`}
                >
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {footer && (
          <tfoot>
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
}