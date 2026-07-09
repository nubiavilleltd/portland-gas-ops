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
  quantity: number;
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