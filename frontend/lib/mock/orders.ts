// export type OrderStatus =
//   | "draft"
//   | "confirmed"
//   | "dispatched"
//   | "delivered"
//   | "partially_paid"
//   | "paid";

// export type Order = {
//   id: string;
//   order_number: string;
//   customer_id: string;
//   customer_name: string;

//   order_type: string;

//   quantity: number;

//   total_amount: number;

//   delivery_address: string;

//   delivery_date: string | null;

//   status: OrderStatus;

//   created_at: string;
// };

// export const orders: Order[] = [
//   {
//     id: "1",
//     order_number: "ORD-20260515-A102",
//     customer_id: "c1",
//     customer_name: "Dangote Cement Plc",

//     order_type: "Bulk CNG Supply",

//     quantity: 12000,

//     total_amount: 10200000,

//     delivery_address: "Obajana, Kogi State",

//     delivery_date: "2026-05-18",

//     status: "dispatched",

//     created_at: "2026-05-15",
//   },

//   {
//     id: "2",
//     order_number: "ORD-20260514-B221",
//     customer_id: "c2",
//     customer_name: "Julius Berger Nigeria",

//     order_type: "LNG Delivery",

//     quantity: 8500,

//     total_amount: 10200000,

//     delivery_address: "Abuja, FCT",

//     delivery_date: "2026-05-17",

//     status: "confirmed",

//     created_at: "2026-05-14",
//   },

//   {
//     id: "3",
//     order_number: "ORD-20260513-C332",
//     customer_id: "c3",
//     customer_name: "MTN Nigeria HQ",

//     order_type: "Retail Gas Refill",

//     quantity: 5000,

//     total_amount: 4250000,

//     delivery_address: "Falomo, Lagos",

//     delivery_date: "2026-05-16",

//     status: "delivered",

//     created_at: "2026-05-13",
//   },

//   {
//     id: "4",
//     order_number: "ORD-20260512-D412",
//     customer_id: "c4",
//     customer_name: "Flour Mills of Nigeria",

//     order_type: "Bulk CNG Supply",

//     quantity: 9000,

//     total_amount: 7650000,

//     delivery_address: "Apapa, Lagos",

//     delivery_date: null,

//     status: "draft",

//     created_at: "2026-05-12",
//   },
// ];






export type OrderStatus =
  | "draft"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "partially_paid"
  | "paid";

export type Order = {
  id: string;

  order_number: string;

  customer_id: string;

  customer_name: string;

  order_type: string;

  quantity: number;

  unit_price: number;

  total_amount: number;

  delivery_address: string;

  delivery_date: string | null;

  status: OrderStatus;

  created_at: string;
};

export const orders: Order[] = [
  {
    id: "1",

    order_number: "ORD-20260515-A102",

    customer_id: "c1",

    customer_name: "Dangote Cement Plc",

    order_type: "Bulk CNG Supply",

    quantity: 12000,

    unit_price: 850,

    total_amount: 10200000,

    delivery_address: "Obajana, Kogi State",

    delivery_date: "2026-05-18",

    status: "dispatched",

    created_at: "2026-05-15",
  },

  {
    id: "2",

    order_number: "ORD-20260514-B221",

    customer_id: "c2",

    customer_name: "Julius Berger Nigeria",

    order_type: "LNG Delivery",

    quantity: 8500,

    unit_price: 1200,

    total_amount: 10200000,

    delivery_address: "Abuja, FCT",

    delivery_date: "2026-05-17",

    status: "confirmed",

    created_at: "2026-05-14",
  },

  {
    id: "3",

    order_number: "ORD-20260513-C332",

    customer_id: "c3",

    customer_name: "MTN Nigeria HQ",

    order_type: "Retail Gas Refill",

    quantity: 5000,

    unit_price: 850,

    total_amount: 4250000,

    delivery_address: "Falomo, Lagos",

    delivery_date: "2026-05-16",

    status: "delivered",

    created_at: "2026-05-13",
  },

  {
    id: "4",

    order_number: "ORD-20260512-D412",

    customer_id: "c4",

    customer_name: "Flour Mills of Nigeria",

    order_type: "Bulk CNG Supply",

    quantity: 9000,

    unit_price: 850,

    total_amount: 7650000,

    delivery_address: "Apapa, Lagos",

    delivery_date: null,

    status: "draft",

    created_at: "2026-05-12",
  },
];