import type { Order, OrderLineItem, OrderStatus, FulfillmentStatus } from "../types/orders.types";
import type { PaymentStatus } from "../../payments/types/payments.types";

interface BackendOrderItem {
    id: number;
    product_id: string;
    product_name: string;
    quantity: string | number;
    unit_price: string | number;
    total: string | number;
    disposition: string | null;
}

interface BackendOrder {
    id: string;
    order_no: string | null;
    customer_id: string;
    customer_name: string;
    order_status: string;
    fulfillment_status: string;
    payment_status: string;
    delivery_address: string;
    delivery_date: string | null;
    notes: string | null;
    total_amount: string | number;
    order_items: BackendOrderItem[];
    cancellation_reason: string | null;
    cancelled_at: string | null;
    trip_id: string | null;
    invoice_id: string | null;
    confirmed_at: string | null;
    delivered_at: string | null;
    created_at: string;
    updated_at: string;
}

interface BackendOrderList {
    items: BackendOrder[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

function adaptItem(raw: BackendOrderItem): OrderLineItem {
    return {
        product_id: raw.product_id,
        product_name: raw.product_name,
        quantity: Number(raw.quantity),
        unit_price: Number(raw.unit_price),
        total: Number(raw.total),
        disposition: raw.disposition as any ?? undefined,
    };
}

export function adaptOrder(raw: BackendOrder): Order {
    return {
        id: raw.id,
        order_number: raw.order_no ?? raw.id,
        customer_id: raw.customer_id,
        customer_name: raw.customer_name,
        order_items: (raw.order_items ?? []).map(adaptItem),
        total_amount: Number(raw.total_amount),
        delivery_address: raw.delivery_address,
        delivery_date: raw.delivery_date ?? null,
        notes: raw.notes ?? undefined,
        order_status: raw.order_status as OrderStatus,
        fulfillment_status: raw.fulfillment_status as FulfillmentStatus,
        payment_status: raw.payment_status as PaymentStatus,
        cancellation_reason: raw.cancellation_reason ?? undefined,
        trip_id: raw.trip_id ?? undefined,
        invoice_id: raw.invoice_id ?? undefined,
        created_at: raw.created_at,
        confirmed_at: raw.confirmed_at ?? undefined,
        delivered_at: raw.delivered_at ?? undefined,
        cancelled_at: raw.cancelled_at ?? undefined,
    };
}

export function adaptOrderList(raw: BackendOrderList): Order[] {
    return raw.items.map(adaptOrder);
}