"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";

/**
 * Finance overview data.
 *
 * Amounts are always per-currency. The data carries NGN, EUR, GBP and USD side
 * by side, so there is deliberately no single blended total to render.
 */

export interface CurrencyAmount {
  currency: string;
  count: number;
  amount: number;
}

export interface Summary {
  count: number;
  by_currency: CurrencyAmount[];
}

export interface PaidInvoice {
  id: string;
  reference: string;
  title: string;
  vendor: string | null;
  amount: number;
  currency: string;
  paid_at: string | null;
  payment_reference: string | null;
  paid_by_name: string | null;
}

export interface AgeingInvoice {
  id: string;
  reference: string;
  title: string;
  vendor: string | null;
  invoice_number: string | null;
  amount: number;
  currency: string;
  approved_at: string | null;
  days_waiting: number;
}

export interface AgeingBucket {
  bucket: string;
  count: number;
  by_currency: CurrencyAmount[];
  /** The invoices behind the number, longest-waiting first. */
  invoices: AgeingInvoice[];
}

export interface FinanceDashboard {
  /** Every currency in play — stays complete even while one is selected. */
  currencies: string[];
  /** The currency currently drilled into, or null for all. */
  currency: string | null;
  awaiting_approval: {
    invoices: Summary;
    cash_requisitions: Summary;
  };
  awaiting_payment: Summary;
  paid: Summary;
  cancelled: Summary;
  recently_paid: PaidInvoice[];
  ageing: AgeingBucket[];
}

export function useFinanceDashboard(currency?: string | null) {
  return useQuery<FinanceDashboard>({
    queryKey: ["finance-dashboard", currency ?? "all"],
    queryFn: () =>
      get<FinanceDashboard>(
        "/api/finance/dashboard",
        currency ? { currency } : undefined,
      ),
    // Keep the previous currency's numbers on screen while the next load runs,
    // so switching currency doesn't flash the whole page back to skeletons.
    placeholderData: (prev) => prev,
    // Refreshed rather than streamed: the numbers move on approvals and
    // payments, which are minutes apart, so polling reads as live without the
    // cost of a socket.
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export interface PaidInvoicePage {
  data: PaidInvoice[];
  total: number;
  skip: number;
  limit: number;
}

export const PAID_PAGE_SIZE = 6;

/**
 * The settled-invoice feed, paged separately from the dashboard so turning a
 * page does not re-run the aggregates behind the summary cards.
 */
export function usePaidInvoices(currency: string | null, page: number) {
  return useQuery<PaidInvoicePage>({
    queryKey: ["finance-paid-invoices", currency ?? "all", page],
    queryFn: () =>
      get<PaidInvoicePage>("/api/finance/paid-invoices", {
        ...(currency ? { currency } : {}),
        skip: (page - 1) * PAID_PAGE_SIZE,
        limit: PAID_PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
