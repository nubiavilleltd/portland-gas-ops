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
  productId: "",
  quantity: 1,
  unitPrice: 0,
};

interface UseCreateOrderFormOptions {
  defaultValues?: Partial<CreateOrderFormValues>;
}

export function useCreateOrderForm(options: UseCreateOrderFormOptions = {}) {
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    mode: "onTouched",
    defaultValues: {
      customerId: "",
      orderItems: [{ ...DEFAULT_LINE_ITEM }],
      deliveryAddress: "",
      deliveryDate: "",
      notes: "",
      ...options.defaultValues,
    },
  });

  const orderItems = form.watch("orderItems") ?? [];

  const subtotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      ),
    [orderItems]
  );

  return { form, subtotal };
}
