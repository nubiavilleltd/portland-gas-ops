import { z } from "zod";
import { PAYMENT_METHODS_ARRAY, PaymentMethod } from "../types/payments.types";

const today = new Date().toISOString().split("T")[0];

export const paymentSchema = z
  .object({
     payment_date: z
      .string()
      .min(1, "Payment date is required.")
      .refine(
        (date) => date <= today,
        {
          message: "Payment date cannot be in the future.",
        }
      ),

    amount: z.coerce
      .number()
      .min(1, "Amount must be greater than 0"),

  payment_method: z
  .string()
  .min(1, "Please select a payment method.")
  .refine(
    (value): value is PaymentMethod =>
      PAYMENT_METHODS_ARRAY.includes(value as PaymentMethod),
    {
      message: "Please select a payment method.",
    }
  ),
    reference: z.string().optional(),

   paymentProofs: z
  .array(z.instanceof(File))
  })
  .superRefine((data, ctx) => {
    const requiresProof = data.payment_method !== "cash";

    if (requiresProof && !data.reference?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reference"],
        message: "Reference is required.",
      });
    }

    if (
      requiresProof &&
      data.paymentProofs.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentProofs"],
        message: "Payment proof is required.",
      });
    }
  });

export type PaymentFormInput = z.input<typeof paymentSchema>;
export type PaymentForm = z.output<typeof paymentSchema>;
// export type RecordPaymentForm = PaymentForm & {
//   paymentProofs: File[];
// };