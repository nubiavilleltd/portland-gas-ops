"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormFileUpload from "@/components/forms/FormFileUpload";
import DataTable from "@/components/data-table/data-table";
import { invoiceColumns } from "@/components/data-table/columns";
import WorkflowPath from "../_components/WorkflowPath";
import ApprovalStepper from "../_components/ApprovalStepper";
import ActivityHistory from "../_components/ActivityHistory";
import {
  DEPT_OPTIONS,
  CURRENCY_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  GRN_OPTIONS,
  genRef,
  SEED_INVOICES,
  type InvoiceRequest,
} from "../_components/_data";

const schema = z.object({
  requester_name:  z.string().min(2, "Name is required"),
  vendor_name:     z.string().min(2, "Vendor name is required"),
  vendor_id:       z.string().optional(),
  invoice_number:  z.string().min(1, "Invoice number is required"),
  invoice_date:    z.string().min(1, "Date is required"),
  received_date:   z.string().min(1, "Date is required"),
  po_number:       z.string().optional(),
  title:           z.string().min(3, "Description is required"),
  gross_amount:    z.string().min(1, "Amount is required"),
  tax_amount:      z.string().optional(),
  net_amount:      z.string().min(1, "Amount is required"),
  currency:        z.string().min(1, "Select a currency"),
  department:      z.string().min(1, "Select a department"),
  budget_code:     z.string().min(1, "Budget code is required"),
  payment_terms:   z.string().min(1, "Select payment terms"),
  grn_attached:    z.string().min(1, "Select an option"),
});

type FormData = z.infer<typeof schema>;

type View = "list" | "form" | "submitted";

interface SubmittedInfo {
  ref: string;
  requester: string;
  department: string;
  submittedAt: Date;
}

const APPROVAL_ROUTE = ["Initiator (You)", "Line Manager", "Finance Review", "Processed"];

