"use client";

// ============================================================
//  PAYMENTS HOOKS
//
//  usePayments()                    — fetches all payments via service
//  usePaymentById(id)               — finds one payment by id
//  usePaymentsByInvoice(invoiceId)  — all payments for an invoice
//  useTotalPaidForInvoice(id)       — sum paid for an invoice
//
//  TODAY:   useEffect + service call (mock data)
//  FUTURE:  swap useEffect body for useQuery — components unchanged
//
//  FUTURE SWAP (usePayments):
//    return useQuery({
//      queryKey: PAYMENT_KEYS.payments,
//      queryFn:  () => PaymentsService.getPayments(),
//    });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { PaymentsService } from "@/lib/services/api/payments.service";
import type { Payment } from "@/lib/mock/payments";
import {
    getPaymentById,
    getPaymentsByInvoice,
    getTotalPaidForInvoice,
} from "@/lib/modules/payments/selectors/payments.selectors";
import { parseError } from "@/lib/errors";

// ── Shared result shape ────────────────────────────────────
interface UsePaymentsResult {
    payments: Payment[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// ── Base hook ─────────────────────────────────────────────
export function usePayments(): UsePaymentsResult {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await PaymentsService.getPayments();
            setPayments(data);
        } catch (err) {
            setError(parseError(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return { payments, isLoading, error, refetch: fetch };
}

// ── Derived: single payment ───────────────────────────────
interface UsePaymentByIdResult {
    payment: Payment | undefined;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function usePaymentById(id: string): UsePaymentByIdResult {
    const { payments, isLoading, error, refetch } = usePayments();
    const payment = getPaymentById(payments, id);   // selector
    return { payment, isLoading, error, refetch };
}

// ── Derived: all payments for one invoice ─────────────────
export function usePaymentsByInvoice(invoiceId: string): UsePaymentsResult {
    const { payments, isLoading, error, refetch } = usePayments();
    const invoicePayments = getPaymentsByInvoice(payments, invoiceId);   // selector
    return { payments: invoicePayments, isLoading, error, refetch };
}

// ── Derived: total amount paid for one invoice ────────────
interface UseTotalPaidResult {
    totalPaid: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useTotalPaidForInvoice(invoiceId: string): UseTotalPaidResult {
    const { payments, isLoading, error, refetch } = usePayments();
    const totalPaid = getTotalPaidForInvoice(payments, invoiceId);   // selector
    return { totalPaid, isLoading, error, refetch };
}