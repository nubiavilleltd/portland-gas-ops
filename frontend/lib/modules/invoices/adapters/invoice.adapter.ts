import type { Invoice } from "../types/invoice.types";
import type { PaymentStatus } from "../../payments/types/payments.types";

interface BackendInvoice {
    id: string;
    invoice_no: string | null;
    order_id: string;
    order_no: string | null;
    total_amount: string | number;
    status: string;
    issued_date: string;
    due_date: string;
    notes: string | null;
    created_at: string;
    created_by_name:string;
}

interface BackendInvoiceList {
    items: BackendInvoice[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

export function adaptInvoice(raw: BackendInvoice): Invoice {
    return {
        id: raw.id,   
        order_id: raw.order_id,
        order_no: raw.order_no,
        invoice_number: raw.invoice_no ?? raw.id,
        total_amount: Number(raw.total_amount),
        status: raw.status as PaymentStatus,
        issued_date: raw.issued_date,
        due_date: raw.due_date,
        created_by_name:raw.created_by_name
    };
}

export function adaptInvoiceList(raw: BackendInvoiceList): Invoice[] {
    return raw.items.map(adaptInvoice);
}