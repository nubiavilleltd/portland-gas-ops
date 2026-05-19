import { Invoice } from "../types/invoice.types";

export const invoices: Invoice[] = [
  {
    id: "inv-1",

    order_id: "1",

    invoice_number: "INV-20260515-001",

    total_amount: 10200000,

    status: "partially_paid",

    issued_date: "2026-05-15",

    due_date: "2026-05-30",
  },

  {
    id: "inv-2",

    order_id: "2",

    invoice_number: "INV-20260514-002",

    total_amount: 7650000,

    status: "unpaid",

    issued_date: "2026-05-14",

    due_date: "2026-05-28",
  },
];