// lib/modules/invoices/hooks/useCreateInvoiceWorkflow.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createInvoiceWorkflow } from "../workflows/createInvoice.workflow";
import type { InvoiceForm } from "../schemas/invoice.schema";
import type { Order } from "@/lib/modules/orders/types/orders.types";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";
import { INVOICE_KEYS } from "../constants/query-keys";
import { INVOICE_ROUTES } from "../constants/routes";

// export function useCreateInvoiceWorkflow(order: Order) {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (data: InvoiceForm) => createInvoiceWorkflow(order, data),

//     onSuccess: () => {
//       // Invalidate both order and invoice caches
//       queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(order.id) });
//       queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
//     },
//   });
// }

export function useCreateInvoiceWorkflow(order: Order) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceForm) => createInvoiceWorkflow(order, data),

    onSuccess: (invoice) => {
      queryClient.setQueryData(
        ORDER_KEYS.detail(order.id),
        (old: Order | undefined) =>
          old
            ? {
                ...old,
                invoiceId: invoice.id,
              }
            : old,
      );
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.detail(order.id),
      });

      queryClient.invalidateQueries({
        queryKey: INVOICE_KEYS.lists(),
      });
    },
  });
}
