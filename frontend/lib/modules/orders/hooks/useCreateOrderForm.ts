"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  CreateOrderFormOutput,
  createOrderSchema,
  type CreateOrderFormValues,
  type OrderLineItem,
} from "../schemas/create-order.schema";

export const DEFAULT_LINE_ITEM: OrderLineItem = {
  productId: "",
  quantity: 1,
};

interface UseCreateOrderFormOptions {
  defaultValues?: Partial<CreateOrderFormValues>;
}

export function useCreateOrderForm(options: UseCreateOrderFormOptions = {}) {
  const form = useForm<CreateOrderFormValues, any, CreateOrderFormOutput>({
    resolver: zodResolver(createOrderSchema),
    mode: "onTouched",
    defaultValues: {
      customerId: "",
      orderItems: [{ ...DEFAULT_LINE_ITEM }],
      discountType: "none",
      discountValue: 0,
      deliveryAddress: "",
      deliveryDate: "",
      notes: "",
      ...options.defaultValues,
    },
  });



  return { form };
}
