"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Truck, MapPin, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import FormSection from "@/components/ui/FormSection";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { useConfirmDeliveryWorkflow } from "@/lib/modules/orders/hooks/useConfirmDeliveryWorkflow";
import { Order } from "@/lib/modules/orders/types/orders.types";
import { canConfirmDelivery } from "@/lib/modules/orders/guards/orders.guards";
import SimpleTable, { type SimpleTableColumn } from "@/components/ui/SimpleTable";
import type { OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { ORDER_ROUTES } from "@/lib/routes";
import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";

export default function OrderDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { order } = useOrderById(id);

  const {invoice} = useInvoiceById(order?.invoiceId || "");
  const confirmDelivery = useConfirmDeliveryWorkflow()


  const [proofNotes, setProofNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState("");


  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p>Order not found.</p>
      </AppLayout>
    );
  }

  const alreadyDelivered = order.fulfillmentStatus === "delivered";

  const canConfirm = canConfirmDelivery(order)



  async function handleConfirmDelivery() {
    if (!receivedBy.trim()) {
      toast.error("Please enter the name of the person who received the delivery.");
      return;
    }
    await confirmDelivery.mutateAsync(order as Order);
  }


  const itemColumns: SimpleTableColumn<OrderLineItem>[] = [
    {
      label: "Product",
      render: (item) => <span className="font-medium">{item.productName}</span>,
    },
    {
      label: "Quantity",
      render: (item) => `${item.quantity.toLocaleString()} kg`,
    },
    {
      label: "Total",
      align: "right",
      render: (item) => formatCurrency(item.total),
    },
  ];

  return (
    <AppLayout pageTitle="Confirm Delivery">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button> */}

      <BackButton
        href={`${ORDER_ROUTES.detail(id)}`}
        label="Back to Order"
      />


      <PageHeader
        title="Confirm Delivery"
        description="Record delivery proof and mark this order as delivered."
        className="mb-6"
      />

      {alreadyDelivered && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <div>
            <p className="font-medium text-green-800">Delivery Already Confirmed</p>
            <p className="text-sm text-green-600">
              Delivered on {order.deliveredAt ? formatDate(order.deliveredAt) : "—"}
            </p>
          </div>
        </div>
      )}

      {!canConfirm && !alreadyDelivered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <div>
            <p className="font-medium text-yellow-800">Delivery Cannot Be Confirmed Yet</p>
            <p className="text-sm text-yellow-600">
              Order must in transit before confirming delivery.
              Current status: <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">

        {/* DELIVERY DETAILS */}
        <FormSection
          title="Delivery Details"
          description="Delivery details and items included in this order"
        >


          <div className="flex items-center gap-3 mb-5">
            {/* <div className="p-2 rounded-lg bg-brand-purple-faint text-brand-purple">
        <Truck size={18} />
      </div> */}
            <div>
              <h3 className="font-semibold">{order.orderNumber}</h3>
              <p className="text-sm text-brand-text-secondary">{order.customerName || "-"}</p>
            </div>
            <div className="ml-auto">
              <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            </div>
          </div>


          <div className="mt-4 pt-4 border-t border-brand-border">
            <p className="text-xs text-brand-text-secondary mb-3">Items</p>
            <SimpleTable
              columns={itemColumns}
              rows={order.orderItems}
              keyExtractor={(_, index) => String(index)}
            />
          </div>

          <div className="flex items-start gap-3 mt-4 p-3 bg-brand-purple-faint rounded-lg">
            <MapPin size={16} className="text-brand-purple mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-brand-text-secondary">Delivery Address</p>
              <p className="text-sm font-medium">{order.deliveryAddress}</p>
            </div>
          </div>
        </FormSection>

        {/* PROOF OF DELIVERY FORM */}
        {!alreadyDelivered && canConfirm && (
          <FormSection
            title="Proof of Delivery"
            description="Record proof of delivery including recipient information and delivery notes"
          >

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">
                  Received By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full name of person who received delivery"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">
                  Delivery Notes
                </label>
                <textarea
                  placeholder="Any observations, partial delivery details, customer feedback..."
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
                />
              </div>

              {/* <p className="text-xs text-brand-text-secondary">
          Note: After confirming delivery, you will be able to generate an invoice for this order.
        </p> */}
            </div>
          </FormSection>
        )}

        {/* ERROR */}


        {confirmDelivery.error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {confirmDelivery.error instanceof Error
              ? confirmDelivery.error.message
              : "Failed to confirm delivery"}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          {/* <Button variant="outline" onClick={() => router.back()}>
            {alreadyDelivered ? "Back" : "Cancel"}
          </Button> */}

          {!alreadyDelivered && canConfirm && (
            // <Button onClick={handleConfirmDelivery} disabled={isSubmitting}>
            //   {isSubmitting ? "Confirming..." : "Confirm Delivery"}
            // </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={confirmDelivery.isPending}
              loading={confirmDelivery.isPending}
            >
              Submit Delivery Confirmation
            </Button>
          )}

          {alreadyDelivered && !order.invoiceId && (
            <Button href={`/invoices/new?orderNo=${order.orderNumber}`}>
              Create Invoice →
            </Button>
          )}

          {alreadyDelivered && order.invoiceId && (
            <Button href={`/invoices/${invoice?.invoice_number || order.invoiceId}`} variant="outline">
              View Invoice →
            </Button>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

