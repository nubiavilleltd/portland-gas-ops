// lib/modules/payments/hooks/useRecordPaymentWorkflow.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { recordPaymentWorkflow } from "../workflows/recordPayment.workflow";
import type { PaymentForm } from "../schemas/payment.schema";
import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PAYMENT_KEYS, INVOICE_KEYS, ORDER_KEYS } from "@/lib/query-keys";
import { INVOICE_ROUTES } from "@/lib/routes";

export function useRecordPaymentWorkflow(invoice: Invoice) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: PaymentForm) => recordPaymentWorkflow(invoice, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });

      toast.success("Payment recorded successfully");
      router.push(INVOICE_ROUTES.detail(invoice.id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to record payment");
    },
  });
}