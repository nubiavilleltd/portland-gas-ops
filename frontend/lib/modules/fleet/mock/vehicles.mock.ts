import { Vehicle } from "../types/vehicle.types";

export const vehicles: Vehicle[] = [
  {
    id: "veh-1",

    plate_number: "LAG-245-KTU",

    name: "LPG Tanker Alpha",

    type: "lpg_tanker",

    capacity: 12000,

    fuel_type: "diesel",

    mileage: 120340,

    status: "available",
    
    last_service_date: "2026-04-15",

    next_service_date: "2026-10-15",

    created_at: "2026-05-17",
  },

  {
    id: "veh-2",

    plate_number: "LAG-884-MBA",

    name: "Delivery Van 02",

    type: "delivery_van",

    capacity: 3000,

    fuel_type: "petrol",

    mileage: 45210,

    status: "maintenance",

    last_service_date: "2026-04-15",

    next_service_date: "2026-10-15",

    created_at: "2026-05-17",
  },
];