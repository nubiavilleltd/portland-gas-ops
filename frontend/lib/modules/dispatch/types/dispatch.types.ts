export type DeliveryStatus =
  | "assigned"
  | "in_transit"
  | "delivered"
  | "failed";

export type DispatchForm = {
    id:string;
    order_id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_name: string;
  dispatch_date: string;
  estimated_delivery_date: string;
  delivery_status: DeliveryStatus;
  notes: string;
};