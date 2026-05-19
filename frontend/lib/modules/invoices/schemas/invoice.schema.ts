import { z } from "zod";

export const invoiceSchema = z.object({
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

export type InvoiceForm = z.infer<typeof invoiceSchema>;