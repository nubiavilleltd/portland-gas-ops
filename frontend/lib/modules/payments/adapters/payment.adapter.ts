import type { Payment, PaymentAttachment, PaymentMethod } from "../types/payments.types";

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
    attachments?: BackendPaymentAttachment[];
    created_at: string;
}

interface BackendPaymentList {
    items: BackendPayment[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

interface BackendPaymentAttachment {
  id: string;
  file_name: string;
  file_url: string;
}

function adaptPaymentAttachment(
  raw: BackendPaymentAttachment
): PaymentAttachment {
  return {
    id: raw.id,
    fileName: raw.file_name,
    url: raw.file_url,
  };
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
    attachments: (raw.attachments ?? []).map(adaptPaymentAttachment),

    createdAt: raw.created_at,
  };
}
export function adaptPaymentList(raw: BackendPaymentList): Payment[] {
    return raw.items.map(adaptPayment);
}