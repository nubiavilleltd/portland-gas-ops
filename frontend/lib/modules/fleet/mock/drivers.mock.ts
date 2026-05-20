// import { Driver } from "../types/driver.types";

// export const drivers: Driver[] = [
//   {
//     id: "drv-1",

//     full_name: "Michael Adeyemi",
//     email:"michael.adeyemi@example.com",

//     phone_number: "08031234567",

//     license_number: "DRV-20394-LA",
//     experience_years: 5,

//     status: "available",

//     created_at: "2026-05-17",
//   },

//   {
//     id: "drv-2",

//     full_name: "Samuel Okafor",

//     email:"samuel.okafor@example.com",

//     phone_number: "08039887766",

//     license_number: "DRV-99822-LA",

//     experience_years: 3,

//     status: "assigned",

//     created_at: "2026-05-17",
//   },
// ];







import type { Driver } from "../types/driver.types";

export const drivers: Driver[] = [
  {
    id: "drv-1",
    full_name: "Michael Adeyemi",
    email: "michael.adeyemi@example.com",
    phone_number: "08031234567",
    license_number: "DRV-20394-LA",
    experience_years: 5,
    status: "available",
    created_at: "2026-05-17",
  },

  {
    id: "drv-2",
    full_name: "Samuel Okafor",
    email: "samuel.okafor@example.com",
    phone_number: "08039887766",
    license_number: "DRV-99822-LA",
    experience_years: 3,
    status: "assigned",
    current_trip_id: "trip-1",
    created_at: "2026-05-17",
  },

  {
    id: "drv-3",
    full_name: "Chukwuemeka Eze",
    email: "emeka.eze@example.com",
    phone_number: "08051122334",
    license_number: "DRV-45521-LA",
    experience_years: 7,
    status: "available",
    created_at: "2026-05-17",
  },
];