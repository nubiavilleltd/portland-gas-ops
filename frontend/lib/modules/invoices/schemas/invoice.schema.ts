// import { z } from "zod";

// export const invoiceSchema = z.object({
//   invoice_date: z.string().min(1, "Invoice date is required"),
//   due_date: z.string().min(1, "Due date is required"),
//   notes: z.string().optional(),
// });

// export type InvoiceForm = z.infer<typeof invoiceSchema>;


import { z } from "zod";

export function createInvoiceSchema(orderDate: string) {
  return z
    .object({
      invoice_date: z.string().min(1, "Invoice date is required"),
      due_date: z.string().min(1, "Due date is required"),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const order = new Date(orderDate);
      const invoice = new Date(data.invoice_date);
      const due = new Date(data.due_date);

      // Invoice cannot be before the order
      if (invoice < order) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["invoice_date"],
          message: "Invoice date cannot be earlier than the order date.",
        });
      }

      // Due date cannot be before invoice date
      if (due < invoice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["due_date"],
          message: "Due date cannot be earlier than the invoice date.",
        });
      }
    });
}

export type InvoiceForm = z.infer<
  ReturnType<typeof createInvoiceSchema>
>;