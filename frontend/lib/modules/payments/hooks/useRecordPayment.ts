// lib/modules/payments/hooks/useRecordPayment.ts
"use client";

import { useState } from "react";
import { PaymentsService } from "@/lib/services/api/payments.service";
import { CreatePaymentInput } from "../types/payments.types";

export function useRecordPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recordPayment(input: CreatePaymentInput) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await PaymentsService.recordPayment(input);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to record payment";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    recordPayment,
    isLoading,
    error,
  };
}