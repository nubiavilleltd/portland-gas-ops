
import { Invoice } from "../types/invoice.types";

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    order_id: "ord-1",
    invoice_number: "INV-20260515-001",
    total_amount: 10200000,
    status: "partially_paid",
    issued_date: "2026-05-15",
    due_date: "2026-05-30",
  },

  {
    id: "inv-2",
    order_id: "ord-2",
    invoice_number: "INV-20260514-002",
    total_amount: 10200000,
    status: "unpaid",
    issued_date: "2026-05-14",
    due_date: "2026-05-28",
  },

  {
    id: "inv-3",
    order_id: "ord-3",
    invoice_number: "INV-20260513-003",
    total_amount: 4250000,
    status: "paid",
    issued_date: "2026-05-13",
    due_date: "2026-05-27",
  },
  {
    id: "inv-4",
    order_id: "ord-4",
    invoice_number: "INV-20260512-004",
    total_amount: 9050000,
    status: "paid",
    issued_date: "2026-05-12",
    due_date: "2026-05-26",
  },
];