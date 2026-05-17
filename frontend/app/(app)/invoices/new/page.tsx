"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import { formatCurrency } from "@/lib/utils";
import { dispatches } from "@/lib/mock/dispatches";
import { InvoiceForm, invoiceSchema } from "@/lib/modules/invoices/schemas/invoice.schema";



export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") as string;

  // MOCK: replace later with selector/API
  const order = useMemo(() => {
    return {
      id: orderId,
      order_number: "ORD-20260515-A102",
      customer: "Dangote Cement Plc",
      total_amount: 10200000,
      delivery_status: "delivered",
    };
  }, [orderId]);

  const dispatch = dispatches.find(
    (d) => d.order_id === orderId
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      notes: "",
    },
  });

  const invoiceDate = watch("invoice_date");

  function generateInvoiceNumber() {
    return `INV-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }

  async function onSubmit(data: InvoiceForm) {
    const payload = {
      order_id: orderId,
      invoice_number: generateInvoiceNumber(),
      total_amount: order.total_amount,
      invoice_date: data.invoice_date,
      due_date: data.due_date,
      notes: data.notes,
    };

    console.log("CREATE INVOICE", payload);

    // TODO:
    // POST /invoices

    router.push(`/orders/${orderId}`);
  }

  return (
    <AppLayout pageTitle="Create Invoice">
      <PageHeader
        title="Generate Invoice"
        description="Convert completed delivery into a billable invoice"
      />

      <div className="space-y-6">
        {/* ORDER SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">
                Order Summary
              </h2>

              <p className="text-sm text-brand-text-secondary mt-1">
                Invoice will be generated from this order
              </p>
            </div>

            <ApprovalBadge status="approved" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
            <div>
              <p className="text-xs text-brand-text-secondary">
                Order Number
              </p>
              <p className="font-medium mt-1">
                {order.order_number}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Customer
              </p>
              <p className="font-medium mt-1">
                {order.customer}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Total Amount
              </p>
              <p className="font-medium mt-1">
                {formatCurrency(order.total_amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Status
              </p>
              <p className="font-medium mt-1">
                Ready for Billing
              </p>
            </div>
          </div>
        </div>

        {/* INVOICE FORM */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-5">
            Invoice Details
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <FormDatePicker
              label="Invoice Date"
              value={invoiceDate}
              onChange={(value) =>
                setValue("invoice_date", value)
              }
            />

            <FormDatePicker
              label="Due Date"
              value={watch("due_date")}
              onChange={(value) =>
                setValue("due_date", value)
              }
            />

            <div className="md:col-span-2">
              <FormTextarea
                label="Notes (Optional)"
                placeholder="Payment terms, remarks..."
                {...register("notes")}
              />
            </div>

            {/* ACTIONS */}
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                Generate Invoice
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}