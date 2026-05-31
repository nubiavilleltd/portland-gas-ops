export type PaymentMethod = "bank_transfer" | "cash" | "card" | "cheque";

export interface Payment {
  id: string;

  invoice_id: string;

  payment_reference: string;

  amount: number;

  payment_method: PaymentMethod;

  payment_date: string;

  recorded_by: string;
}


export interface CreatePaymentInput {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod
  payment_date: string;
  reference?: string;
  recorded_by?: string;
}


export const PAYMENT_METHOD_LABELS:Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  cheque: "Cheque",
};


export const PAYMENT_METHOD_OPTIONS  = [
  {
    value: "bank_transfer",
    label: "Bank Transfer",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "cheque",
    label: "Cheque",
  },
];


export const PAYMENT_METHODS_ARRAY: PaymentMethod[] = [
    "bank_transfer",
    "cash",
    "card",
    "cheque"
  ]