// "use client";

// import { useMemo } from "react";

// import { useForm } from "react-hook-form";

// import { zodResolver } from "@hookform/resolvers/zod";

// import {
//   createOrderSchema,
//   type CreateOrderFormValues,
// } from "../schemas/create-order.schema";

// import {
//   calculateOrderSubtotal,
// } from "../selectors/order-form.selectors";

// export function useCreateOrderForm() {
//   const form = useForm<CreateOrderFormValues>({
//     resolver: zodResolver(createOrderSchema),

//     defaultValues: {
//       order_type: "Bulk CNG Supply",
//     },
//   });

//   const quantity = Number(
//     form.watch("quantity") || 0
//   );

//   const unitPrice = Number(
//     form.watch("unit_price") || 0
//   );

//   const subtotal = useMemo(() => {
//     return calculateOrderSubtotal(
//       quantity,
//       unitPrice
//     );
//   }, [quantity, unitPrice]);

//   return {
//     form,
//     subtotal,
//   };
// }









"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createOrderSchema,
  type CreateOrderFormValues,
} from "../schemas/create-order.schema";

import { calculateOrderSubtotal } from "../selectors/order-form.selectors";

export function useCreateOrderForm() {
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customer_id: "",
      order_type: "Bulk CNG Supply",
      product_name: "",
      quantity: 0,
      unit_price: 0,
      delivery_address: "",
      delivery_date: "",
      notes: "",
    },
  });

  // Watch as strings (HTML input values), convert to number for live calculation
  const quantityRaw = form.watch("quantity");
  const unitPriceRaw = form.watch("unit_price");

  const quantity = Number(quantityRaw || 0);
  const unitPrice = Number(unitPriceRaw || 0);

  const subtotal = useMemo(
    () => calculateOrderSubtotal(quantity, unitPrice),
    [quantity, unitPrice]
  );

  return {
    form,
    subtotal,
  };
}