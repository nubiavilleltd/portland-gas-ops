
"use client";
import { useQuery } from "@tanstack/react-query";
import { InvoicesService } from "../services/invoice.services";
import { getInvoiceById, getInvoiceByNo, getInvoiceByOrderId } from "../selectors/invoices.selectors";
import { parseError } from "@/lib/errors";
import { INVOICE_KEYS } from "../constants/query-keys";

export function useInvoices() {
  const query = useQuery({
    queryKey: INVOICE_KEYS.lists(),
    queryFn:  InvoicesService.getInvoices,
    staleTime: 30 * 1000,
  });
  return {
    invoices:  query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error:     query.error ? parseError(query.error) : null,
    refetch:   query.refetch,
  };
}

export function useInvoiceById(id: string) {
  const { invoices, isLoading, isFetching, error, refetch } = useInvoices();
  return { invoice: getInvoiceById(invoices, id), isLoading, isFetching, error, refetch };
}
export function useInvoiceByNo(invoiceNo: string) {
  const { invoices, isLoading, isFetching, error, refetch } = useInvoices();
  return { invoice: getInvoiceByNo(invoices, invoiceNo), isLoading, isFetching, error, refetch };
}

export function useInvoiceByOrderId(orderId: string) {
  const { invoices, isLoading, isFetching, error, refetch } = useInvoices();
  return { invoice: getInvoiceByOrderId(invoices, orderId), isLoading, isFetching, error, refetch };
}
