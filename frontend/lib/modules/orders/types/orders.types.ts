// ============================================================
//  ORDERS MODULE — CANONICAL TYPE DEFINITIONS
//  All order-related types live here. Import from here, not from mock files.
// ============================================================




// ── 1. ORDER LIFECYCLE STATUS ─────────────────────────────
// Tracks the administrative state of the order itself.
// export type OrderStatus =
// | "draft"       // Being created, not yet submitted
// | "confirmed"   // Approved / ready for fulfillment
// | "completed"   // Delivered + fully paid — terminal state
// | "cancelled"  // Cancelled — terminal state
// | "assigned"
// | "dispatched"
// | "in_transit"
// | "delivered"
// | "completed"

export type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "completed"
  | "cancelled";

export type OrderStatusTransition = Record<OrderStatus, readonly OrderStatus[]>;

// export type DispositionStatus = "sold" | "loaned" | "rented";
export type DispositionStatus = "sold" | "loaned";


// ── 2. FULFILLMENT STATUS ─────────────────────────────────
// Tracks where the physical delivery is in its journey.
// export type FulfillmentStatus =
//   | "pending"      // Confirmed but no trip assigned yet
//   | "assigned"     // Assigned to a trip (driver + vehicle selected)
//   | "dispatched"   // Trip has physically left the depot
//   | "in_transit"   // On the road
//   | "in_progress"   // On the road
//   | "delivered"    // Successfully delivered to customer
//   | "failed";      // Delivery attempt failed

export type FulfillmentStatus =
  | "pending"
  | "assigned"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "failed";

// ── 3. PAYMENT STATUS ─────────────────────────────────────
// Tracks the billing / cash-collection state.
export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue";


export interface OrderLineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  inventory_item_ids?: string[];
  disposition?: DispositionStatus
}

// ── 4. ORDER ENTITY ───────────────────────────────────────
export interface Order {
  id: string;
  order_number: string;

  // Customer
  customer_id: string;
  customer_name: string;

  // Products
  order_items: OrderLineItem[];
  total_amount: number; // derived — sum of all line item totals

  // Delivery
  delivery_address: string;
  delivery_date: string | null;
  notes?: string;

  // Three independent status dimensions
  order_status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;

  // Foreign-key links (populated when related entity is created)
  trip_id?: string;       // Set when order is added to a Trip
  invoice_id?: string;    // Set when invoice is generated

  // Approval (future — fields are here so backend can add them painlessly)
  requires_approval?: boolean;
  approval_status?: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  // Timestamps
  created_at: string;
  confirmed_at?: string;
  delivered_at?: string;
}

// ── 5. INPUT / FORM TYPES ─────────────────────────────────
export interface CreateOrderInput {
  customer_id: string;
  order_items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  delivery_address: string;
  delivery_date?: string;
  notes?: string;
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  order_status?: OrderStatus;
  fulfillment_status?: FulfillmentStatus;
  payment_status?: PaymentStatus;
  trip_id?: string;
  invoice_id?: string;
}

// ── 6. DERIVED / COMPUTED TYPES ───────────────────────────
export interface OrderKPIs {
  totalOrders: number;
  pendingDispatch: number;    // confirmed + pending fulfillment
  inTransit: number;
  delivered: number;
  unpaidOrders: number;
  totalRevenue: number;
}