export type PaymentMethod = "bank_transfer" | "cash" | "card" | "cheque";

export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void";


  export interface PaymentAttachment {
    id: string;
    fileName: string;
    url: string;
}



export interface Payment {
  id: string;

  paymentNo: string;

  invoiceId: string;

  invoiceNo: string;

  reference: string;

  amount: number;

  method: PaymentMethod;

  paymentDate: string;

  recordedBy: string;

  createdAt: string;
  attachments: PaymentAttachment[];
}


export interface CreatePaymentInput {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod
  payment_date: string;
  reference?: string;
  attachment?: File;
  recorded_by?: string;

  paymentProofs: File[];
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


  // payments.types.ts — add alongside the PaymentStatus type
export function isSettled(status: PaymentStatus): boolean {
  return status === "paid" || status === "void";
}

export function needsPayment(status: PaymentStatus): boolean {
  return status === "unpaid" || status === "partially_paid" || status === "overdue";
}