
// import type { Vehicle } from "../types/vehicle.types";

// export const vehicles: Vehicle[] = [
//   {
//     id: "veh-1",
//     plate_number: "LAG-245-KTU",
//     name: "LPG Tanker Alpha",
//     type: "lpg_tanker",
//     capacity: 12000,
//     fuel_type: "diesel",
//     mileage: 120340,
//     status: "in_use",
//     current_trip_id: "trip-1",
//     last_service_date: "2026-04-15",
//     next_service_date: "2026-10-15",
//     created_at: "2026-05-17",
//   },

//   {
//     id: "veh-2",
//     plate_number: "LAG-884-MBA",
//     name: "Delivery Van 02",
//     type: "delivery_van",
//     capacity: 3000,
//     fuel_type: "petrol",
//     mileage: 45210,
//     status: "maintenance",
//     last_service_date: "2026-04-15",
//     next_service_date: "2026-10-15",
//     created_at: "2026-05-17",
//   },

//   {
//     id: "veh-3",
//     plate_number: "LAG-512-APL",
//     name: "LPG Tanker Beta",
//     type: "lpg_tanker",
//     capacity: 10000,
//     fuel_type: "diesel",
//     mileage: 88210,
//     status: "available",
//     last_service_date: "2026-03-10",
//     next_service_date: "2026-09-10",
//     created_at: "2026-05-17",
//   },
// ];









import type { Vehicle } from "../types/vehicle.types";

export const vehicles: Vehicle[] = [
  {
    id: "veh-1",
    plate_number: "LAG-245-KTU",
    name: "LPG Tanker Alpha",
    type: "lpg_tanker",
    make: "MAN",
    model: "TGS 26.440",
    year: 2021,
    capacity: 12000,
    fuel_type: "diesel",
    mileage: 120340,
    status: "assigned",
    current_trip_id: "trip-1",
    last_service_date: "2026-04-15",
    next_service_date: "2026-10-15",
    insurance_expiry_date: "2027-01-15",
    roadworthiness_expiry_date: "2027-01-15",
    created_at: "2026-05-17",
  },

  {
    id: "veh-2",
    plate_number: "LAG-884-MBA",
    name: "Delivery Van 02",
    type: "delivery_van",
    make: "Toyota",
    model: "Hiace",
    year: 2019,
    capacity: 3000,
    fuel_type: "petrol",
    mileage: 45210,
    status: "maintenance",
    last_service_date: "2026-04-15",
    next_service_date: "2026-10-15",
    insurance_expiry_date: "2026-12-31",
    roadworthiness_expiry_date: "2026-11-30",
    created_at: "2026-05-17",
  },

  {
    id: "veh-3",
    plate_number: "LAG-512-APL",
    name: "LPG Tanker Beta",
    type: "lpg_tanker",
    make: "Iveco",
    model: "Stralis 460",
    year: 2020,
    capacity: 10000,
    fuel_type: "diesel",
    mileage: 88210,
    status: "available",
    last_service_date: "2026-03-10",
    next_service_date: "2026-09-10",
    insurance_expiry_date: "2027-03-10",
    roadworthiness_expiry_date: "2027-02-28",
    created_at: "2026-05-17",
  },
];