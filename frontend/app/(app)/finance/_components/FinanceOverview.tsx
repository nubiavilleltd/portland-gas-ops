"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Wallet, CheckCircle2, XCircle, ExternalLink, ChevronDown } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  useFinanceDashboard,
  usePaidInvoices,
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
  breakdown?: { label: string; count: number; by_currency: CurrencyAmount[] }[];
}) {
  // Drilled into one currency, the amount is finally a single meaningful
  // figure, so it leads. Across all currencies only the count can.
  const styles = CARD_VARIANTS[variant];
  const single = currency ? summary.by_currency.find((c) => c.currency === currency) : undefined;
  const headline = currency
    ? formatCurrency(single?.amount ?? 0, currency)
    : String(summary.count);

  const body = (
    <div className={`rounded-2xl p-5 h-full transition-colors ${styles.container}`}>
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
          {breakdown.map((b) => (
            <div key={b.label}>
              <p className="text-xs text-brand-text-secondary">
                {b.label} · {b.count}
              </p>
              <p className="text-sm text-brand-text-primary tabular-nums">
                {b.by_currency.length === 0
                  ? "—"
                  : b.by_currency
                      .map((c) => formatCurrency(c.amount, c.currency))
                      .join("  ·  ")}
              </p>
            </div>
          ))}
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

export default function FinanceOverview() {
  const [currency, setCurrency] = useState<string | null>(null);
  const [paidPage, setPaidPage] = useState(1);
  const [openBucket, setOpenBucket] = useState<string | null>(null);
  const { data, isLoading, isError, isFetching } = useFinanceDashboard(currency);
  const { data: paid } = usePaidInvoices(currency, paidPage);

  function selectCurrency(next: string | null) {
    setCurrency(next);
    setPaidPage(1);
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

  const awaitingApproval: Summary = {
    count:
      data.awaiting_approval.invoices.count +
      data.awaiting_approval.cash_requisitions.count,
    by_currency: [
      ...data.awaiting_approval.invoices.by_currency,
      ...data.awaiting_approval.cash_requisitions.by_currency,
    ].reduce<CurrencyAmount[]>((acc, row) => {
      const hit = acc.find((a) => a.currency === row.currency);
      if (hit) {
        hit.count += row.count;
        hit.amount += row.amount;
      } else {
        acc.push({ ...row });
      }
      return acc;
    }, []),
  };

  // When drilled into a currency the split has to count only that currency's
  // rows, otherwise the breakdown would contradict the headline above it.
  const countIn = (summary: Summary) =>
    currency
      ? summary.by_currency.find((c) => c.currency === currency)?.count ?? 0
      : summary.count;

  // Honour the currency filter so the split cannot contradict the headline.
  const forCurrency = (summary: Summary) =>
    currency
      ? summary.by_currency.filter((c) => c.currency === currency)
      : summary.by_currency;

  const invoicesAwaiting = countIn(data.awaiting_approval.invoices);
  const cashAwaiting = countIn(data.awaiting_approval.cash_requisitions);

  const paidRows = paid?.data ?? data.recently_paid;
  const paidTotal = paid?.total ?? data.recently_paid.length;

  return (
    <div className="mb-8 space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Awaiting approval"
          currency={currency}
          summary={awaitingApproval}
          icon={<Clock size={18} />}
          variant="warning"
          breakdown={[
            {
              label: "Invoices",
              count: invoicesAwaiting,
              by_currency: forCurrency(data.awaiting_approval.invoices),
            },
            {
              label: "Cash requisitions",
              count: cashAwaiting,
              by_currency: forCurrency(data.awaiting_approval.cash_requisitions),
            },
          ]}
        />
        <SummaryCard
          label="Approved — awaiting payment"
          currency={currency}
          summary={data.awaiting_payment}
          icon={<Wallet size={18} />}
          variant="primary"
          sources={[plural(countIn(data.awaiting_payment), "invoice", "invoices")]}
        />
        <SummaryCard
          label="Paid"
          currency={currency}
          summary={data.paid}
          icon={<CheckCircle2 size={18} />}
          variant="success"
          sources={[plural(countIn(data.paid), "invoice", "invoices")]}
        />
        <SummaryCard
          label="Cancelled"
          currency={currency}
          summary={data.cancelled}
          icon={<XCircle size={18} />}
          variant="danger"
          sources={[plural(countIn(data.cancelled), "invoice", "invoices")]}
        />
      </div>

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
    </div>
  );
}
