// "use client";

// import { useMemo, useState } from "react";
// import { useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import FormSelect from "@/components/forms/FormSelect";
// import FormTextarea from "@/components/forms/FormTextarea";
// import FormDatePicker from "@/components/forms/FormDatePicker";

// import { dispatches } from "@/lib/mock/dispatches";
// import { formatCurrency } from "@/lib/utils";

// type DeliveryStatus =
//   | "assigned"
//   | "in_transit"
//   | "delivered"
//   | "failed";

// type DispatchForm = {
//   driver_id: string;
//   vehicle_id: string;
//   dispatch_date: string;
//   estimated_delivery_date: string;
//   delivery_status: DeliveryStatus;
//   notes: string;
// };

// const DRIVER_OPTIONS = [
//   {
//     value: "musa",
//     label: "Musa Abdullahi",
//   },

//   {
//     value: "john",
//     label: "John Okafor",
//   },

//   {
//     value: "ibrahim",
//     label: "Ibrahim Bello",
//   },
// ];

// const VEHICLE_OPTIONS = [
//   {
//     value: "trk-001",
//     label: "LNG-TRK-001",
//   },

//   {
//     value: "trk-002",
//     label: "LNG-TRK-002",
//   },

//   {
//     value: "trk-003",
//     label: "LNG-TRK-003",
//   },
// ];

// const STATUS_CONFIG: Record<
//   DeliveryStatus,
//   {
//     label: string;
//     badgeStatus:
//       | "pending"
//       | "approved"
//       | "rejected"
//       | "in_progress"
//       | "draft";
//   }
// > = {
//   assigned: {
//     label: "Assigned",
//     badgeStatus: "pending",
//   },

//   in_transit: {
//     label: "In Transit",
//     badgeStatus: "in_progress",
//   },

//   delivered: {
//     label: "Delivered",
//     badgeStatus: "approved",
//   },

//   failed: {
//     label: "Failed Delivery",
//     badgeStatus: "rejected",
//   },
// };

// export default function DispatchOrderPage() {
//   const router = useRouter();

//   // Later from route params
//   const orderId = "1";

//   const existingDispatch = dispatches.find(
//     (dispatch) => dispatch.order_id === orderId
//   );

//   const [form, setForm] = useState<DispatchForm>({
//     driver_id: existingDispatch?.driver_id || "",

//     vehicle_id: existingDispatch?.vehicle_id || "",

//     dispatch_date:
//       existingDispatch?.dispatch_date || "",

//     estimated_delivery_date:
//       existingDispatch?.estimated_delivery_date || "",

//     delivery_status:
//       (existingDispatch?.delivery_status as DeliveryStatus) ||
//       "assigned",

//     notes:
//       existingDispatch?.notes || "",
//   });

//   const isCompleted =
//     form.delivery_status === "delivered";

//   const isFailed =
//     form.delivery_status === "failed";

//   const disableDispatchFields =
//     isCompleted;

//   function updateField<K extends keyof DispatchForm>(
//     field: K,
//     value: DispatchForm[K]
//   ) {
//     setForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   }

//   function handleSaveDispatch() {
//     console.log("CREATE DISPATCH", form);

//     // Later:
//     // POST /dispatches

//     router.push(`/orders/${orderId}`);
//   }

//   function handleUpdateDispatch() {
//     console.log("UPDATE DISPATCH", form);

//     // Later:
//     // PUT /dispatches/:id

//     router.push(`/orders/${orderId}`);
//   }

//   function handleMarkInTransit() {
//     updateField(
//       "delivery_status",
//       "in_transit"
//     );

//     console.log("STATUS => IN TRANSIT");

//     // Later:
//     // PATCH /dispatches/:id/status
//   }

//   function handleMarkDelivered() {
//     updateField(
//       "delivery_status",
//       "delivered"
//     );

//     console.log("STATUS => DELIVERED");

//     // Later:
//     // PATCH /dispatches/:id/status
//   }

//   function handleMarkFailed() {
//     updateField(
//       "delivery_status",
//       "failed"
//     );

//     console.log("STATUS => FAILED");

//     // Later:
//     // PATCH /dispatches/:id/status
//   }

//   function handleRetryTransit() {
//     updateField(
//       "delivery_status",
//       "in_transit"
//     );

//     console.log("STATUS => RETRY TRANSIT");

//     // Later:
//     // PATCH /dispatches/:id/status
//   }

//   const statusMeta = useMemo(() => {
//     return STATUS_CONFIG[
//       form.delivery_status
//     ];
//   }, [form.delivery_status]);

//   return (
//     <AppLayout pageTitle="Dispatch Order">

//       <PageHeader
//         title={
//           existingDispatch
//             ? "Update Dispatch"
//             : "Create Dispatch"
//         }
//         description="Assign logistics and manage delivery workflow"
//         className="mb-6"
//       />

