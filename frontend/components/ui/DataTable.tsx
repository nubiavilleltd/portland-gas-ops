"use client";

import { useRouter } from "next/navigation";
import ApprovalBadge from "./ApprovalBadge";
import type { ApprovalStatus } from "@/types";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface Props<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  rowHref?: (row: T) => string;
  emptyMessage?: string;
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === "string" &&
    ["draft", "pending", "in_progress", "approved", "rejected", "returned"].includes(value);
}

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  rowHref,
  emptyMessage = "No records found.",
}: Props<T>) {
  const router = useRouter();

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl md:rounded-2xl overflow-hidden">
      <div className="overflow-x-auto -mx-px">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-brand-border bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="text-left px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-brand-text-secondary text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => rowHref && router.push(rowHref(row))}
                  className={
                    rowHref
                      ? "border-b border-brand-border last:border-0 hover:bg-brand-purple-faint cursor-pointer transition-colors"
                      : "border-b border-brand-border last:border-0"
                  }
                >
                  {columns.map((col) => {
                    const raw = getValue(row, String(col.key));
                    return (
                      <td key={String(col.key)} className="px-4 py-3 text-brand-text-primary">
                        {col.render ? (
                          col.render(raw, row)
                        ) : col.key === "status" && isApprovalStatus(raw) ? (
                          <ApprovalBadge status={raw} />
                        ) : raw === null || raw === undefined ? (
                          <span className="text-brand-text-secondary">—</span>
                        ) : (
                          String(raw)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
