// import { Trip } from "../types/trip.types";

// export const trips: Trip[] = [
//   {
//     id: "trip-1",

//     reference_number: "TRP-20260517-001",

//     type: "station_transfer",

//     vehicle_id: "veh-1",

//     driver_id: "drv-2",

//     origin: "Portland Gas Depot",

//     destination: "Lekki Station",

//     departure_date: "2026-05-17T08:00:00",

//     status: "in_transit",

//     created_at: "2026-05-17",
//   },
// ];





export type TripStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface Trip {
  id: string;
  trip_number: string;

  status: TripStatus;

  driver_id?: string;
  vehicle_id?: string;

  order_ids: string[];

  start_location: string;
  end_location: string;

  scheduled_date: string;

  started_at?: string;
  completed_at?: string;
}

export const trips: Trip[] = [
  {
    id: "trip-1",
    trip_number: "TRP-2026-001",
    status: "assigned",

    driver_id: "driver-1",
    vehicle_id: "vehicle-1",

    order_ids: ["1", "2"],

    start_location: "Lagos Depot",
    end_location: "Ikorodu Customer Hub",

    scheduled_date: "2026-05-18",
  },

  {
    id: "trip-2",
    trip_number: "TRP-2026-002",
    status: "pending",

    order_ids: ["3"],

    start_location: "Lagos Depot",
    end_location: "Ajah Delivery Point",

    scheduled_date: "2026-05-19",
  },
];