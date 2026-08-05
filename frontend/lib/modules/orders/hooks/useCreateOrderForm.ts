"use client";

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
  quantity: 0,
};

interface UseCreateOrderFormOptions {
  defaultValues?: Partial<CreateOrderFormValues>;
}

export function useCreateOrderForm(options: UseCreateOrderFormOptions = {}) {
  const { defaultValues } = options;

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
      ...defaultValues,
    },
  });

  return { form };
}