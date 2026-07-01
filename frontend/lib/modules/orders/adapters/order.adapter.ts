// import type { Order, OrderLineItem, OrderStatus, FulfillmentStatus } from "../types/orders.types";
// import type { PaymentStatus } from "../../payments/types/payments.types";

// interface BackendOrderItem {
//     id: number;
//     product_id: string;
//     product_name: string;
//     quantity: string | number;
//     unit_price: string | number;
//     total: string | number;
//     disposition: string | null;
// }

// interface BackendOrder {
//     id: string;
//     order_no: string | null;
//     customer_id: string;
//     customer_name: string;
//     order_status: string;
//     fulfillment_status: string;
//     payment_status: string;
//     delivery_address: string;
//     delivery_date: string | null;
//     notes: string | null;
//     total_amount: string | number;
//     order_items: BackendOrderItem[];
//     cancellation_reason: string | null;
//     cancelled_at: string | null;
//     trip_id: string | null;
//     invoice_id: string | null;
//     confirmed_at: string | null;
//     delivered_at: string | null;
//     created_at: string;
//     updated_at: string;
// }

// interface BackendOrderList {
//     items: BackendOrder[];
//     total: number;
//     page: number;
//     page_size: number;
//     has_next: boolean;
// }

// function adaptItem(raw: BackendOrderItem): OrderLineItem {
//     return {
//         product_id: raw.product_id,
//         product_name: raw.product_name,
//         quantity: Number(raw.quantity),
//         unit_price: Number(raw.unit_price),
//         total: Number(raw.total),
//         disposition: raw.disposition as any ?? undefined,
//     };
// }

// export function adaptOrder(raw: BackendOrder): Order {
//     return {
//         id: raw.id,
//         order_number: raw.order_no ?? raw.id,
//         customer_id: raw.customer_id,
//         customer_name: raw.customer_name,
//         order_items: (raw.order_items ?? []).map(adaptItem),
//         total_amount: Number(raw.total_amount),
//         delivery_address: raw.delivery_address,
//         delivery_date: raw.delivery_date ?? null,
//         notes: raw.notes ?? undefined,
//         order_status: raw.order_status as OrderStatus,
//         fulfillment_status: raw.fulfillment_status as FulfillmentStatus,
//         payment_status: raw.payment_status as PaymentStatus,
//         cancellation_reason: raw.cancellation_reason ?? undefined,
//         trip_id: raw.trip_id ?? undefined,
//         invoice_id: raw.invoice_id ?? undefined,
//         created_at: raw.created_at,
//         confirmed_at: raw.confirmed_at ?? undefined,
//         delivered_at: raw.delivered_at ?? undefined,
//         cancelled_at: raw.cancelled_at ?? undefined,
//     };
// }

// export function adaptOrderList(raw: BackendOrderList): Order[] {
//     return raw.items.map(adaptOrder);
// }






/**
 * Order Adapter
 *
 * Translates between backend API contracts (snake_case)
 * and the frontend Order domain model (camelCase).
 *
 * Responsibilities:
 * • Convert snake_case ⇄ camelCase
 * • Convert decimal strings → numbers
 * • Safely map backend enum values
 * • Keep backend DTOs isolated from the rest of the frontend
 */

import type {
  CreateOrderInput,
  FulfillmentStatus,
  Order,
  OrderLineItem,
  OrderStatus,
  UpdateOrderInput,
} from "../types/orders.types";

import type { PaymentStatus } from "../../payments/types/payments.types";
import { ItemDisposition } from "../../inventory/types/inventory.types";

// ─────────────────────────────────────────────────────────────
// Backend response DTOs
// ─────────────────────────────────────────────────────────────

interface OrderItemResponse {
  id: number;

  product_id: string;
  product_name: string;

  quantity: string | number;
  unit_price: string | number;
  total: string | number;

  disposition: string | null;
}

interface OrderResponse {
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

  order_items: OrderItemResponse[];

  cancellation_reason: string | null;

  cancelled_at: string | null;

  trip_id: string | null;
  invoice_id: string | null;

  confirmed_at: string | null;
  delivered_at: string | null;

  created_at: string;
  updated_at: string;
}

