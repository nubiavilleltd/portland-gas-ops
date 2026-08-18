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

import { useInvoiceById, useInvoices } from "@/lib/modules/invoices/hooks/useInvoices";
import { usePaymentSummary } from "@/lib/modules/payments/hooks/usePayments";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
// import { useRecordPayment } from "@/lib/modules/payments/hooks/useRecordPayment";
import { useRecordPaymentWorkflow } from "@/lib/modules/payments/hooks/useRecordPaymentWorkflow";

import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from "@/lib/modules/payments/types/payments.types";
import FormSelect from "@/components/forms/FormSelect";
import { FormCurrencyInput } from "@/components/forms/FormCurrencyInput";
import { BackButton } from "@/components/ui/BackButton";
import FileDropzone from "@/components/ui/FileDropzone";
import { toast } from "sonner";
import { InvoiceSkeleton } from "@/lib/modules/orders/components/OrderDetailSkeleton";

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

  const initialInvoiceId = searchParams.get("invoiceId");
  const { invoice, isLoading: isLoadingInvoice, } = useInvoiceById(initialInvoiceId ?? "");
  const selectedInvoice = invoice ?? null;
  // const [proofError, setProofError] = useState("");
  // const { recordPayment, isLoading: isRecording, error: recordError } =
  //   useRecordPayment();



 const { mutate: recordPayment, isPending } = useRecordPaymentWorkflow(
  selectedInvoice
);





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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, any, PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split("T")[0],
      amount: 0,
      reference: "",
      payment_method: "",
      paymentProofs: [],
    },
  });

  const paymentDate = useWatch({
    control,
    name: "payment_date",
  });


  const paymentMethod = useWatch({
    control,
    name: "payment_method",
  });

  const requiresProof =
    paymentMethod === "bank_transfer" ||
    paymentMethod === "card" ||
    paymentMethod === "cheque";

useEffect(() => {
  if (!requiresProof) {
    setValue("paymentProofs", []);
  }
}, [requiresProof, setValue]);

  const selectInvoice = useCallback(
    (invoice: Invoice) => {

      const remaining =
        invoice.total_amount - summary.amountPaid;

      reset({
        payment_date: new Date().toISOString().split("T")[0],
        amount: remaining,
        reference: "",
        payment_method: "",
        paymentProofs: [],
      });

      router.replace(`/payments/new?invoiceId=${invoice.id}`);
    },
    [reset, router, summary.amountPaid]
  );



  async function onSubmit(data: PaymentForm) {
  if (!selectedInvoice) return;

  if (requiresProof && data.paymentProofs.length === 0) {
    toast.error("Please upload proof of payment.");
    return;
  }

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
        {initialInvoiceId && isLoadingInvoice ? (
          <FormSection
            title="Loading Invoice"
            description="Please wait while we retrieve the invoice..."
          >
            <InvoiceSkeleton />
          </FormSection>
        ) : !selectedInvoice ? (
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
              <div className="grid grid-cols-3 gap-5 text-sm">
                <InfoRow
                  label="Total"
                  value={formatCurrency(selectedInvoice.total_amount)}
                />
                <InfoRow
                  label="Already Paid"
                  value={formatCurrency(summary.amountPaid)}
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
                noValidate
              >
                <FormDatePicker
                  label="Payment Date"
                  value={paymentDate}
                  onValueChange={(v) => setValue("payment_date", v)}
                  {...register("payment_date")}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />

                <FormCurrencyInput
                  control={control}
                  name="amount"
                  label="Amount (₦)"
                  error={errors.amount?.message}
                  required
                />

                <FormInput
                  label={
                    requiresProof
                      ? "Transaction Reference"
                      : "Reference (Optional)"
                  }
                  placeholder={requiresProof ? "": "Auto-generated if left empty"}
                  {...register("reference")}
                  required={requiresProof}
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

                {requiresProof && (
                  <FileDropzone
                    value={watch("paymentProofs")}
                    onChange={(files) =>
                      setValue("paymentProofs", files, {
                        shouldValidate: true,
                      })
                    }
                    label="Payment Proof"
                    hint="Upload the payment receipt or proof of payment."
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxFiles={1}
                    maxSizeMB={5}
                    required
                    error={errors.paymentProofs?.message}
                  />
                )}

                <div className="md:col-span-2 flex mt-5">
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
