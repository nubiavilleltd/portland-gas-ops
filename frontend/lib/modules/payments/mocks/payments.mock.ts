import { Payment } from "../types/payments.types";


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






// const payments = [
//   {
//     id: "pay-001",
//     reference: "PAY-20260501-001",
//     invoice_number: "INV-2026-001",
//     amount: 5000000,
//     payment_date: "2026-05-10",
//     payment_method: "bank_transfer",
//   },
//   {
//     id: "pay-002",
//     reference: "PAY-20260503-002",
//     invoice_number: "INV-2026-002",
//     amount: 2500000,
//     payment_date: "2026-05-12",
//     payment_method: "cash",
//   },
// ];

