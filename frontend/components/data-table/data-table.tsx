"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, FileX } from "lucide-react";
import Toolbar from "./toolbar";
import Pagination from "./pagination";
import Button from "@/components/ui/Button";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
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
  hideStatusFilter?: boolean;
}

type SortDir = "asc" | "desc";

const PAGE_SIZE_DEFAULT = 10;

const ACTIONS_KEY = "_actions_";

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export default function DataTable<T extends { id: string; status?: string }>({
  columns,
  data,
  isLoading = false,
  rowHref,
  onNewRequest,
  newRequestLabel = "New Request",
  emptyMessage = "No records found",
  emptyDescription = "Try adjusting your search or filters",
  hideStatusFilter = false,
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

  const allColumns = useMemo(
    () =>
      rowHref
        ? [
            ...columns,
            {
              key: ACTIONS_KEY as keyof T,
              label: "Actions",
              sortable: false,
            } as Column<T>,
          ]
        : columns,
    [columns, rowHref]
  );

  const skeletonRows = Array.from({ length: 6 });

  return (
    <div>
      <Toolbar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        onNewRequest={onNewRequest ?? (() => {})}
        newRequestLabel={onNewRequest ? newRequestLabel : undefined}
        hideStatusFilter={hideStatusFilter}
      />

      <div className="bg-brand-card border border-brand-border rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-brand-border bg-gray-50">
                {allColumns.map((col) => (
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
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                skeletonRows.map((_, i) => (
                  <tr key={i} className="border-b border-brand-border last:border-0">
                    {allColumns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3.5">
                        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length} className="py-16 text-center">
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
                    {allColumns.map((col) => {
                      if (String(col.key) === ACTIONS_KEY) {
                        return (
                          <td
                            key={ACTIONS_KEY}
                            className="px-4 py-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={<Eye size={14} />}
                              onClick={() => rowHref && router.push(rowHref(row))}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </td>
                        );
                      }

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
