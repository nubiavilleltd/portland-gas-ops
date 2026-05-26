"use client";

// ============================================================
//  INVOICES HOOKS
//
//  useInvoices()                  — fetches all invoices via service
//  useInvoiceById(id)             — finds one invoice by id
//  useInvoiceByOrderId(orderId)   — finds invoice linked to an order
//
//  TODAY:   useEffect + service call (mock data)
//  FUTURE:  swap useEffect body for useQuery — components unchanged
//
//  FUTURE SWAP (useInvoices):
//    return useQuery({
//      queryKey: INVOICE_KEYS.invoices,
//      queryFn:  () => InvoicesService.getInvoices(),
//    });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { InvoicesService } from "@/lib/services/api/invoices.service";
import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import {
  getInvoiceById,
  getInvoiceByOrderId,
} from "@/lib/modules/invoices/selectors/invoices.selectors";
import { parseError } from "@/lib/errors";

// ── Shared result shape ────────────────────────────────────
interface UseInvoicesResult {
  invoices:  Invoice[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

// ── Base hook ─────────────────────────────────────────────
export function useInvoices(): UseInvoicesResult {
  const [invoices,  setInvoices]  = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await InvoicesService.getInvoices();
      setInvoices(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { invoices, isLoading, error, refetch: fetch };
}

// ── Derived: single invoice by id ────────────────────────
interface UseInvoiceByIdResult {
  invoice:   Invoice | undefined;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useInvoiceById(id: string): UseInvoiceByIdResult {
  const { invoices, isLoading, error, refetch } = useInvoices();
  const invoice = getInvoiceById(invoices, id);   // selector
  return { invoice, isLoading, error, refetch };
}

// ── Derived: invoice linked to an order ──────────────────
export function useInvoiceByOrderId(orderId: string): UseInvoiceByIdResult {
  const { invoices, isLoading, error, refetch } = useInvoices();
  const invoice = getInvoiceByOrderId(invoices, orderId);   // selector
  return { invoice, isLoading, error, refetch };
}
// ── Derived: invoice linked to an order ──────────────────
export function useInvoiceByPaymentId(paymentId: string): UseInvoiceByIdResult {
  const { invoices, isLoading, error, refetch } = useInvoices();
  const invoice = getInvoiceByOrderId(invoices, paymentId);   // selector
  return { invoice, isLoading, error, refetch };
}