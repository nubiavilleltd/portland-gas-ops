import type { Payment, PaymentMethod } from "../types/payments.types";

interface BackendPayment {
    id: string;
    payment_no: string | null;
    invoice_id: string;
    invoice_no: string | null;
    amount: string | number;
    method: string;
    payment_date: string;
    reference: string | null;
    recorded_by: string;
    created_at: string;
}

interface BackendPaymentList {
    items: BackendPayment[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

export function adaptPayment(raw: BackendPayment): Payment {
  return {
    id: raw.id,

    paymentNo: raw.payment_no ?? raw.id,

    invoiceId: raw.invoice_id,

    invoiceNo: raw.invoice_no ?? raw.invoice_id,

    reference: raw.reference ?? raw.payment_no ?? raw.id,

    amount: Number(raw.amount),

    method: raw.method as PaymentMethod,

    paymentDate: raw.payment_date,

    recordedBy: raw.recorded_by,

    createdAt: raw.created_at,
  };
}
export function adaptPaymentList(raw: BackendPaymentList): Payment[] {
    return raw.items.map(adaptPayment);
}