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