//       <div className="space-y-6">

//         {/* ORDER SUMMARY */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">

//           <div className="flex items-start justify-between mb-6">

//             <div>

//               <h2 className="text-base font-semibold">
//                 Order Summary
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Logistics dispatch workflow
//               </p>

//             </div>

//             <ApprovalBadge
//               status={statusMeta.badgeStatus}
//             />

//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Order Number
//               </p>

//               <p className="font-medium mt-1">
//                 ORD-20260515-A102
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Customer
//               </p>

//               <p className="font-medium mt-1">
//                 Dangote Cement Plc
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Product
//               </p>

//               <p className="font-medium mt-1">
//                 CNG
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Order Value
//               </p>

//               <p className="font-medium mt-1">
//                 {formatCurrency(10200000)}
//               </p>
//             </div>

//           </div>

//         </div>

//         {/* DISPATCH INFORMATION */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">

//           <div className="flex items-start justify-between mb-6">

//             <div>

//               <h2 className="text-base font-semibold">
//                 Dispatch Information
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Driver, vehicle and delivery workflow
//               </p>

//             </div>

//             <div className="text-right">

//               <p className="text-xs text-brand-text-secondary mb-2">
//                 Delivery Status
//               </p>

//               <ApprovalBadge
//                 status={statusMeta.badgeStatus}
//               />

//             </div>

//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

//             <FormSelect
//               label="Assign Driver"
//               required
//               disabled={disableDispatchFields}
//               value={form.driver_id}
//               onChange={(e) =>
//                 updateField(
//                   "driver_id",
//                   e.target.value
//                 )
//               }
//               options={DRIVER_OPTIONS}
//             />

//             <FormSelect
//               label="Assign Vehicle"
//               required
//               disabled={disableDispatchFields}
//               value={form.vehicle_id}
//               onChange={(e) =>
//                 updateField(
//                   "vehicle_id",
//                   e.target.value
//                 )
//               }
//               options={VEHICLE_OPTIONS}
//             />

//             <FormDatePicker
//               label="Dispatch Date"
//               disabled={disableDispatchFields}
//               value={form.dispatch_date}
//               onChange={(value) =>
//                 updateField(
//                   "dispatch_date",
//                   value
//                 )
//               }
//             />

//             <FormDatePicker
//               label="Estimated Delivery Date"
//               disabled={disableDispatchFields}
//               value={
//                 form.estimated_delivery_date
//               }
//               onChange={(value) =>
//                 updateField(
//                   "estimated_delivery_date",
//                   value
//                 )
//               }
//             />

//           </div>

//           <div className="mt-5">

//             <FormTextarea
//               label="Dispatch Notes"
//               placeholder="Driver instructions, delivery notes, customer directions..."
//               disabled={disableDispatchFields}
//               value={form.notes}
//               onChange={(e) =>
//                 updateField(
//                   "notes",
//                   e.target.value
//                 )
//               }
//             />

//           </div>

//         </div>

//         {/* DELIVERY INFORMATION */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">

//           <h2 className="text-base font-semibold mb-5">
//             Delivery Information
//           </h2>

//           <div className="space-y-4">

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Delivery Address
//               </p>

//               <p className="font-medium mt-1">
//                 Obajana Industrial Layout,
//                 Kogi State, Nigeria
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Customer Contact
//               </p>

//               <p className="font-medium mt-1">
//                 +234 801 234 5678
//               </p>
//             </div>

//           </div>

//         </div>

//         {/* ACTIONS */}
//         <div className="flex items-center justify-end gap-3 pb-10 flex-wrap">

//           <Button
//             variant="outline"
//             onClick={() => router.back()}
//           >
//             Cancel
//           </Button>

//           {!existingDispatch && (
//             <Button
//               variant="secondary"
//               onClick={handleSaveDispatch}
//             >
//               Save Dispatch
//             </Button>
//           )}

//           {existingDispatch && !isCompleted && (
//             <Button
//               variant="secondary"
//               onClick={handleUpdateDispatch}
//             >
//               Update Dispatch
//             </Button>
//           )}

//           {/* ASSIGNED */}
//           {existingDispatch &&
//             form.delivery_status ===
//               "assigned" && (
//               <Button
//                 onClick={
//                   handleMarkInTransit
//                 }
//               >
//                 Mark In Transit
//               </Button>
//             )}

//           {/* IN TRANSIT */}
//           {existingDispatch &&
//             form.delivery_status ===
//               "in_transit" && (
//               <>
//                 <Button
//                   onClick={
//                     handleMarkDelivered
//                   }
//                 >
//                   Mark Delivered
//                 </Button>

//                 <Button
//                   variant="danger"
//                   onClick={
//                     handleMarkFailed
//                   }
//                 >
//                   Mark Failed
//                 </Button>
//               </>
//             )}