export default function InvoicesPage() {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<InvoiceRequest[]>(SEED_INVOICES);
  const [submitted, setSubmitted] = useState<SubmittedInfo | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  function onSubmit(data: FormData) {
    const ref = genRef("INV");
    setItems((prev) => [
      {
        id: ref,
        ref,
        title: data.title,
        department: data.department,
        amount: parseFloat(data.net_amount),
        vendor: data.vendor_name,
        invoiceNo: data.invoice_number,
        requester: data.requester_name,
        date: data.invoice_date,
        status: "pending",
        poNumber: data.po_number,
        paymentTerms: data.payment_terms,
      },
      ...prev,
    ]);
    setSubmitted({ ref, requester: data.requester_name, department: data.department, submittedAt: new Date() });
    setView("submitted");
  }

  function goBack() {
    setView("list");
    form.reset();
    setSubmitted(null);
  }

  return (
    <AppLayout pageTitle="Invoice Processing">

      {/* ── LIST ── */}
      {view === "list" && (
        <>
          <PageHeader
            title="Invoice Processing"
            description="Manage supplier invoices and payment approvals"
            className="mb-6"
          />
          <DataTable
            columns={invoiceColumns}
            data={items}
            rowHref={(row) => `/finance/invoices/${row.id}`}
            onNewRequest={() => setView("form")}
            newRequestLabel="New Invoice"
            emptyMessage="No invoices yet"
            emptyDescription="Submit your first invoice to get started"
          />
        </>
      )}

      {/* ── FORM ── */}
      {view === "form" && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} />
            Back to Invoice Processing
          </button>

          <PageHeader
            title="New Invoice"
            description="Log and process a supplier invoice for payment approval"
            className="mb-6"
          />

          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden max-w-4xl">
            <div className="h-1.5 w-full bg-linear-to-r from-brand-purple to-brand-purple-light" />

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 lg:p-8 space-y-8">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">
                  Submitted By
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormInput
                    label="Your Name"
                    required
                    placeholder="Full name of person submitting"
                    error={errors.requester_name?.message}
                    {...form.register("requester_name")}
                  />
                  <FormSelect
                    label="Department"
                    required
                    options={DEPT_OPTIONS}
                    placeholder="Select department"
                    error={errors.department?.message}
                    {...form.register("department")}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">
                  Vendor Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormInput
                    label="Vendor / Supplier Name"
                    required
                    placeholder="e.g. Total Energies Nigeria"
                    error={errors.vendor_name?.message}
                    {...form.register("vendor_name")}
                  />
                  <FormInput
                    label="Vendor ID"
                    placeholder="Internal vendor ID (optional)"
                    {...form.register("vendor_id")}
                  />
                  <FormInput
                    label="Invoice Number"
                    required
                    placeholder="e.g. TE-2026-0587"
                    error={errors.invoice_number?.message}
                    {...form.register("invoice_number")}
                  />
                  <FormInput
                    label="Purchase Order Number"
                    placeholder="PO reference if applicable"
                    {...form.register("po_number")}
                  />
                  <FormDatePicker
                    label="Invoice Date"
                    required
                    error={errors.invoice_date?.message}
                    {...form.register("invoice_date")}
                  />
                  <FormDatePicker
                    label="Date Received"
                    required
                    error={errors.received_date?.message}
                    {...form.register("received_date")}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">
                  Invoice Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="md:col-span-2">
                    <FormTextarea
                      label="Description of Goods / Services"
                      required
                      placeholder="What was supplied or performed?"
                      rows={3}
                      error={errors.title?.message}
                      {...form.register("title")}
                    />
                  </div>
                  <FormInput
                    label="Gross Amount (₦)"
                    type="number"
                    required
                    placeholder="0.00"
                    error={errors.gross_amount?.message}
                    {...form.register("gross_amount")}
                  />
                  <FormInput
                    label="VAT / WHT Amount (₦)"
                    type="number"
                    placeholder="0.00 (optional)"
                    {...form.register("tax_amount")}
                  />
                  <FormInput
                    label="Net Payable (₦)"
                    type="number"
                    required
                    placeholder="0.00"
                    error={errors.net_amount?.message}
                    {...form.register("net_amount")}
                  />
                  <FormSelect
                    label="Currency"
                    required
                    options={CURRENCY_OPTIONS}
                    sortOptions={false}
                    placeholder="Select currency"
                    error={errors.currency?.message}
                    {...form.register("currency")}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">
                  Payment & Compliance
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <FormInput
                    label="Budget Code / GL Account"
                    required
                    placeholder="e.g. OPEX-2026-OPS"
                    error={errors.budget_code?.message}
                    {...form.register("budget_code")}
                  />
                  <FormSelect
                    label="Payment Terms"
                    required
                    options={PAYMENT_TERMS_OPTIONS}
                    sortOptions={false}
                    placeholder="Select terms"
                    error={errors.payment_terms?.message}
                    {...form.register("payment_terms")}
                  />
                  <FormSelect
                    label="Goods Received Note (GRN) Attached?"
                    required
                    options={GRN_OPTIONS}
                    sortOptions={false}
                    placeholder="Select"
                    error={errors.grn_attached?.message}
                    {...form.register("grn_attached")}
                  />
                  <div className="md:col-span-2">
                    <FormFileUpload label="Upload Invoice Copy" hint="Attach the scanned or digital invoice (optional)" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-brand-border bg-gray-50 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">
                  Approval Route
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {APPROVAL_ROUTE.map((step, i, arr) => (
                    <div key={step} className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                          i === 0
                            ? "bg-brand-purple-faint text-brand-purple border-brand-purple-mid"
                            : "bg-white text-brand-text-secondary border-brand-border"
                        }`}
                      >
                        {step}
                      </span>
                      {i < arr.length - 1 && (
                        <span className="text-brand-text-secondary text-xs">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-brand-border">
                <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
                  Submit for Approval
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Clear Form
                </Button>
                <Button type="button" variant="ghost" className="sm:ml-auto" onClick={goBack}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── SUBMITTED ── */}
      {view === "submitted" && submitted && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} />
            Back to Invoice Processing
          </button>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-green-800">Invoice Submitted Successfully</h2>
              <p className="text-sm text-green-700 mt-0.5">
                Reference:{" "}
                <span className="font-mono font-bold">{submitted.ref}</span> — Your invoice has been routed to the first approver.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ApprovalStepper currentStep={1} />
            <WorkflowPath
              initiator={submitted.requester}
              department={submitted.department}
              currentStep={1}
            />
            <ActivityHistory
              initiator={submitted.requester}
              department={submitted.department}
              submittedAt={submitted.submittedAt}
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={goBack}>View All Invoices</Button>
            <Button
              variant="outline"
              onClick={() => { form.reset(); setView("form"); }}
            >
              Submit Another
            </Button>
          </div>
        </>
      )}
    </AppLayout>
  );
}
