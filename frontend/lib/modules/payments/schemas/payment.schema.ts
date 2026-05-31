import { z } from "zod";
import { PAYMENT_METHODS_ARRAY } from "../types/payments.types";

export const paymentSchema = z.object({
  payment_date: z.string().min(1),
  // amount: z.number().min(1, "Amount must be greater than 0"),
  amount: z.coerce
    .number()
    .min(1, "Amount must be greater than 0"),
  reference: z.string().optional(),
  payment_method: z.enum(PAYMENT_METHODS_ARRAY),
});

// export type PaymentForm = z.infer<typeof paymentSchema>;

export type PaymentFormInput = z.input<typeof paymentSchema>;
export type PaymentForm = z.output<typeof paymentSchema>;