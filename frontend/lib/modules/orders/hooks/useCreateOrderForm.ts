// // "use client";

// // import { useMemo } from "react";

// // import { useForm } from "react-hook-form";

// // import { zodResolver } from "@hookform/resolvers/zod";

// // import {
// //   createOrderSchema,
// //   type CreateOrderFormValues,
// // } from "../schemas/create-order.schema";

// // import {
// //   calculateOrderSubtotal,
// // } from "../selectors/order-form.selectors";

// // export function useCreateOrderForm() {
// //   const form = useForm<CreateOrderFormValues>({
// //     resolver: zodResolver(createOrderSchema),

// //     defaultValues: {
// //       order_type: "Bulk CNG Supply",
// //     },
// //   });

// //   const quantity = Number(
// //     form.watch("quantity") || 0
// //   );

// //   const unitPrice = Number(
// //     form.watch("unit_price") || 0
// //   );

// //   const subtotal = useMemo(() => {
// //     return calculateOrderSubtotal(
// //       quantity,
// //       unitPrice
// //     );
// //   }, [quantity, unitPrice]);

// //   return {
// //     form,
// //     subtotal,
// //   };
// // }









// "use client";

// import { useMemo } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import {
//   createOrderSchema,
//   type CreateOrderFormValues,
// } from "../schemas/create-order.schema";

// import { calculateOrderSubtotal } from "../selectors/order-form.selectors";

// export function useCreateOrderForm() {
//   const form = useForm<CreateOrderFormValues>({
//     resolver: zodResolver(createOrderSchema),
//     defaultValues: {
//       customer_id: "",
//       order_type: "Bulk CNG Supply",
//       product_name: "",
//       quantity: "",
//       unit_price: "",
//       delivery_address: "",
//       delivery_date: "",
//       notes: "",
//     },
//   });

//   // Watch as strings (HTML input values), convert to number for live calculation
//   const quantityRaw = form.watch("quantity");
//   const unitPriceRaw = form.watch("unit_price");

//   const quantity = Number(quantityRaw || 0);
//   const unitPrice = Number(unitPriceRaw || 0);

//   const subtotal = useMemo(
//     () => calculateOrderSubtotal(quantity, unitPrice),
//     [quantity, unitPrice]
//   );

//   return {
//     form,
//     subtotal,
//   };
// }






// "use client";

// import { useMemo } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import {
//   createOrderSchema,
//   type CreateOrderFormValues,
//   type OrderLineItem,
// } from "../schemas/create-order.schema";

// export const DEFAULT_LINE_ITEM: OrderLineItem = {
//   product_id: "",
//   quantity:   1,
//   unit_price: 0,
// };

// export function useCreateOrderForm() {
//   const form = useForm<CreateOrderFormValues>({
//     resolver: zodResolver(createOrderSchema),
//     mode: "onTouched",
//     defaultValues: {
//       customer_id:      "",
//       order_type:       "Bulk CNG Supply",
//       order_items:      [{ ...DEFAULT_LINE_ITEM }],
//       delivery_address: "",
//       delivery_date:    "",
//       notes:            "",
//     },
//   });

//   const orderItems = form.watch("order_items") ?? [];

//   const subtotal = useMemo(
//     () =>
//       orderItems.reduce(
//         (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
//         0
//       ),
//     [orderItems]
//   );

//   return { form, subtotal };
// }









"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createOrderSchema,
  type CreateOrderFormValues,
  type OrderLineItem,
} from "../schemas/create-order.schema";

export const DEFAULT_LINE_ITEM: OrderLineItem = {
  product_id: "",
  quantity: 1,
  unit_price: 0,
};

interface UseCreateOrderFormOptions {
  defaultValues?: Partial<CreateOrderFormValues>;
}

export function useCreateOrderForm(options: UseCreateOrderFormOptions = {}) {
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    mode: "onTouched",
    defaultValues: {
      customer_id: "",
      order_type: "Bulk CNG Supply",
      order_items: [{ ...DEFAULT_LINE_ITEM }],
      delivery_address: "",
      delivery_date: "",
      notes: "",
      ...options.defaultValues,
    },
  });

  const orderItems = form.watch("order_items") ?? [];

  const subtotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
        0
      ),
    [orderItems]
  );

  return { form, subtotal };
}
