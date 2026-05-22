"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  FileX,
  Plus,
  Search,
} from "lucide-react";
import ApprovalBadge from "./ApprovalBadge";
import Button from "./Button";
import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@/types";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  searchable?: boolean;
  sortable?: boolean;
  getSearchValue?: (row: T) => string;
  getSortValue?: (row: T) => string | number | Date | null | undefined;
  className?: string;
  headerClassName?: string;
}

export interface DataTableFilter<T> {
  key: string;
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  getValue?: (row: T) => string;
}

export interface DataTableSearchField<T> {
  key?: keyof T | string;
  getValue?: (row: T) => unknown;
}

export interface DataTableAction<T> {
  key: string;
  label: React.ReactNode;
  ariaLabel?: string | ((row: T) => string);
  icon?: React.ReactNode | ((row: T) => React.ReactNode);
  href?: (row: T) => string;
  onClick?: (row: T, event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string | ((row: T) => string);
  labelClassName?: string;
  hideLabelOnMobile?: boolean;
  disabled?: boolean | ((row: T) => boolean);
  loading?: boolean | ((row: T) => boolean);
  loadingText?: string;
  hidden?: boolean | ((row: T) => boolean);
  title?: string | ((row: T) => string);
  render?: (row: T) => React.ReactNode;
}

interface Props<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  rowHref?: (row: T) => string;
  emptyMessage?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: DataTableSearchField<T>[];
  getSearchValues?: (row: T) => unknown[];
  filters?: DataTableFilter<T>[];
  showStatusFilter?: boolean;
  statusFilterKey?: keyof T | string;
  statusFilterLabel?: string;
  statusFilterPlaceholder?: string;
  statusFilterOptions?: { value: string; label: string }[];
  getStatusFilterValue?: (row: T) => string;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showActions?: boolean;
  actions?: DataTableAction<T>[];
  actionLabel?: string;
  actionsLabel?: string;
  actionsHeaderClassName?: string;
  actionsCellClassName?: string | ((row: T) => string);
  actionsContainerClassName?: string | ((row: T) => string);
  onNewRequest?: () => void;
  newRequestLabel?: string;
  toolbarActions?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  minWidthClassName?: string;
  rowClassName?: (row: T) => string;
}

type SortDir = "asc" | "desc";

const DEFAULT_PAGE_SIZE = 10;
const ACTIONS_KEY = "__actions__";

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return (
    typeof value === "string" &&
    [
      "draft",
      "pending",
      "pending_approval",
      "submitted",
      "in_progress",
      "approved",
      "rejected",
      "returned",
      "denied",
    ].includes(value)
  );
}

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function getNestedValue(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, row);
}

function normalizeSortValue(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return String(value ?? "").toLowerCase();
}

