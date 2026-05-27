import { OrderStatusTransition } from "../types/orders.types";


export const ORDER_TRANSITIONS: OrderStatusTransition = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["dispatched"],
  dispatched: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
} as const;