//           {/* FAILED */}
//           {existingDispatch &&
//             isFailed && (
//               <Button
//                 onClick={
//                   handleRetryTransit
//                 }
//               >
//                 Retry Transit
//               </Button>
//             )}

//           {/* DELIVERED */}
//           {existingDispatch &&
//             isCompleted && (
//               <>
//                 <Button
//                   variant="secondary"
//                   onClick={() =>
//                     router.push(
//                       `/invoices/new?orderId=${orderId}`
//                     )
//                   }
//                 >
//                   Generate Invoice
//                 </Button>

//                 <Button
//                   onClick={() =>
//                     router.push(
//                       `/payments/new?orderId=${orderId}`
//                     )
//                   }
//                 >
//                   Record Payment
//                 </Button>
//               </>
//             )}

//         </div>

//       </div>

//     </AppLayout>
//   );
// }









"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";



import { formatCurrency } from "@/lib/utils";
import { useDispatchForm } from "@/lib/modules/dispatch/hooks/useDispatchForm";
import ControlledSelect from "@/shared/ui-adapters/ControlledSelect";
import ControlledDatePicker from "@/shared/ui-adapters/ControlledDatePicker";
import ControlledTextarea from "@/shared/ui-adapters/ControlledTextArea";

const DRIVER_OPTIONS = [
  { value: "musa", label: "Musa Abdullahi" },
  { value: "john", label: "John Okafor" },
  { value: "ibrahim", label: "Ibrahim Bello" },
];

const VEHICLE_OPTIONS = [
  { value: "trk-001", label: "LNG-TRK-001" },
  { value: "trk-002", label: "LNG-TRK-002" },
  { value: "trk-003", label: "LNG-TRK-003" },
];

export default function DispatchOrderPage() {
  const router = useRouter();
  const orderId = "1";

  const {
    form,
    existingDispatch,
    statusMeta,
    isCompleted,
    isFailed,
    disableDispatchFields,
  } = useDispatchForm(orderId);

  const { handleSubmit, control } = form;

  function onSubmit(data: any) {
    console.log("DISPATCH SUBMIT", data);
    router.push(`/orders/${orderId}`);
  }

  const deliveryStatus = form.watch("delivery_status");

  return (
    <AppLayout pageTitle="Dispatch Order">
      <PageHeader
        title={existingDispatch ? "Update Dispatch" : "Create Dispatch"}
        description="Assign logistics and manage delivery workflow"
      />

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ORDER SUMMARY */}
          <div className="bg-white border rounded-2xl p-6">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="font-semibold">Order Summary</h2>
                <p className="text-sm text-gray-500">
                  Logistics dispatch workflow
                </p>
              </div>

              <ApprovalBadge status={statusMeta.badgeStatus} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Order Number</p>
                <p className="font-medium">ORD-20260515-A102</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium">Dangote Cement Plc</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Product</p>
                <p className="font-medium">CNG</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Order Value</p>
                <p className="font-medium">
                  {formatCurrency(10200000)}
                </p>
              </div>
            </div>
          </div>

          {/* DISPATCH INFO */}
          <div className="bg-white border rounded-2xl p-6">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="font-semibold">Dispatch Information</h2>
                <p className="text-sm text-gray-500">
                  Driver, vehicle and delivery workflow
                </p>
              </div>

              <ApprovalBadge status={statusMeta.badgeStatus} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ControlledSelect
                name="driver_id"
                label="Assign Driver"
                options={DRIVER_OPTIONS}
                disabled={disableDispatchFields}
              />

              <ControlledSelect
                name="vehicle_id"
                label="Assign Vehicle"
                options={VEHICLE_OPTIONS}
                disabled={disableDispatchFields}
              />

              <ControlledDatePicker
                name="dispatch_date"
                label="Dispatch Date"
                disabled={disableDispatchFields}
              />

              <ControlledDatePicker
                name="estimated_delivery_date"
                label="Estimated Delivery Date"
                disabled={disableDispatchFields}
              />
            </div>

            <div className="mt-5">
              <ControlledTextarea
                name="notes"
                label="Dispatch Notes"
                placeholder="Driver instructions, delivery notes..."
                disabled={disableDispatchFields}
              />
            </div>
          </div>

          {/* DELIVERY INFO */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">
              Delivery Information
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">
                  Delivery Address
                </p>
                <p className="font-medium">
                  Obajana Industrial Layout, Kogi State, Nigeria
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Customer Contact
                </p>
                <p className="font-medium">
                  +234 801 234 5678
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>

            {!existingDispatch && (
              <Button type="submit" variant="secondary">
                Save Dispatch
              </Button>
            )}

            {existingDispatch && !isCompleted && (
              <Button type="submit" variant="secondary">
                Update Dispatch
              </Button>
            )}
          </div>

        </form>
      </FormProvider>
    </AppLayout>
  );
}