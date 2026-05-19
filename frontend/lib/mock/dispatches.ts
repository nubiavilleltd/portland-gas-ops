interface DispatchForm {
  id: string;
  order_id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_name: string;
  dispatch_date: string;
  estimated_delivery_date: string;
  delivery_status: "assigned" | "dispatched" | "in_transit" | "delivered" | "failed";
  notes?: string;
}

export const dispatches : DispatchForm[] = [
  {
    id: "d1",

    order_id: "1",

    driver_id: "musa",
    driver_name: "Musa Abdullahi",

    vehicle_id: "trk-001",
    vehicle_name: "LNG-TRK-001",

    dispatch_date: "2026-05-16",

    estimated_delivery_date: "2026-05-17",

    delivery_status: "assigned",

    notes:
      "Customer requested morning delivery.",
  },
];
