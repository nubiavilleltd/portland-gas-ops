import type { Customer } from "../types/customer.types";

export const customers: Customer[] = [
  {
    id:        "c1",
    name:      "MTN Nigeria",
    type:      "corporate",
    phone:     "08012345678",
    email:     "procurement@mtn.ng",
    address:   "Victoria Island, Lagos",
    createdAt: "2026-05-15",
    status: "active"
  },
  {
    id:        "c2",
    name:      "Dangote Cement",
    type:      "corporate",
    phone:     "08099887766",
    email:     "logistics@dangote.com",
    address:   "Obajana, Kogi",
    createdAt: "2026-05-14",
    status: "active"
  },
  {
    id:        "c3",
    name:      "Flour Mills of Nigeria",
    type:      "corporate",
    phone:     "08033445566",
    email:     "supply@flourmills.com.ng",
    address:   "Apapa, Lagos",
    createdAt: "2026-05-10",
    status: "active"
  },
  {
    id:        "c4",
    name:      "Emeka Okafor",
    type:      "individual",
    phone:     "08077889900",
    email:     "emeka.okafor@gmail.com",
    address:   "Ikeja, Lagos",
    createdAt: "2026-05-08",
    status: "active"
  },
];