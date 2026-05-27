// // lib/modules/payments/hooks/useRecordPayment.ts
// "use client";

// import { useState } from "react";
// import { PaymentsService } from "@/lib/modules/payments/services/payments.service";
// import { CreatePaymentInput } from "../types/payments.types";

// export function useRecordPayment() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   async function recordPayment(input: CreatePaymentInput) {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const result = await PaymentsService.recordPayment(input);
//       return result;
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Failed to record payment";
//       setError(message);
//       throw err;
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   return {
//     recordPayment,
//     isLoading,
//     error,
//   };
// }







"use client";

import { useMutation } from "@tanstack/react-query";
import { PaymentsService } from "@/lib/modules/payments/services/payments.service";
import { CreatePaymentInput } from "../types/payments.types";
import { PAYMENT_KEYS } from "@/lib/query-keys";
import { INVOICE_KEYS } from "@/lib/query-keys";
import { queryClient } from "@/components/Providers";

export function useRecordPayment() {
  const mutation = useMutation({
    mutationFn: (input: CreatePaymentInput) =>
      PaymentsService.recordPayment(input),

    onSuccess: async () => {
      // invalidate payment list
      await queryClient.invalidateQueries({
        queryKey: PAYMENT_KEYS.payments,
      });

      // payments affect invoices too
      await queryClient.invalidateQueries({
        queryKey: INVOICE_KEYS.invoices,
      });
    },
  });

  return {
    recordPayment: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error:
      mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}