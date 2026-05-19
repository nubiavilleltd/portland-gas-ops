"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZES = [10, 25, 50, 100];

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = buildPageNumbers(page, pageCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-brand-border bg-gray-50/50">
      <div className="flex items-center gap-3 text-xs text-brand-text-secondary">
        <span className="whitespace-nowrap">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 px-2 text-xs border border-brand-border rounded-md bg-white text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple cursor-pointer"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap">
          {start}–{end} of {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <NavButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </NavButton>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`e${i}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-brand-text-secondary select-none"
            >
              …
            </span>
          ) : (
            <NavButton
              key={p}
              onClick={() => onPageChange(p as number)}
              active={p === page}
            >
              {p}
            </NavButton>
          )
        )}

        <NavButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  disabled,
  active,
  ...rest
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
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
        ${
          active
            ? "bg-brand-purple text-white shadow-sm"
            : "border border-brand-border bg-white text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text-primary"
        }
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-text-secondary`}
      {...rest}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);

  return pages;
}
