import { z } from "zod";

export const paymentSchema = z.object({
  payment_date: z.string().min(1),
  amount: z.number().min(1, "Amount must be greater than 0"),
  reference: z.string().optional(),
  payment_method: z.enum([
    "bank_transfer",
    "cash",
    "card",
  ]),
});

export type PaymentForm = z.infer<typeof paymentSchema>;