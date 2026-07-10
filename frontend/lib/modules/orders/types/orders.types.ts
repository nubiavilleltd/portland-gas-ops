// // ============================================================
// //  ORDERS MODULE — CANONICAL TYPE DEFINITIONS
// //  All order-related types live here. Import from here, not from mock files.
// // ============================================================

// import { PaymentStatus } from "../../payments/types/payments.types";




// // ── 1. ORDER LIFECYCLE STATUS ─────────────────────────────
// // Tracks the administrative state of the order itself.
// // export type OrderStatus =
// // | "draft"       // Being created, not yet submitted
// // | "confirmed"   // Approved / ready for fulfillment
// // | "completed"   // Delivered + fully paid — terminal state
// // | "cancelled"  // Cancelled — terminal state
// // | "assigned"
// // | "dispatched"
// // | "in_transit"
// // | "delivered"
// // | "completed"

// export type OrderStatus =
//   | "draft"
//   | "submitted"
//   | "confirmed"
//   | "completed"
//   | "cancelled";

// export type OrderStatusTransition = Record<OrderStatus, readonly OrderStatus[]>;

// // export type DispositionStatus = "sold" | "loaned" | "rented";
// export type DispositionStatus = "sold" | "loaned";


// // ── 2. FULFILLMENT STATUS ─────────────────────────────────
// // Tracks where the physical delivery is in its journey.
// // export type FulfillmentStatus =
// //   | "pending"      // Confirmed but no trip assigned yet
// //   | "assigned"     // Assigned to a trip (driver + vehicle selected)
// //   | "dispatched"   // Trip has physically left the depot
// //   | "in_transit"   // On the road
// //   | "in_progress"   // On the road
// //   | "delivered"    // Successfully delivered to customer
// //   | "failed";      // Delivery attempt failed

// export type FulfillmentStatus =
//   | "pending"
//   | "assigned"
//   | "dispatched"
//   | "in_transit"
//   | "delivered"
//   | "failed";


// export interface OrderLineItem {
//   product_id: string;
//   product_name: string;
//   quantity: number;
//   unit_price: number;
//   total: number;
//   inventory_item_ids?: string[];
//   disposition?: DispositionStatus
// }

// // ── 4. ORDER ENTITY ───────────────────────────────────────
// export interface Order {
//   id: string;
//   order_number: string;

//   // Customer
//   customer_id: string;
//   customer_name: string;

//   // Products
//   order_items: OrderLineItem[];
//   total_amount: number; // derived — sum of all line item totals

//   // Delivery
//   delivery_address: string;
//   delivery_date: string | null;
//   notes?: string;

//   cancellation_reason?: string;

//   // Three independent status dimensions
//   order_status: OrderStatus;
//   fulfillment_status: FulfillmentStatus;
//   payment_status: PaymentStatus;

//   // Foreign-key links (populated when related entity is created)
//   trip_id?: string;       // Set when order is added to a Trip
//   invoice_id?: string;    // Set when invoice is generated

//   // Approval (future — fields are here so backend can add them painlessly)
//   requires_approval?: boolean;
//   approval_status?: "pending" | "approved" | "rejected";
//   approved_by?: string;
//   approved_at?: string;
//   rejection_reason?: string;

//   // Timestamps
//   created_at: string;
//   confirmed_at?: string;
//   delivered_at?: string;
//   cancelled_at?: string;

// }

// // ── 5. INPUT / FORM TYPES ─────────────────────────────────
// export interface CreateOrderInput {
//   customer_id: string;
//   order_items: {
//     product_id: string;
//     product_name: string;
//     quantity: number;
//     unit_price: number;
//     total: number;
//   }[];
//   delivery_address: string;
//   delivery_date?: string;
//   notes?: string;
// }

// export interface UpdateOrderInput extends Partial<CreateOrderInput> {
//   order_status?: OrderStatus;
//   fulfillment_status?: FulfillmentStatus;
//   payment_status?: PaymentStatus;
//   trip_id?: string | null;
//   invoice_id?: string;
//   cancellation_reason?: string;
//   cancelled_at?: string;
// }

// // ── 6. DERIVED / COMPUTED TYPES ───────────────────────────
// export interface OrderKPIs {
//   totalOrders: number;
//   pendingDispatch: number;    // confirmed + pending fulfillment
//   inTransit: number;
//   delivered: number;
//   unpaidOrders: number;
//   totalRevenue: number;
// }







// ============================================================
// ORDERS MODULE — CANONICAL TYPE DEFINITIONS
//
// These are the frontend domain models.
//
// RULES
// - Frontend uses camelCase only.
// - Backend adapters translate snake_case ↔ camelCase.
// - Do not import types from mock files.
// ============================================================

import { ItemDisposition } from "../../inventory/types/inventory.types";
import type { PaymentStatus } from "../../payments/types/payments.types";

// ─────────────────────────────────────────────────────────────
// Order Status
// Administrative lifecycle of an order
// ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "completed"
  | "cancelled";

export type OrderStatusTransition = Record<
  OrderStatus,
  readonly OrderStatus[]
>;

// ─────────────────────────────────────────────────────────────
// Fulfillment Status
// Physical delivery lifecycle
// ─────────────────────────────────────────────────────────────

export type FulfillmentStatus =
  | "pending"
  | "assigned"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "failed";



// ─────────────────────────────────────────────────────────────
// Approval
// ─────────────────────────────────────────────────────────────

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

// ─────────────────────────────────────────────────────────────
// Order Line Item
// ─────────────────────────────────────────────────────────────

export interface OrderLineItem {
  productId: string;
  productName: string;

  quantity: number;
  unitPrice: number;
  total: number;

  inventoryItemIds?: string[];

  disposition?: ItemDisposition;
}

// ─────────────────────────────────────────────────────────────
// Order Entity
// ─────────────────────────────────────────────────────────────

export interface Order {
  id: string;

  orderNumber: string;

  // Customer
  customerId: string;
  customerName: string;

  // Products
  orderItems: OrderLineItem[];
  totalAmount: number;

  // Delivery
  deliveryAddress: string;
  deliveryDate: string | null;
  notes?: string;

  // Cancellation
  cancellationReason?: string;

  // Status dimensions
  orderStatus: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;

  // Related entities
  tripId?: string;
  invoiceId?: string;

  // Approval
  requiresApproval?: boolean;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Audit timestamps
  createdAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

// ─────────────────────────────────────────────────────────────
// Create / Update Inputs
// ─────────────────────────────────────────────────────────────

export interface CreateOrderLineItemInput {
  productId: string;
  productName: string;

  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateOrderInput {
  customerId: string;

  orderItems: CreateOrderLineItemInput[];

  deliveryAddress: string;
  deliveryDate?: string;

  notes?: string;
}

export interface UpdateOrderInput
  extends Partial<CreateOrderInput> {
  orderStatus?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  paymentStatus?: PaymentStatus;

  tripId?: string | null;
  invoiceId?: string;

  cancellationReason?: string;
  cancelledAt?: string;
}

// ─────────────────────────────────────────────────────────────
// Dashboard KPIs
// ─────────────────────────────────────────────────────────────

export interface OrderKPIs {
  totalOrders: number;

  pendingDispatch: number;
  inTransit: number;
  delivered: number;

  unpaidOrders: number;

  totalRevenue: number;
}