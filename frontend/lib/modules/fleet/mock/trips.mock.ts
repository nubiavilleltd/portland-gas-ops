// // // // import { Trip } from "../types/trip.types";

// // // // export const trips: Trip[] = [
// // // //   {
// // // //     id: "trip-1",

// // // //     reference_number: "TRP-20260517-001",

// // // //     type: "station_transfer",

// // // //     vehicle_id: "veh-1",

// // // //     driver_id: "drv-2",

// // // //     origin: "Portland Gas Depot",

// // // //     destination: "Lekki Station",

// // // //     departure_date: "2026-05-17T08:00:00",

// // // //     status: "in_transit",

// // // //     created_at: "2026-05-17",
// // // //   },
// // // // ];





// // // export type TripStatus =
// // //   | "pending"
// // //   | "assigned"
// // //   | "in_transit"
// // //   | "completed"
// // //   | "cancelled";

// // // export interface Trip {
// // //   id: string;
// // //   trip_number: string;

// // //   status: TripStatus;

// // //   driver_id?: string;
// // //   vehicle_id?: string;

// // //   order_ids: string[];

// // //   start_location: string;
// // //   end_location: string;

// // //   scheduled_date: string;

// // //   started_at?: string;
// // //   completed_at?: string;
// // // }

// // // export const trips: Trip[] = [
// // //   {
// // //     id: "trip-1",
// // //     trip_number: "TRP-2026-001",
// // //     status: "assigned",

// // //     driver_id: "driver-1",
// // //     vehicle_id: "vehicle-1",

// // //     order_ids: ["1", "2"],

// // //     start_location: "Lagos Depot",
// // //     end_location: "Ikorodu Customer Hub",

// // //     scheduled_date: "2026-05-18",
// // //   },

// // //   {
// // //     id: "trip-2",
// // //     trip_number: "TRP-2026-002",
// // //     status: "pending",

// // //     order_ids: ["3"],

// // //     start_location: "Lagos Depot",
// // //     end_location: "Ajah Delivery Point",

// // //     scheduled_date: "2026-05-19",
// // //   },
// // // ];






// // // ============================================================
// // //  TRIPS MOCK DATA
// // //  Types imported from trip.types.ts — NOT defined here.
// // // ============================================================

// // import type { Trip } from "../types/trip.types";

// // export const trips: Trip[] = [
// //   {
// //     id: "trip-1",
// //     trip_number: "TRP-2026-001",
// //     type: "order_delivery",

// //     driver_id: "drv-1",
// //     vehicle_id: "veh-1",

// //     order_ids: ["1", "2"],

// //     start_location: "Lagos Depot",
// //     end_location: "Ikorodu Customer Hub",

// //     scheduled_date: "2026-05-18",
// //     dispatch_date: "2026-05-18T07:30:00",

// //     status: "dispatched",

// //     notes: "Customer requested morning delivery window (7am–10am).",
// //     created_at: "2026-05-17",
// //   },

// //   {
// //     id: "trip-2",
// //     trip_number: "TRP-2026-002",
// //     type: "order_delivery",

// //     driver_id: null,
// //     vehicle_id: null,

// //     order_ids: ["3"],

// //     start_location: "Lagos Depot",
// //     end_location: "Falomo, Lagos",

// //     scheduled_date: "2026-05-19",

// //     status: "pending",

// //     created_at: "2026-05-17",
// //   },
// // ];






// import type { Trip } from "../types/trip.types";

// export const trips: Trip[] = [
//   {
//     id: "trip-1",
//     trip_number: "TRP-20260518-001",
//     type: "order_delivery",
//     driver_id: "drv-1",
//     vehicle_id: "veh-1",
//     order_ids: ["1", "2"], // matches order mock
//     start_location: "Lagos Depot",
//     end_location: "Ikorodu Customer Hub",
//     scheduled_date: "2026-05-18",
//     status: "assigned",
//     notes: "Customer requested morning delivery window (7am–10am).",
//     created_at: "2026-05-17",
//   },

//   {
//     id: "trip-2",
//     trip_number: "TRP-20260519-001",
//     type: "order_delivery",
//     driver_id: null,
//     vehicle_id: null,
//     order_ids: ["3"], // matches order mock
//     start_location: "Lagos Depot",
//     end_location: "Falomo, Lagos",
//     scheduled_date: "2026-05-19",
//     status: "pending",
//     created_at: "2026-05-17",
//   },

