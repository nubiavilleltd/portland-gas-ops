"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Wallet,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Receipt,
  Banknote,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  useFinanceDashboard,
  usePaidInvoices,
  useApprovedCashRequisitions,
  PAID_PAGE_SIZE,
  type CurrencyAmount,
  type Summary,
} from "@/lib/modules/finance/dashboard";

/**
 * Amounts are listed per currency rather than summed. The data carries NGN,
 * EUR, GBP and USD together, so one blended figure would be meaningless.
 */
function CurrencyLines({ items }: { items: CurrencyAmount[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-brand-text-secondary mt-1">—</p>;
  }
  return (
    <div className="mt-2 space-y-0.5">
      {items.map((c) => (
        <p key={c.currency} className="text-sm text-brand-text-secondary tabular-nums">
          {formatCurrency(c.amount, c.currency)}
        </p>
      ))}
    </div>
  );
}

type CardVariant = "primary" | "success" | "warning" | "danger";

const CARD_VARIANTS: Record<CardVariant, { container: string; label: string; value: string }> = {
  primary: { container: "bg-blue-50 border border-blue-200", label: "text-blue-700", value: "text-blue-950" },
  success: { container: "bg-emerald-50 border border-emerald-200", label: "text-emerald-700", value: "text-emerald-950" },
  warning: { container: "bg-amber-50 border border-amber-200", label: "text-amber-700", value: "text-amber-950" },
  danger:  { container: "bg-red-50 border border-red-200", label: "text-red-700", value: "text-red-950" },
};

/** "1 invoice" / "7 cash requisitions" */
function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function SummaryCard({
  label,
  summary,
  icon,
  variant,
  href,
  currency,
  sources,
  breakdown,
}: {
  label: string;
  summary: Summary;
  icon: React.ReactNode;
  variant: CardVariant;
  href?: string;
  /** Set when drilled into a single currency. */
  currency?: string | null;
  /** What the count is made of — invoices vs cash requisitions. */
  sources?: string[];
  /**
   * For cards that mix sources: the money behind each one. Without this the
   * count says "5 invoices · 7 cash requisitions" while the amounts below are
   * a combined figure, which cannot be reconciled against either number.
   */
  breakdown?: {
    label: string;
    count: number;
    by_currency: CurrencyAmount[];
    href?: string;
  }[];
}) {
  // Drilled into one currency, the amount is finally a single meaningful
  // figure, so it leads. Across all currencies only the count can.
  const styles = CARD_VARIANTS[variant];
  const single = currency ? summary.by_currency.find((c) => c.currency === currency) : undefined;
  const headline = currency
    ? formatCurrency(single?.amount ?? 0, currency)
    : String(summary.count);

  const body = (
    <div
      className={`rounded-2xl p-5 h-full transition-all ${styles.container} ${
        href ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm ${styles.label}`}>{label}</p>
          <h3 className={`text-2xl font-semibold mt-1 tabular-nums break-words ${styles.value}`}>
            {headline}
          </h3>
        </div>
        <span className={`shrink-0 ${styles.label}`}>{icon}</span>
      </div>
      {breakdown ? (
        <div className="mt-2.5 space-y-2">
          {breakdown.map((b) => {
            const amounts =
              b.by_currency.length === 0
                ? "—"
                : b.by_currency
                    .map((c) => formatCurrency(c.amount, c.currency))
                    .join("  ·  ");
            return b.href ? (
              <Link
                key={b.label}
                href={b.href}
                className="block -mx-1.5 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-black/5"
              >
                <p className="text-xs text-brand-text-secondary">
                  {b.label} · {b.count}
                </p>
                <p className="text-sm text-brand-text-primary tabular-nums">{amounts}</p>
              </Link>
            ) : (
              <div key={b.label}>
                <p className="text-xs text-brand-text-secondary">
                  {b.label} · {b.count}
                </p>
                <p className="text-sm text-brand-text-primary tabular-nums">{amounts}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {sources && sources.length > 0 && (
            <p className="text-xs text-brand-text-secondary mt-1.5">{sources.join(" · ")}</p>
          )}
          {!currency && <CurrencyLines items={summary.by_currency} />}
        </>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 animate-pulse">
      <div className="h-4 w-28 bg-gray-100 rounded" />
      <div className="h-7 w-14 bg-gray-100 rounded mt-3" />
      <div className="h-4 w-24 bg-gray-100 rounded mt-3" />
    </div>
  );
}

type RequestView = "invoice" | "cash";

export default function FinanceOverview() {
  const [currency, setCurrency] = useState<string | null>(null);
  const [view, setView] = useState<RequestView>("invoice");
  // Which way the cards should swipe/rotate in from — set right before the
  // view flips so the animation direction matches the toggle the user clicked.
  const [swapDirection, setSwapDirection] = useState<"in" | "out">("in");
  const [paidPage, setPaidPage] = useState(1);
  const [cashApprovedPage, setCashApprovedPage] = useState(1);
  const [openBucket, setOpenBucket] = useState<string | null>(null);
  const { data, isLoading, isError, isFetching } = useFinanceDashboard(currency);
  const { data: paid } = usePaidInvoices(currency, paidPage);
  const { data: approvedCash } = useApprovedCashRequisitions(currency, cashApprovedPage);

  function selectCurrency(next: string | null) {
    setCurrency(next);
    setPaidPage(1);
    setCashApprovedPage(1);
  }

  function selectView(next: RequestView) {
    if (next === view) return;
    setSwapDirection(next === "cash" ? "in" : "out");
    setView(next);
    setOpenBucket(null);
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-5 mb-6">
        <p className="text-sm text-brand-text-secondary">
          Could not load the finance overview. The modules below still work.
        </p>
      </div>
    );
  }

  // When drilled into a currency the split has to count only that currency's
  // rows, otherwise the breakdown would contradict the headline above it.
  const countIn = (summary: Summary) =>
    currency
      ? summary.by_currency.find((c) => c.currency === currency)?.count ?? 0
      : summary.count;

  const paidRows = paid?.data ?? data.recently_paid;
  const paidTotal = paid?.total ?? data.recently_paid.length;
  const cashApprovedRows = approvedCash?.data ?? data.recently_approved_cash;
  const cashApprovedTotal = approvedCash?.total ?? data.recently_approved_cash.length;

  function withFilters(base: string, status: string) {
    const params = new URLSearchParams({ status });
    if (currency) params.set("currency", currency);
    return `${base}?${params.toString()}`;
  }

  const swapClass =
    swapDirection === "in" ? "animate-card-view-swap-in" : "animate-card-view-swap-out";

  return (
    <div className="mb-8 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-brand-text-secondary mr-1">Showing</span>
        <div className="inline-flex rounded-lg border border-brand-border bg-white p-1">
          <button
            type="button"
            onClick={() => selectView("invoice")}
            aria-pressed={view === "invoice"}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
              view === "invoice"
                ? "bg-brand-purple text-white"
                : "text-brand-text-secondary hover:text-brand-purple",
            ].join(" ")}
          >
            <Receipt size={14} />
            Invoices
          </button>
          <button
            type="button"
            onClick={() => selectView("cash")}
            aria-pressed={view === "cash"}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
              view === "cash"
                ? "bg-brand-purple text-white"
                : "text-brand-text-secondary hover:text-brand-purple",
            ].join(" ")}
          >
            <Banknote size={14} />
            Cash Requisitions
          </button>
        </div>
      </div>

      {data.currencies.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-brand-text-secondary mr-1">Currency</span>
          {[null, ...data.currencies].map((c) => {
            const active = currency === c;
            return (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => selectCurrency(c)}
                aria-pressed={active}
                className={[
                  "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  active
                    ? "bg-brand-purple text-white border-brand-purple"
                    : "bg-white text-brand-text-secondary border-brand-border hover:border-brand-purple hover:text-brand-purple",
                ].join(" ")}
              >
                {c ?? "All"}
              </button>
            );
          })}
          {isFetching && (
            <span className="inline-flex items-center gap-2 text-sm text-brand-text-secondary ml-1">
              <LoadingSpinner size="sm" />
              Updating…
            </span>
          )}
        </div>
      )}

      {/* key={view} forces a remount on toggle so the swipe/rotate animation
          below replays every time, in the direction the toggle was clicked. */}
      <div key={view} className={`space-y-6 animate-card-view-swap ${swapClass}`}>
        {view === "invoice" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Awaiting approval"
              currency={currency}
              summary={data.awaiting_approval.invoices}
              icon={<Clock size={18} />}
              variant="warning"
              href={withFilters("/admin/finance/invoices", "awaiting_approval")}
              sources={[plural(countIn(data.awaiting_approval.invoices), "invoice", "invoices")]}
            />
            <SummaryCard
              label="Approved — awaiting payment"
              currency={currency}
              summary={data.awaiting_payment}
              icon={<Wallet size={18} />}
              variant="primary"
              href={withFilters("/admin/finance/invoices", "approved")}
              sources={[plural(countIn(data.awaiting_payment), "invoice", "invoices")]}
            />
            <SummaryCard
              label="Paid"
              currency={currency}
              summary={data.paid}
              icon={<CheckCircle2 size={18} />}
              variant="success"
              href={withFilters("/admin/finance/invoices", "paid")}
              sources={[plural(countIn(data.paid), "invoice", "invoices")]}
            />
            <SummaryCard
              label="Cancelled"
              currency={currency}
              summary={data.cancelled}
              icon={<XCircle size={18} />}
              variant="danger"
              href={withFilters("/admin/finance/invoices", "cancelled")}
              sources={[plural(countIn(data.cancelled), "invoice", "invoices")]}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              label="Awaiting approval"
              currency={currency}
              summary={data.awaiting_approval.cash_requisitions}
              icon={<Clock size={18} />}
              variant="warning"
              href={withFilters("/admin/finance/cash-requisitions", "awaiting_approval")}
              sources={[
                plural(
                  countIn(data.awaiting_approval.cash_requisitions),
                  "cash requisition",
                  "cash requisitions",
                ),
              ]}
            />
            <SummaryCard
              label="Approved"
              currency={currency}
              summary={data.cash_approved}
              icon={<Wallet size={18} />}
              variant="primary"
              href={withFilters("/admin/finance/cash-requisitions", "approved")}
              sources={[plural(countIn(data.cash_approved), "cash requisition", "cash requisitions")]}
            />
            <SummaryCard
              label="Rejected / Denied"
              currency={currency}
              summary={data.cash_denied}
              icon={<XCircle size={18} />}
              variant="danger"
              href={withFilters("/admin/finance/cash-requisitions", "denied")}
              sources={[plural(countIn(data.cash_denied), "cash requisition", "cash requisitions")]}
            />
          </div>
        )}

        {view === "invoice" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Who has been paid */}
            <section className="rounded-2xl border border-brand-border bg-white">
              <header className="px-5 py-4 border-b border-brand-border">
                <h3 className="text-sm font-semibold text-brand-text-primary">Recently paid</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Invoices settled by the final approver
                  {paidTotal > 0 ? ` · ${paidTotal} total` : ""}.
                </p>
              </header>
              {paidRows.length === 0 ? (
                <p className="px-5 py-6 text-sm text-brand-text-secondary">
                  Nothing has been marked paid yet.
                </p>
              ) : (
                <ul className="divide-y divide-brand-border">
                  {paidRows.map((p) => (
                    <li key={p.id || p.reference}>
                      <Link
                        href={`/finance/invoices/${p.id}`}
                        className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-brand-text-primary truncate group-hover:text-brand-purple">
                            {p.title}
                          </span>
                          <span className="block text-xs text-brand-text-secondary truncate">
                            <span className="font-mono">{p.reference}</span>
                            {p.vendor ? ` · ${p.vendor}` : ""}
                          </span>
                          <span className="block text-xs text-brand-text-secondary mt-0.5">
                            {p.paid_by_name ? `Marked as paid by ${p.paid_by_name}` : "Marked as paid"}
                            {p.paid_at ? ` · ${formatDateTime(p.paid_at)}` : ""}
                            {p.payment_reference ? ` · Ref: ${p.payment_reference}` : ""}
                          </span>
                        </span>
                        <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                          {formatCurrency(p.amount, p.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {paidTotal > PAID_PAGE_SIZE && (
                <div className="px-5 pb-4">
                  <Pagination
                    currentPage={paidPage}
                    totalPages={Math.ceil(paidTotal / PAID_PAGE_SIZE)}
                    onPageChange={setPaidPage}
                  />
                </div>
              )}
            </section>

            {/* How long approved invoices have gone unpaid */}
            <section className="rounded-2xl border border-brand-border bg-white">
              <header className="px-5 py-4 border-b border-brand-border">
                <h3 className="text-sm font-semibold text-brand-text-primary">
                  Approved and unpaid
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Time since the final approval.
                </p>
              </header>
              {data.ageing.every((b) => b.count === 0) ? (
                <p className="px-5 py-6 text-sm text-brand-text-secondary">
                  Nothing is approved and waiting on payment.
                </p>
              ) : (
                <ul className="divide-y divide-brand-border">
                  {data.ageing.map((b) => {
                    const open = openBucket === b.bucket;
                    return (
                      <li key={b.bucket}>
                        <button
                          type="button"
                          onClick={() => setOpenBucket(open ? null : b.bucket)}
                          disabled={b.count === 0}
                          aria-expanded={open}
                          className="w-full px-5 py-3 flex items-start justify-between gap-3 text-left enabled:hover:bg-gray-50 disabled:cursor-default transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            {b.count > 0 && (
                              <ChevronDown
                                size={15}
                                className={`mt-0.5 shrink-0 text-brand-text-secondary transition-transform ${
                                  open ? "rotate-180" : ""
                                }`}
                              />
                            )}
                            <span>
                              <span className="block text-sm font-medium text-brand-text-primary">
                                {b.bucket}
                              </span>
                              <span className="block text-xs text-brand-text-secondary">
                                {b.count} invoice{b.count === 1 ? "" : "s"}
                                {b.count > 0 && !open ? " · tap to see them" : ""}
                              </span>
                            </span>
                          </div>
                          <span className="text-right">
                            {b.by_currency.length === 0 ? (
                              <span className="text-sm text-brand-text-secondary">—</span>
                            ) : (
                              b.by_currency.map((c) => (
                                <span
                                  key={c.currency}
                                  className="block text-sm text-brand-text-primary tabular-nums"
                                >
                                  {formatCurrency(c.amount, c.currency)}
                                </span>
                              ))
                            )}
                          </span>
                        </button>

                        {open && b.invoices.length > 0 && (
                          <ul className="bg-gray-50/70 border-t border-brand-border divide-y divide-brand-border">
                            {b.invoices.map((inv) => (
                              <li key={inv.id}>
                                <Link
                                  href={`/finance/invoices/${inv.id}`}
                                  className="flex items-start justify-between gap-3 px-5 py-2.5 pl-11 hover:bg-white transition-colors group"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-sm text-brand-text-primary truncate group-hover:text-brand-purple">
                                      {inv.title}
                                    </span>
                                    <span className="block text-xs text-brand-text-secondary truncate">
                                      <span className="font-mono">{inv.reference}</span>
                                      {inv.invoice_number ? ` · Invoice #${inv.invoice_number}` : ""}
                                      {inv.vendor ? ` · ${inv.vendor}` : ""}
                                    </span>
                                    <span className="block text-xs text-brand-text-secondary">
                                      Waiting {inv.days_waiting} day
                                      {inv.days_waiting === 1 ? "" : "s"}
                                    </span>
                                  </span>
                                  <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                                    {formatCurrency(inv.amount, inv.currency)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="px-5 py-3 border-t border-brand-border flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  href="/admin/finance/invoices"
                  className="text-sm text-brand-purple hover:underline inline-flex items-center gap-1.5"
                >
                  Open all invoice requests
                  <ExternalLink size={13} />
                </Link>
                <Link
                  href="/admin/finance/cash-requisitions"
                  className="text-sm text-brand-purple hover:underline inline-flex items-center gap-1.5"
                >
                  Open all cash requisitions
                  <ExternalLink size={13} />
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Who has been approved */}
            <section className="rounded-2xl border border-brand-border bg-white">
              <header className="px-5 py-4 border-b border-brand-border">
                <h3 className="text-sm font-semibold text-brand-text-primary">Recently approved</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Approved, not yet retired
                  {cashApprovedTotal > 0 ? ` · ${cashApprovedTotal} total` : ""}.
                </p>
              </header>
              {cashApprovedRows.length === 0 ? (
                <p className="px-5 py-6 text-sm text-brand-text-secondary">
                  Nothing has been approved yet.
                </p>
              ) : (
                <ul className="divide-y divide-brand-border">
                  {cashApprovedRows.map((r) => (
                    <li key={r.id || r.reference}>
                      <Link
                        href={`/finance/cash-requisitions/${r.id}`}
                        className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-brand-text-primary truncate group-hover:text-brand-purple">
                            {r.title}
                          </span>
                          <span className="block text-xs text-brand-text-secondary truncate">
                            <span className="font-mono">{r.reference}</span>
                            {r.department ? ` · ${r.department}` : ""}
                          </span>
                          <span className="block text-xs text-brand-text-secondary mt-0.5">
                            {r.approved_by_name ? `Approved by ${r.approved_by_name}` : "Approved"}
                            {r.approved_at ? ` · ${formatDateTime(r.approved_at)}` : ""}
                          </span>
                        </span>
                        <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                          {formatCurrency(r.amount, r.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {cashApprovedTotal > PAID_PAGE_SIZE && (
                <div className="px-5 pb-4">
                  <Pagination
                    currentPage={cashApprovedPage}
                    totalPages={Math.ceil(cashApprovedTotal / PAID_PAGE_SIZE)}
                    onPageChange={setCashApprovedPage}
                  />
                </div>
              )}
            </section>

            {/* How long approved cash requisitions have gone unretired */}
            <section className="rounded-2xl border border-brand-border bg-white">
              <header className="px-5 py-4 border-b border-brand-border">
                <h3 className="text-sm font-semibold text-brand-text-primary">
                  Approved, awaiting retirement
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Time since the final approval.
                </p>
              </header>
              {data.cash_ageing.every((b) => b.count === 0) ? (
                <p className="px-5 py-6 text-sm text-brand-text-secondary">
                  Nothing is approved and waiting on retirement.
                </p>
              ) : (
                <ul className="divide-y divide-brand-border">
                  {data.cash_ageing.map((b) => {
                    const open = openBucket === b.bucket;
                    return (
                      <li key={b.bucket}>
                        <button
                          type="button"
                          onClick={() => setOpenBucket(open ? null : b.bucket)}
                          disabled={b.count === 0}
                          aria-expanded={open}
                          className="w-full px-5 py-3 flex items-start justify-between gap-3 text-left enabled:hover:bg-gray-50 disabled:cursor-default transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            {b.count > 0 && (
                              <ChevronDown
                                size={15}
                                className={`mt-0.5 shrink-0 text-brand-text-secondary transition-transform ${
                                  open ? "rotate-180" : ""
                                }`}
                              />
                            )}
                            <span>
                              <span className="block text-sm font-medium text-brand-text-primary">
                                {b.bucket}
                              </span>
                              <span className="block text-xs text-brand-text-secondary">
                                {b.count} requisition{b.count === 1 ? "" : "s"}
                                {b.count > 0 && !open ? " · tap to see them" : ""}
                              </span>
                            </span>
                          </div>
                          <span className="text-right">
                            {b.by_currency.length === 0 ? (
                              <span className="text-sm text-brand-text-secondary">—</span>
                            ) : (
                              b.by_currency.map((c) => (
                                <span
                                  key={c.currency}
                                  className="block text-sm text-brand-text-primary tabular-nums"
                                >
                                  {formatCurrency(c.amount, c.currency)}
                                </span>
                              ))
                            )}
                          </span>
                        </button>

                        {open && b.requisitions.length > 0 && (
                          <ul className="bg-gray-50/70 border-t border-brand-border divide-y divide-brand-border">
                            {b.requisitions.map((req) => (
                              <li key={req.id}>
                                <Link
                                  href={`/finance/cash-requisitions/${req.id}`}
                                  className="flex items-start justify-between gap-3 px-5 py-2.5 pl-11 hover:bg-white transition-colors group"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-sm text-brand-text-primary truncate group-hover:text-brand-purple">
                                      {req.title}
                                    </span>
                                    <span className="block text-xs text-brand-text-secondary truncate">
                                      <span className="font-mono">{req.reference}</span>
                                      {req.department ? ` · ${req.department}` : ""}
                                    </span>
                                    <span className="block text-xs text-brand-text-secondary">
                                      Waiting {req.days_waiting} day
                                      {req.days_waiting === 1 ? "" : "s"}
                                    </span>
                                  </span>
                                  <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                                    {formatCurrency(req.amount, req.currency)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="px-5 py-3 border-t border-brand-border flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  href="/admin/finance/cash-requisitions"
                  className="text-sm text-brand-purple hover:underline inline-flex items-center gap-1.5"
                >
                  Open all cash requisitions
                  <ExternalLink size={13} />
                </Link>
                <Link
                  href="/admin/finance/invoices"
                  className="text-sm text-brand-purple hover:underline inline-flex items-center gap-1.5"
                >
                  Open all invoice requests
                  <ExternalLink size={13} />
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
