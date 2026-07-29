"use client";

import { useQuery } from "@tanstack/react-query";

import { PaymentsService } from "@/lib/modules/payments/services/payments.service";

import {
  getPaymentById,
  getPaymentByNo,
  getPaymentsByInvoice,
  getPaymentSummary,
  getTotalPaidForInvoice,
} from "@/lib/modules/payments/selectors/payments.selectors";

import { parseError } from "@/lib/errors";

import type { Payment } from "../types/payments.types";

import { PAYMENT_KEYS } from "@/lib/query-keys";

// ─────────────────────────────────────────────
// BASE HOOK
// ─────────────────────────────────────────────

export function usePayments() {
  const query = useQuery({
    queryKey: PAYMENT_KEYS.lists(),
    queryFn: PaymentsService.getPayments,
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────
// SINGLE PAYMENT
// ─────────────────────────────────────────────

export function usePaymentById(id: string) {
  const { payments, isLoading, isFetching, error, refetch } = usePayments();

  const payment = getPaymentById(payments, id);

  return {
    payment,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function usePaymentByNo(paymentNo: string) {
  const { payments, isLoading, isFetching, error, refetch } = usePayments();
  const payment = getPaymentByNo(payments, paymentNo);
  return { payment, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────
// PAYMENTS BY INVOICE
// ─────────────────────────────────────────────

export function usePaymentsByInvoice(invoiceId: string) {
  const { payments, isLoading, isFetching, error, refetch } = usePayments();

  const invoicePayments = getPaymentsByInvoice(
    payments,
    invoiceId
  );

  return {
    payments: invoicePayments,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────
// PAYMENT SUMMARY
// ─────────────────────────────────────────────

export function usePaymentSummary(
  invoiceId: string | undefined
) {
  const { payments, isLoading, isFetching, error, refetch } = usePayments();

  const summary = getPaymentSummary(
    payments,
    invoiceId
  );

  return {
    summary,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────
// TOTAL PAID
// ─────────────────────────────────────────────

export function useTotalPaidForInvoice(
  invoiceId: string
) {
  const { payments, isLoading, isFetching, error, refetch } = usePayments();

  const totalPaid = getTotalPaidForInvoice(
    payments,
    invoiceId
  );

  return {
    totalPaid,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}