interface OrderListResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// ─────────────────────────────────────────────────────────────
// Backend request DTOs
// ─────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  customer_id: string;

  delivery_address: string;
  delivery_date?: string;

  notes?: string;

  order_items: {
    product_id: string;
    product_name: string;

    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

export interface UpdateOrderRequest {
  order_status?: OrderStatus;
  fulfillment_status?: FulfillmentStatus;
  payment_status?: PaymentStatus;

  delivery_address?: string;
  delivery_date?: string;

  notes?: string;

  cancellation_reason?: string;

  trip_id?: string | null;
  invoice_id?: string;

  order_items?: {
    product_id: string;
    product_name: string;

    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

// ─────────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────────

function mapOrderStatus(value: string): OrderStatus {
  switch (value) {
    case "draft":
    case "submitted":
    case "confirmed":
    case "completed":
    case "cancelled":
      return value;

    default:
      return "draft";
  }
}

function mapFulfillmentStatus(value: string): FulfillmentStatus {
  switch (value) {
    case "pending":
    case "assigned":
    case "dispatched":
    case "in_transit":
    case "delivered":
    case "failed":
      return value;

    default:
      return "pending";
  }
}

function mapPaymentStatus(value: string): PaymentStatus {
  switch (value) {
    case "unpaid":
    case "partially_paid":
    case "paid":
    case "overdue":
      return value;

    default:
      return "unpaid";
  }
}

function mapDisposition(
  value: string | null,
): ItemDisposition | undefined {
  switch (value) {
    case "sold":
    case "loaned":
      return value;

    default:
      return undefined;
  }
}

// ─────────────────────────────────────────────────────────────
// Response mapping
// ─────────────────────────────────────────────────────────────

function adaptOrderItem(raw: OrderItemResponse): OrderLineItem {
  return {
    productId: raw.product_id,
    productName: raw.product_name,

    quantity: Number(raw.quantity),
    unitPrice: Number(raw.unit_price),
    total: Number(raw.total),

    disposition: mapDisposition(raw.disposition),
  };
}

export function adaptOrder(raw: OrderResponse): Order {
  return {
    id: raw.id,

    orderNumber: raw.order_no ?? raw.id,

    customerId: raw.customer_id,
    customerName: raw.customer_name,

    orderItems: raw.order_items.map(adaptOrderItem),

    totalAmount: Number(raw.total_amount),

    deliveryAddress: raw.delivery_address,
    deliveryDate: raw.delivery_date,

    notes: raw.notes ?? undefined,

    orderStatus: mapOrderStatus(raw.order_status),
    fulfillmentStatus: mapFulfillmentStatus(raw.fulfillment_status),
    paymentStatus: mapPaymentStatus(raw.payment_status),

    cancellationReason: raw.cancellation_reason ?? undefined,

    tripId: raw.trip_id ?? undefined,
    invoiceId: raw.invoice_id ?? undefined,

    createdAt: raw.created_at,
    confirmedAt: raw.confirmed_at ?? undefined,
    deliveredAt: raw.delivered_at ?? undefined,
    cancelledAt: raw.cancelled_at ?? undefined,
  };
}

export function adaptOrderList(raw: OrderListResponse): Order[] {
  return raw.items.map(adaptOrder);
}

// ─────────────────────────────────────────────────────────────
// Request mapping
// ─────────────────────────────────────────────────────────────

export function adaptCreateOrderRequest(
  input: CreateOrderInput,
): CreateOrderRequest {
  return {
    customer_id: input.customerId,

    delivery_address: input.deliveryAddress,
    delivery_date: input.deliveryDate,

    notes: input.notes,

    order_items: input.orderItems.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,

      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
    })),
  };
}

export function adaptUpdateOrderRequest(
  input: UpdateOrderInput,
): UpdateOrderRequest {
  return {
    order_status: input.orderStatus,
    fulfillment_status: input.fulfillmentStatus,
    payment_status: input.paymentStatus,

    delivery_address: input.deliveryAddress,
    delivery_date: input.deliveryDate,

    notes: input.notes,

    cancellation_reason: input.cancellationReason,

    trip_id: input.tripId,
    invoice_id: input.invoiceId,

    order_items: input.orderItems?.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,

      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
    })),
  };
}