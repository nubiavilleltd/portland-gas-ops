import type { Payment } from "../types/payments.types";
import type { PaymentMethod } from "../types/payments.types";

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
        id: raw.payment_no ?? raw.id,
        invoice_id: raw.invoice_no ?? raw.invoice_id,  // use invoice_no for frontend navigation
        reference: raw.reference ?? raw.payment_no ?? raw.id,
        amount: Number(raw.amount),
        method: raw.method as PaymentMethod,
        date: raw.payment_date,
        recorded_by: raw.recorded_by,
    };
}

export function adaptPaymentList(raw: BackendPaymentList): Payment[] {
    return raw.items.map(adaptPayment);
}