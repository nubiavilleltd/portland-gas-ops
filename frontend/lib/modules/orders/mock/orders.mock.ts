// ============================================================
//  ORDERS MOCK DATA
//  Types imported from orders.types.ts — NOT defined here.
// ============================================================

import type { Order } from "@/lib/modules/orders/types/orders.types";

export const orders: Order[] = [
  {
    id: "1",
    order_number: "ORD-20260515-A102",
    customer_id: "c1",
    customer_name: "Dangote Cement Plc",
    order_type: "Bulk CNG Supply",
    product_name: "CNG",
    quantity: 12000,
    unit_price: 850,
    total_amount: 10200000,
    delivery_address: "Obajana, Kogi State",
    delivery_date: "2026-05-18",

    order_status: "confirmed",
    fulfillment_status: "dispatched",
    payment_status: "partially_paid",

    trip_id: "trip-1",
    invoice_id: "inv-1",

    created_at: "2026-05-15",
    confirmed_at: "2026-05-15",
  },

  {
    id: "2",
    order_number: "ORD-20260514-B221",
    customer_id: "c2",
    customer_name: "Julius Berger Nigeria",
    order_type: "LNG Delivery",
    product_name: "LNG",
    quantity: 8500,
    unit_price: 1200,
    total_amount: 10200000,
    delivery_address: "Abuja, FCT",
    delivery_date: "2026-05-17",

    order_status: "confirmed",
    fulfillment_status: "assigned",
    payment_status: "unpaid",

    trip_id: "trip-1",
    invoice_id: "inv-2",

    created_at: "2026-05-14",
    confirmed_at: "2026-05-14",
  },

  {
    id: "3",
    order_number: "ORD-20260513-C332",
    customer_id: "c3",
    customer_name: "MTN Nigeria HQ",
    order_type: "Retail Gas Refill",
    product_name: "CNG",
    quantity: 5000,
    unit_price: 850,
    total_amount: 4250000,
    delivery_address: "Falomo, Lagos",
    delivery_date: "2026-05-16",

    order_status: "completed",
    fulfillment_status: "delivered",
    payment_status: "paid",

    trip_id: "trip-2",
    invoice_id: "inv-3",

    created_at: "2026-05-13",
    confirmed_at: "2026-05-13",
    delivered_at: "2026-05-16",
  },

  {
    id: "4",
    order_number: "ORD-20260512-D412",
    customer_id: "c4",
    customer_name: "Flour Mills of Nigeria",
    order_type: "Bulk CNG Supply",
    product_name: "CNG",
    quantity: 9000,
    unit_price: 850,
    total_amount: 7650000,
    delivery_address: "Apapa, Lagos",
    delivery_date: null,

    order_status: "draft",
    fulfillment_status: "pending",
    payment_status: "unpaid",

    created_at: "2026-05-12",
  },
];
