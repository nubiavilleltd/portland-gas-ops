export interface Payment {
  id: string;

  invoice_id: string;

  payment_reference: string;

  amount: number;

  payment_method:
    | "bank_transfer"
    | "cash"
    | "cheque";

  payment_date: string;

  recorded_by: string;
}

export const payments: Payment[] = [
  {
    id: "pay-1",

    invoice_id: "inv-1",

    payment_reference: "PAY-20260516-001",

    amount: 5000000,

    payment_method: "bank_transfer",

    payment_date: "2026-05-16",

    recorded_by: "Admin User",
  },

  {
    id: "pay-2",

    invoice_id: "inv-1",

    payment_reference: "PAY-20260518-002",

    amount: 2000000,

    payment_method: "cash",

    payment_date: "2026-05-18",

    recorded_by: "Finance Officer",
  },
];