function getColumnSearchValue<T>(column: Column<T>, row: T) {
  const rawValue = getNestedValue(row, String(column.key));

  if (column.getSearchValue) {
    return column.getSearchValue(row);
  }

  if (!column.render) {
    return rawValue;
  }

  const renderedValue = column.render(rawValue, row);

  if (
    typeof renderedValue === "string" ||
    typeof renderedValue === "number" ||
    typeof renderedValue === "boolean"
  ) {
    return renderedValue;
  }

  return rawValue;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  rowHref,
  emptyMessage = "No records found.",
  emptyDescription = "Try adjusting your search.",
  isLoading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  sortable = true,
  paginated = true,
  pageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = [10, 25, 50, 100],
  showActions = false,
  actions = [],
  actionLabel = "View",
  actionsLabel = "Actions",
  actionsHeaderClassName,
  actionsCellClassName,
  actionsContainerClassName,
  onNewRequest,
  newRequestLabel = "New Request",
  toolbarActions,
  className,
  tableClassName,
  minWidthClassName = "min-w-[720px]",
  rowClassName,
}: Props<T>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const shouldShowToolbar = searchable || onNewRequest || toolbarActions;
  const defaultViewAction = useMemo<DataTableAction<T>[]>(
    () =>
      showActions && rowHref && actions.length === 0
        ? [
            {
              key: "view",
              label: actionLabel,
              icon: <Eye size={14} />,
              href: rowHref,
              variant: "secondary",
            },
          ]
        : [],
    [actionLabel, actions.length, rowHref, showActions],
  );
  const tableActions = actions.length > 0 ? actions : defaultViewAction;
  const shouldShowActions = showActions || tableActions.length > 0;

  function resetToFirstPage() {
    setPage(1);
  }

  function handleSort(column: Column<T>) {
    if (!sortable || column.sortable === false) return;
    const key = String(column.key);
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDir((currentDir) => (currentDir === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
    resetToFirstPage();
  }

  const visibleColumns = useMemo(
    () =>
      shouldShowActions
        ? [
            ...columns,
            {
              key: ACTIONS_KEY,
              label: actionsLabel,
              sortable: false,
              searchable: false,
              headerClassName: actionsHeaderClassName,
            } satisfies Column<T>,
          ]
        : columns,
    [actionsHeaderClassName, actionsLabel, columns, shouldShowActions],
  );

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((row) => {
      const visibleColumnSearchValues = columns
        .filter((column) => column.searchable !== false)
        .map((column) => getColumnSearchValue(column, row));

      return (
        !query ||
        visibleColumnSearchValues.some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        )
      );
    });
  }, [columns, data, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const column = columns.find((item) => String(item.key) === sortKey);

    return [...filteredData].sort((left, right) => {
      const leftValue = normalizeSortValue(
        column?.getSortValue?.(left) ?? getValue(left, sortKey),
      );
      const rightValue = normalizeSortValue(
        column?.getSortValue?.(right) ?? getValue(right, sortKey),
      );
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue));

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [columns, filteredData, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / currentPageSize));
  const paginatedData = paginated
    ? sortedData.slice((page - 1) * currentPageSize, page * currentPageSize)
    : sortedData;
  const skeletonRows = Array.from({ length: Math.min(currentPageSize, 8) });

  return (
    <div className={cn("space-y-4", className)}>
      {shouldShowToolbar ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {searchable ? (
              <div className="relative min-w-0 flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    resetToFirstPage();
                  }}
                  className="h-10 w-full rounded-lg border border-brand-border bg-white pl-9 pr-4 text-sm text-brand-text-primary transition placeholder:text-brand-text-secondary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            ) : null}

          </div>

          <div className="flex flex-wrap gap-2">
            {toolbarActions}
            {onNewRequest ? (
              <Button leftIcon={<Plus size={16} />} onClick={onNewRequest}>
                {newRequestLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-card shadow-sm md:rounded-2xl">
        <div className="overflow-x-auto -mx-px">
          <table className={cn("w-full text-sm", minWidthClassName, tableClassName)}>
            <thead>
              <tr className="border-b border-brand-border bg-gray-50">
                {visibleColumns.map((column) => {
                  const canSort = sortable && column.sortable !== false;
                  const active = sortKey === String(column.key);
                  return (
                    <th
                      key={String(column.key)}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-secondary",
                        column.headerClassName,
                      )}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className="group flex items-center gap-1 transition-colors hover:text-brand-text-primary"
                        >
                          {column.label}
                          <SortIcon active={active} dir={active ? sortDir : null} />
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                skeletonRows.map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-brand-border last:border-0"
                  >
                    {visibleColumns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-3.5">
                        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-brand-text-secondary">
                      <FileX size={36} className="opacity-30" />
                      <p className="text-sm font-medium text-brand-text-primary">
                        {emptyMessage}
                      </p>
                      <p className="text-xs">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => rowHref && router.push(rowHref(row))}
                    className={cn(
                      "group border-b border-brand-border transition-colors last:border-0",
                      rowHref && "cursor-pointer hover:bg-brand-purple-faint",
                      rowClassName?.(row),
                    )}
                  >
                    {visibleColumns.map((column) => {
                      if (String(column.key) === ACTIONS_KEY) {
                        return (
                          <td
                            key={ACTIONS_KEY}
                            className={cn(
                              "px-4 py-2.5",
                              typeof actionsCellClassName === "function"
                                ? actionsCellClassName(row)
                                : actionsCellClassName,
                            )}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div
                              className={cn(
                                "flex flex-wrap items-center gap-2",
                                typeof actionsContainerClassName === "function"
                                  ? actionsContainerClassName(row)
                                  : actionsContainerClassName,
                              )}
                            >
                              {tableActions.map((action) => (
                                <DataTableActionButton
                                  key={action.key}
                                  action={action}
                                  row={row}
                                />
                              ))}
                            </div>
                          </td>
                        );
                      }

                      const raw = getValue(row, String(column.key));
                      return (
                        <td
                          key={String(column.key)}
                          className={cn("px-4 py-3 text-brand-text-primary", column.className)}
                        >
                          {column.render ? (
                            column.render(raw, row)
                          ) : column.key === "status" && isApprovalStatus(raw) ? (
                            <ApprovalBadge status={raw} />
                          ) : raw === null || raw === undefined || raw === "" ? (
                            <span className="text-brand-text-secondary">-</span>
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

        {!isLoading && paginated && sortedData.length > 0 ? (
          <DataTablePagination
            page={page}
            pageCount={pageCount}
            pageSize={currentPageSize}
            pageSizeOptions={pageSizeOptions}
            total={sortedData.length}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setCurrentPageSize(nextSize);
              resetToFirstPage();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function resolveActionValue<T, V>(
  value: V | ((row: T) => V) | undefined,
  row: T,
) {
  return typeof value === "function" ? (value as (row: T) => V)(row) : value;
}

function DataTableActionButton<T extends { id: string }>({
  action,
  row,
}: {
  action: DataTableAction<T>;
  row: T;
}) {
  const hidden = resolveActionValue(action.hidden, row);
  if (hidden) return null;

  if (action.render) {
    return <>{action.render(row)}</>;
  }

  const href = action.href?.(row);
  const icon = resolveActionValue(action.icon, row);
  const disabled = resolveActionValue(action.disabled, row) ?? false;
  const loading = resolveActionValue(action.loading, row) ?? false;
  const className = resolveActionValue(action.className, row);
  const title = resolveActionValue(action.title, row);
  const ariaLabel = resolveActionValue(action.ariaLabel, row);
  const hideLabelOnMobile = action.hideLabelOnMobile ?? true;
  const label =
    hideLabelOnMobile ? (
      <span className={cn("hidden sm:inline", action.labelClassName)}>
        {action.label}
      </span>
    ) : (
      <span className={action.labelClassName}>{action.label}</span>
    );

  return (
    <Button
      href={href}
      size={action.size ?? "sm"}
      variant={action.variant ?? "secondary"}
      leftIcon={icon}
      disabled={disabled}
      loading={loading}
      loadingText={action.loadingText}
      aria-label={
        ariaLabel ??
        (typeof action.label === "string" ? action.label : undefined)
      }
      title={title}
      onClick={
        href
          ? undefined
          : (event) => {
              action.onClick?.(row, event);
            }
      }
      className={className}
    >
      {label}
    </Button>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir | null }) {
  if (!active || !dir) {
    return (
      <ChevronsUpDown
        size={13}
        className="opacity-40 transition-opacity group-hover:opacity-70"
      />
    );
  }

  return dir === "asc" ? (
    <ChevronUp size={13} className="text-brand-purple" />
  ) : (
    <ChevronDown size={13} className="text-brand-purple" />
  );
}

function DataTablePagination({
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = buildPageNumbers(page, pageCount);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-brand-border bg-gray-50/50 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3 text-xs text-brand-text-secondary">
        <span className="whitespace-nowrap">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-md border border-brand-border bg-white px-2 text-xs text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap">
          {start}-{end} of {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <PaginationButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </PaginationButton>
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 select-none items-center justify-center text-xs text-brand-text-secondary"
            >
              ...
            </span>
          ) : (
            <PaginationButton
              key={item}
              active={item === page}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PaginationButton>
          ),
        )}
        <PaginationButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </PaginationButton>
      </div>
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
} & React.AriaAttributes) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-brand-purple text-white shadow-sm"
          : "border border-brand-border bg-white text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text-primary",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}
