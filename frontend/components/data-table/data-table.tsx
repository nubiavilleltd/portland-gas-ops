"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown, FileX, LucideIcon } from "lucide-react";
import Toolbar from "./toolbar";
import Pagination from "./pagination";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface RowAction<T> {
  label: string | ((row: T) => string);
  icon: LucideIcon | ((row: T) => LucideIcon);
  onClick: (row: T) => void;
  color?: "default" | "danger" | "success";
}

interface DataTableProps<T extends { id: string; status?: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  rowHref?: (row: T) => string;
  onNewRequest?: () => void;
  newRequestLabel?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  emptyState?: { title: string; description: string };
  hideStatusFilter?: boolean;
  toolbarExtra?: React.ReactNode;
  rowActions?: RowAction<T>[];
}

type SortDir = "asc" | "desc";

const PAGE_SIZE_DEFAULT = 10;

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export default function DataTable<T extends { id: string; status?: string }>({
  columns,
  data,
  isLoading = false,
  rowHref,
  onNewRequest,
  newRequestLabel,
  emptyMessage = "No records found",
  emptyDescription = "Try adjusting your search or filters",
  searchPlaceholder,
  emptyState,
  hideStatusFilter = false,
  toolbarExtra,
  rowActions = [],
}: DataTableProps<T>) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = data;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) =>
          String(getValue(row, String(col.key)) ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    if (statusFilter) {
      result = result.filter((row) => getValue(row, "status") === statusFilter);
    }

    return result;
  }, [data, search, statusFilter, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const skeletonRows = Array.from({ length: 6 });

  return (
    <div>
      <Toolbar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        onNewRequest={onNewRequest ?? (() => {})}
        newRequestLabel={newRequestLabel}
        hideStatusFilter={hideStatusFilter}
        toolbarExtra={toolbarExtra}
      />

      <div className="bg-brand-card border border-brand-border rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-brand-border bg-gray-50">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide whitespace-nowrap"
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(String(col.key))}
                        className="flex items-center gap-1 hover:text-brand-text-primary transition-colors group"
                      >
                        {col.label}
                        <SortIcon
                          active={sortKey === String(col.key)}
                          dir={sortKey === String(col.key) ? sortDir : null}
                        />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                {rowActions.length > 0 && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                skeletonRows.map((_, i) => (
                  <tr key={i} className="border-b border-brand-border last:border-0">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3.5">
                        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-brand-text-secondary">
                      <FileX size={36} className="opacity-30" />
                      <p className="font-medium text-brand-text-primary text-sm">{emptyMessage}</p>
                      <p className="text-xs">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => rowHref && router.push(rowHref(row))}
                    className={`border-b border-brand-border last:border-0 hover:bg-brand-purple-faint transition-colors group ${rowHref ? "cursor-pointer" : ""}`}
                  >
                    {columns.map((col) => {
                      const raw = getValue(row, String(col.key));
                      return (
                        <td key={String(col.key)} className="px-4 py-3 text-brand-text-primary">
                          {col.render ? (
                            col.render(raw, row)
                          ) : raw !== null && raw !== undefined ? (
                            String(raw)
                          ) : (
                            <span className="text-brand-text-secondary">—</span>
                          )}
                        </td>
                      );
                    })}
                    {rowActions.length > 0 && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {rowActions.map((action, idx) => {
                            const label = typeof action.label === "function" ? action.label(row) : action.label;
                            const Icon = typeof action.icon === "function" ? action.icon(row) : action.icon;
                            const colorClass =
                              action.color === "danger" ? "text-red-600 hover:text-red-700" :
                              action.color === "success" ? "text-green-600 hover:text-green-700" :
                              "text-brand-text-secondary hover:text-brand-text-primary";

                            return (
                              <button
                                key={idx}
                                onClick={() => action.onClick(row)}
                                title={label}
                                className={`p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${colorClass}`}
                              >
                                <Icon size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && sorted.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir | null }) {
  if (!active || !dir) {
    return <ChevronsUpDown size={13} className="opacity-40 group-hover:opacity-70 transition-opacity" />;
  }
  return dir === "asc" ? (
    <ChevronUp size={13} className="text-brand-purple" />
  ) : (
    <ChevronDown size={13} className="text-brand-purple" />
  );
}
