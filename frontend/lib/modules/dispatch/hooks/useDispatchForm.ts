// "use client";

// import { useMemo, useState } from "react";
// import { dispatches } from "@/lib/mock/dispatches";
// import {
//   DispatchForm,
//   DeliveryStatus,
// } from "../types/dispatch.types";
// import { STATUS_CONFIG } from "../config/dispatch.config";

// export function useDispatchForm(orderId: string) {
//   const existingDispatch = dispatches.find(
//     (d) => d.order_id === orderId
//   );

//   const [form, setForm] = useState<DispatchForm>({
//     driver_id: existingDispatch?.driver_id || "",
//     vehicle_id: existingDispatch?.vehicle_id || "",
//     dispatch_date: existingDispatch?.dispatch_date || "",
//     estimated_delivery_date:
//       existingDispatch?.estimated_delivery_date || "",
//     delivery_status:
//       (existingDispatch?.delivery_status as DeliveryStatus) ||
//       "assigned",
//     notes: existingDispatch?.notes || "",
//   });

//   const isCompleted = form.delivery_status === "delivered";
//   const isFailed = form.delivery_status === "failed";
//   const disableDispatchFields = isCompleted;

//   function updateField<K extends keyof DispatchForm>(
//     field: K,
//     value: DispatchForm[K]
//   ) {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   }

//   const statusMeta = useMemo(() => {
//     return STATUS_CONFIG[form.delivery_status];
//   }, [form.delivery_status]);

//   return {
//     form,
//     setForm,
//     updateField,
//     existingDispatch,
//     isCompleted,
//     isFailed,
//     disableDispatchFields,
//     statusMeta,
//   };
// }








"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { dispatches } from "@/lib/mock/dispatches";
import {
  dispatchSchema,
  DispatchFormValues,
} from "../schemas/dispatch.schema";

import { STATUS_CONFIG } from "../config/dispatch.config";

export function useDispatchForm(orderId: string) {
  const existingDispatch = dispatches.find(
    (d) => d.order_id === orderId
  );

  const form = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchSchema),

    defaultValues: {
      driver_id: existingDispatch?.driver_id || "",
      vehicle_id: existingDispatch?.vehicle_id || "",
      dispatch_date: existingDispatch?.dispatch_date || "",
      estimated_delivery_date:
        existingDispatch?.estimated_delivery_date || "",
      delivery_status:
        existingDispatch?.delivery_status || "assigned",
      notes: existingDispatch?.notes || "",
    },
  });

  const { watch } = form;

  const deliveryStatus = watch("delivery_status");

  const isCompleted = deliveryStatus === "delivered";
  const isFailed = deliveryStatus === "failed";
  const disableDispatchFields = isCompleted;

  const statusMeta = useMemo(() => {
    return STATUS_CONFIG[deliveryStatus];
  }, [deliveryStatus]);

  return {
    form,
    existingDispatch,
    isCompleted,
    isFailed,
    disableDispatchFields,
    statusMeta,
  };
}