//   {
//     id: "trip-3",
//     trip_number: "TRP-20260520-001",
//     type: "maintenance",
//     driver_id: "drv-2",
//     vehicle_id: "veh-2",
//     order_ids: [], // no orders — maintenance trip
//     start_location: "Lagos Depot",
//     end_location: "Ikeja Service Center",
//     scheduled_date: "2026-05-20",
//     status: "completed",
//     started_at: "2026-05-20T08:00:00",
//     completed_at: "2026-05-20T14:00:00",
//     notes: "Routine service and oil change.",
//     created_at: "2026-05-19",
//   },

//   {
//     id: "trip-4",
//     trip_number: "TRP-20260521-001",
//     type: "order_delivery",
//     driver_id: "drv-3",
//     vehicle_id: "veh-3",
//     order_ids: ["4"], // matches order mock
//     start_location: "Lagos Depot",
//     end_location: "Apapa, Lagos",
//     scheduled_date: "2026-05-21",
//     dispatch_date: "2026-05-21T07:00:00",
//     started_at: "2026-05-21T07:30:00",
//     status: "in_transit",
//     created_at: "2026-05-20",
//   },

//   {
//     id: "trip-5",
//     trip_number: "TRP-20260515-001",
//     type: "inspection",
//     driver_id: "drv-1",
//     vehicle_id: "veh-3",
//     order_ids: [], // no orders — inspection trip
//     start_location: "Lagos Depot",
//     end_location: "FRSC Inspection Center, Ojota",
//     scheduled_date: "2026-05-15",
//     dispatch_date: "2026-05-15T09:00:00",
//     started_at: "2026-05-15T09:30:00",
//     completed_at: "2026-05-15T13:00:00",
//     status: "completed",
//     notes: "Annual roadworthiness inspection passed.",
//     created_at: "2026-05-14",
//   },
// ];





import type { Trip } from "../types/trip.types";

export const trips: Trip[] = [
  {
    id: "trip-1",
    trip_number: "TRP-20260518-001",
    type: "order_delivery",
    driver_id: "drv-1",
    vehicle_id: "veh-1",
    order_ids: ["ord-1", "ord-2"],
    start_location: "Lagos Depot",
    end_location: "Ikorodu Customer Hub",
    scheduled_date: "2026-05-18",
    status: "assigned",
    notes: "Customer requested morning delivery window (7am–10am).",
    created_at: "2026-05-17",
  },

  {
    id: "trip-2",
    trip_number: "TRP-20260519-001",
    type: "order_delivery",
    driver_id: null,
    vehicle_id: null,
    order_ids: ["ord-3"],
    start_location: "Lagos Depot",
    end_location: "Falomo, Lagos",
    scheduled_date: "2026-05-19",
    status: "pending",
    created_at: "2026-05-17",
  },

  {
    id: "trip-3",
    trip_number: "TRP-20260520-001",
    type: "maintenance",
    driver_id: "drv-2",
    vehicle_id: "veh-2",
    order_ids: [],
    start_location: "Lagos Depot",
    end_location: "Ikeja Service Center",
    scheduled_date: "2026-05-20",
    status: "completed",
    started_at: "2026-05-20T08:00:00",
    completed_at: "2026-05-20T14:00:00",
    notes: "Routine service and oil change.",
    created_at: "2026-05-19",
  },

  {
    id: "trip-4",
    trip_number: "TRP-20260521-001",
    type: "order_delivery",
    driver_id: "drv-3",
    vehicle_id: "veh-3",
    order_ids: ["ord-4"],
    start_location: "Lagos Depot",
    end_location: "Apapa, Lagos",
    scheduled_date: "2026-05-21",
    dispatch_date: "2026-05-21T07:00:00",
    started_at: "2026-05-21T07:30:00",
    status: "in_transit",
    created_at: "2026-05-20",
  },

  {
    id: "trip-5",
    trip_number: "TRP-20260515-001",
    type: "inspection",
    driver_id: "drv-1",
    vehicle_id: "veh-3",
    order_ids: [],
    start_location: "Lagos Depot",
    end_location: "FRSC Inspection Center, Ojota",
    scheduled_date: "2026-05-15",
    dispatch_date: "2026-05-15T09:00:00",
    started_at: "2026-05-15T09:30:00",
    completed_at: "2026-05-15T13:00:00",
    status: "completed",
    notes: "Annual roadworthiness inspection passed.",
    created_at: "2026-05-14",
  },
];