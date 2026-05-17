// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import { formatCurrency, formatDate } from "@/lib/utils";
// import Button from "@/components/ui/Button";

// export default function OrderDetailPage() {
//   const router = useRouter();

//   const params = useParams();
//   const id = params.id as string;

//   // const

//   return (
//     <AppLayout pageTitle="Order Details">

//       {/* Back Button */}
//       <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back to Orders
//       </button>

//       {/* Header */}
//       <PageHeader
//         title="ORD-20240512-C3D4"
//         description="Customer gas order workflow and transaction details"
//         action={
//           <div className="flex gap-2">

//             <button className="px-4 py-2 border border-brand-border rounded-lg text-sm hover:bg-gray-50">
//               Edit Order
//             </button>

//             {/* <button className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm hover:bg-brand-purple-dark">
//               Dispatch
//             </button> */}

//             <Button href={`/orders/${id}/dispatch`}>
//               Dispatch
//             </Button>

//           </div>
//         }
//         className="mb-6"
//       />

//       {/* TOP SUMMARY */}
//       <div className="bg-white border border-brand-border rounded-2xl p-6 mb-6">

//         <div className="flex items-start justify-between mb-6">

//           <div>
//             <p className="text-xs font-mono text-brand-text-secondary">
//               ORD-20240512-C3D4
//             </p>

//             <h2 className="text-lg font-semibold text-brand-text-primary mt-1">
//               Dangote Cement Plc
//             </h2>

//             <p className="text-sm text-brand-text-secondary mt-1">
//               CNG Bulk Delivery
//             </p>
//           </div>

//           <ApprovalBadge status="in_progress" />
//         </div>

//         {/* Summary Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">

//           {[
//             ["Gas Type", "CNG"],
//             ["Quantity", "12,000 kg"],
//             ["Unit Price", formatCurrency(850)],
//             ["Total Amount", formatCurrency(10200000)],
//             ["Requested Date", formatDate("2024-05-14")],
//             ["Delivery Address", "Obajana, Kogi State"],
//             ["Created By", "Admin User"],
//             ["Payment Status", "Partially Paid"],
//           ].map(([label, value]) => (
//             <div key={label}>
//               <p className="text-brand-text-secondary text-xs">
//                 {label}
//               </p>

//               <p className="font-medium mt-1">
//                 {value}
//               </p>
//             </div>
//           ))}

//         </div>

//       </div>

//       {/* ORDER ITEMS */}
//       <div className="bg-white border border-brand-border rounded-2xl p-6 mb-6">

//         <h3 className="text-base font-semibold mb-4">
//           Order Items
//         </h3>

//         <div className="overflow-x-auto">

//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-brand-border text-left">
//                 <th className="pb-3">Product</th>
//                 <th className="pb-3">Quantity</th>
//                 <th className="pb-3">Unit Price</th>
//                 <th className="pb-3">Total</th>
//               </tr>
//             </thead>

//             <tbody>
//               <tr className="border-b border-brand-border">
//                 <td className="py-4">CNG</td>
//                 <td>12,000 kg</td>
//                 <td>{formatCurrency(850)}</td>
//                 <td>{formatCurrency(10200000)}</td>
//               </tr>
//             </tbody>

//           </table>

//         </div>

//       </div>

//       {/* DISPATCH */}
//       <div className="bg-white border border-brand-border rounded-2xl p-6 mb-6">

//         <div className="flex items-center justify-between mb-4">

//           <h3 className="text-base font-semibold">
//             Dispatch Information
//           </h3>

//           <button className="text-sm text-brand-purple hover:underline">
//             Update Dispatch
//           </button>

//         </div>

//         <div className="grid grid-cols-2 gap-5 text-sm">

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Driver
//             </p>
//             <p className="font-medium mt-1">
//               Musa Abdullahi
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Vehicle
//             </p>
//             <p className="font-medium mt-1">
//               LNG-TRK-004
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Dispatch Date
//             </p>
//             <p className="font-medium mt-1">
//               {formatDate("2024-05-14")}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Delivery Status
//             </p>
//             <p className="font-medium mt-1">
//               In Transit
//             </p>
//           </div>

//         </div>

//       </div>

//       {/* INVOICE */}
//       <div className="bg-white border border-brand-border rounded-2xl p-6 mb-6">

//         <div className="flex items-center justify-between mb-4">

//           <h3 className="text-base font-semibold">
//             Invoice Information
//           </h3>

//           <button className="text-sm text-brand-purple hover:underline">
//             Generate Invoice
//           </button>

//         </div>

//         <div className="grid grid-cols-2 gap-5 text-sm">

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Invoice No
//             </p>
//             <p className="font-medium mt-1">
//               INV-20240514-001
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Invoice Status
//             </p>
//             <p className="font-medium mt-1">
//               Unpaid
//             </p>
//           </div>

//         </div>

//       </div>

//       {/* PAYMENTS */}
//       <div className="bg-white border border-brand-border rounded-2xl p-6">

//         <div className="flex items-center justify-between mb-4">

//           <h3 className="text-base font-semibold">
//             Payment Information
//           </h3>

//           <button className="text-sm text-brand-purple hover:underline">
//             Record Payment
//           </button>

//         </div>

//         <div className="grid grid-cols-3 gap-5 text-sm">

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Invoice Amount
//             </p>
//             <p className="font-medium mt-1">
//               {formatCurrency(10200000)}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Amount Paid
//             </p>
//             <p className="font-medium mt-1">
//               {formatCurrency(5000000)}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-brand-text-secondary">
//               Balance
//             </p>
//             <p className="font-medium mt-1 text-red-600">
//               {formatCurrency(5200000)}
//             </p>
//           </div>

//         </div>

//       </div>

//     </AppLayout>
//   );
// }

"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";

import OrderDetailsHeader from "@/components/orders/OrderDetailsHeader";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import OrderItemsTable from "@/components/orders/OrderItemsTable";
import OrderDispatchCard from "@/components/orders/OrderDispatchCard";
import OrderInvoiceCard from "@/components/orders/OrderInvoiceCard";
import OrderPaymentCard from "@/components/orders/OrderPaymentCard";

import {
  getOrderById,
  getOrderDispatch,
  getOrderInvoice,
  getPaymentSummary,
} from "@/lib/modules/orders/selectors/orders.selectors";

export default function OrderDetailPage() {
  const params = useParams();

  const id = params.id as string;

  const order = getOrderById(id);

  if (!order) {
    return <AppLayout pageTitle="Order Not Found">Order not found.</AppLayout>;
  }

  const dispatch = getOrderDispatch(order.id);

  const invoice = getOrderInvoice(order.id);

  const paymentSummary = getPaymentSummary(invoice?.id);

  return (
    <AppLayout pageTitle="Order Details">
      <OrderDetailsHeader
        orderId={order.id}
        orderNumber={order.order_number}
      />

      <div className="space-y-6">
        <OrderSummaryCard order={order} />

        <OrderItemsTable order={order} />

        <OrderDispatchCard
          orderId={order.id}
          dispatch={dispatch}
        />

        <OrderInvoiceCard
          orderId={order.id}
          invoice={invoice}
        />

        <OrderPaymentCard
          invoice={invoice}
          amountPaid={paymentSummary.amountPaid}
        />
      </div>
    </AppLayout>
  );
}
