"use client";

import { useQuery } from "@tanstack/react-query";

import { parseError } from "@/lib/errors";

import { InvoicesService } from "../services/invoice.services";
import { INVOICE_KEYS } from "../constants/query-keys";

export function useInvoices() {
  const query = useQuery({
    queryKey: INVOICE_KEYS.lists(),
    queryFn: () => InvoicesService.getInvoices(),
    staleTime: 60 * 1000,
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useInvoiceById(invoiceId: string) {
  const query = useQuery({
    queryKey: INVOICE_KEYS.detail(invoiceId),
    queryFn: () => InvoicesService.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 60 * 1000,
  });

  return {
    invoice: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useInvoiceByOrderId(orderId: string) {
  const query = useQuery({
    queryKey: [...INVOICE_KEYS.details(), "order", orderId],
    queryFn: () => InvoicesService.getInvoiceByOrderId(orderId),
    enabled: !!orderId,
    staleTime: 60 * 1000,
  });

  return {
    invoice: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// export function useInvoiceByNo(invoiceNo: string) {
//   const query = useQuery({
//     queryKey: [...INVOICE_KEYS.details(), "number", invoiceNo],
//     queryFn: () => InvoicesService.getInvoiceByNo(invoiceNo),
//     enabled: !!invoiceNo,
//     staleTime: 60 * 1000,
//   });

//   return {
//     invoice: query.data,
//     isLoading: query.isLoading,
//     isFetching: query.isFetching,
//     error: query.error ? parseError(query.error) : null,
//     refetch: query.refetch,
//   };
// }
