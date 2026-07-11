"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormSection from "@/components/ui/FormSection";

import { formatCurrency } from "@/lib/utils";
import { PaymentForm, PaymentFormInput, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";

import { useInvoiceById, useInvoiceByNo, useInvoices } from "@/lib/modules/invoices/hooks/useInvoices";
import { usePaymentSummary } from "@/lib/modules/payments/hooks/usePayments";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
// import { useRecordPayment } from "@/lib/modules/payments/hooks/useRecordPayment";
import { useRecordPaymentWorkflow } from "@/lib/modules/payments/hooks/useRecordPaymentWorkflow";

import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from "@/lib/modules/payments/types/payments.types";
import FormSelect from "@/components/forms/FormSelect";
import { FormCurrencyInput } from "@/components/forms/FormCurrencyInput";
import { BackButton } from "@/components/ui/BackButton";

/* ── INVOICE SELECTOR ─────────────────────────────────────── */
function InvoiceSelector({
  invoices,
  onSelect,
}: {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">
      <FormSection
        title="Select Invoice"
        description="Search and select an invoice to record payment against"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search invoice number..."
          className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />

        <div className="space-y-2 max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No invoices found.
            </p>
          ) : (
            filtered.map((inv) => (
              <button
                key={inv.id}
                onClick={() => onSelect(inv)}
                className="w-full text-left p-3 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm">
                  {inv.invoice_number}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {formatCurrency(inv.total_amount)}
                </p>
              </button>
            ))
          )}
        </div>
      </FormSection>
    </div>
  );
}

/* ── PAGE ─────────────────────────────────────────────────── */
export default function CreatePaymentPage() {
  return (
    <Suspense fallback={null}>
      <CreatePaymentPageContent />
    </Suspense>
  );
}

function CreatePaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { invoices } = useInvoices();

  const initialInvoiceNo = searchParams.get("invoiceId");
const { invoice } = useInvoiceByNo(initialInvoiceNo ?? "");
  // const { recordPayment, isLoading: isRecording, error: recordError } =
  //   useRecordPayment();

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(invoice ?? null);

  const { mutate: recordPayment, isPending } = useRecordPaymentWorkflow(
    selectedInvoice ?? ({ id: "" } as Invoice)
  );

  useEffect(() => {
    if (invoice) {
      setSelectedInvoice(invoice);
    }
  }, [invoice]);

  const { summary } = usePaymentSummary(
    selectedInvoice?.id
  );

  const balance = selectedInvoice
    ? selectedInvoice.total_amount - summary.amountPaid
    : 0;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, any, PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split("T")[0],
      amount: 0,
      reference: "",
      payment_method: "bank_transfer",
    },
  });

  const paymentDate = useWatch({
    control,
    name: "payment_date",
  });

  const selectInvoice = useCallback(
    (invoice: Invoice) => {
      setSelectedInvoice(invoice);

      const remaining =
        invoice.total_amount - summary.amountPaid;

      reset({
        payment_date: new Date().toISOString().split("T")[0],
        amount: remaining,
        reference: "",
        payment_method: "bank_transfer",
      });

     router.replace(`/payments/new?invoiceId=${invoice.invoice_number}`);
    },
    [reset, router, summary.amountPaid]
  );


  async function onSubmit(data: PaymentForm) {
    if (!selectedInvoice) return;
    recordPayment(data);
  }

  return (
    <AppLayout pageTitle="Record Payment">

      <BackButton label="Back" />
      <PageHeader
        title="Record Payment"
        description="Select an invoice and record payment"
        className="mb-6"
      />

      <div className="space-y-6">
        {!selectedInvoice ? (
          <InvoiceSelector
            invoices={invoices}
            onSelect={selectInvoice}
          />
        ) : (
          <>
            {/* INVOICE SUMMARY */}
            <FormSection
              title={selectedInvoice.invoice_number}
              description="Selected Invoice"
            >



              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(null);
                    router.replace("/payments/new");
                  }}
                >
                  Change Invoice
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-5 text-sm">
                <InfoRow
                  label="Total"
                  value={formatCurrency(
                    selectedInvoice.total_amount
                  )}
                />
                <InfoRow
                  label="Already Paid"
                  value={formatCurrency(
                    summary.amountPaid
                  )}
                  className="text-green-600"
                />
                <InfoRow
                  label="Outstanding Balance"
                  value={formatCurrency(balance)}
                  className="text-red-600"
                />
              </div>
            </FormSection>

            {/* PAYMENT FORM */}
            <FormSection
              title="Payment Details"
              description="Capture payment information"
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <FormDatePicker
                  label="Payment Date"
                  value={paymentDate}
                  onValueChange={(v) =>
                    setValue("payment_date", v)
                  }
                  {...register("payment_date")}
                />

                {/* <FormInput
                  label="Amount"
                  type="number"
                  error={errors.amount?.message}
                  {...register("amount", {
                    valueAsNumber: true,
                  })}
                /> */}

                <FormCurrencyInput
                  control={control}
                  name="amount"
                  label="Amount (₦)"
                  error={errors.amount?.message}
                />


                <FormInput
                  label="Reference (Optional)"
                  placeholder="Auto-generated if left empty"
                  {...register("reference")}
                />

                <FormSelect
                  required
                  searchable
                  label="Payment Method"
                  options={PAYMENT_METHOD_OPTIONS}
                  placeholder="Select payment method"
                  error={errors.payment_method?.message}
                  {...register("payment_method")}
                />

                {/* {(recordError || errors.amount) && (
                  <div className="md:col-span-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {recordError ||
                      errors.amount?.message}
                  </div>
                )} */}

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    loading={isSubmitting || isPending}
                  >
                    Record Payment
                  </Button>
                </div>
              </form>
            </FormSection>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">
        {label}
      </p>
      <p className={`font-medium ${className ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
