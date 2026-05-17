"use client";

import { useMemo } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  createOrderSchema,
  type CreateOrderFormValues,
} from "../schemas/create-order.schema";

import {
  calculateOrderSubtotal,
} from "../selectors/order-form.selectors";

export function useCreateOrderForm() {
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),

    defaultValues: {
      order_type: "Bulk CNG Supply",
    },
  });

  const quantity = Number(
    form.watch("quantity") || 0
  );

  const unitPrice = Number(
    form.watch("unit_price") || 0
  );

  const subtotal = useMemo(() => {
    return calculateOrderSubtotal(
      quantity,
      unitPrice
    );
  }, [quantity, unitPrice]);

  return {
    form,
    subtotal,
  };
}