"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import DataTable from "@/components/data-table/data-table";
import { invoiceColumns } from "@/components/data-table/columns";
import WorkflowPath from "../_components/WorkflowPath";
import ApprovalStepper from "../_components/ApprovalStepper";
import ActivityHistory from "../_components/ActivityHistory";
import {
  CURRENCY_OPTIONS,
  VENDOR_OPTIONS,
  PURCHASE_ORDERS,
  genRef,
  SEED_INVOICES,
  INVOICE_STORE,
  type InvoiceRequest,
} from "../_components/_data";

const TODAY = new Date().toISOString().split("T")[0];

const CURRENT_USER = {
  name: "Joseph Chika",
  department: "Finance",
  role: "Finance Manager",
};

const schema = z.object({
  vendor_name:    z.string().min(1, "Select a vendor"),
  po_number:      z.string().optional(),
  invoice_number: z.string().min(1, "Invoice number is required"),
  title:          z.string().min(2, "Title is required"),
  description:    z.string().optional(),
  gross_amount:   z.string().min(1, "Amount is required"),
  tax_amount:     z.string().optional(),
  net_amount:     z.string().min(1, "Amount is required"),
  currency:       z.string().min(1, "Select a currency"),
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
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [invoiceId] = useState(() => genRef("IID"));

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  const watchGross = form.watch("gross_amount");
  const watchTax   = form.watch("tax_amount");
  useEffect(() => {
    const gross = parseFloat(watchGross ?? "");
    if (isNaN(gross)) return;
    const tax = parseFloat(watchTax ?? "");
    const net = isNaN(tax) || watchTax === "" ? gross : gross - tax;
    form.setValue("net_amount", net.toFixed(2), { shouldValidate: true });
  }, [watchGross, watchTax, form]);

  function onSubmit(data: FormData) {
    const ref = genRef("INV");
    const newItem: InvoiceRequest = {
      id: ref,
      ref,
      title: data.title,
      description: data.description,
      department: CURRENT_USER.department,
      amount: parseFloat(data.net_amount),
      vendor: data.vendor_name,
      invoiceId,
      invoiceNo: data.invoice_number,
      requester: CURRENT_USER.name,
      jobTitle: CURRENT_USER.role,
      date: TODAY,
      status: "pending",
      poNumber: data.po_number,
      currency: data.currency,
      grossAmount: parseFloat(data.gross_amount),
      taxAmount: data.tax_amount ? parseFloat(data.tax_amount) : undefined,
      supportingDocuments: supportingFiles.length > 0
        ? supportingFiles.map((f) => f.name)
        : undefined,
    };
    INVOICE_STORE.unshift(newItem);
    setItems((prev) => [newItem, ...prev]);
    setSubmitted({
      ref,
      requester: CURRENT_USER.name,
      department: CURRENT_USER.department,
      submittedAt: new Date(),
    });
    setView("submitted");
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
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

          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full space-y-5">

            <FormSection title="Requester Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name"  value={CURRENT_USER.name} disabled />
                <FormInput label="Department"       value={CURRENT_USER.department} disabled />
                <FormInput label="Job Title / Role" value={CURRENT_USER.role} disabled />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            <FormSection title="Request Details">
              <div className="space-y-6">

                {/* Vendor Details sub-section */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Vendor Details</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                      label="Vendor / Supplier Name"
                      required
                      options={VENDOR_OPTIONS}
                      sortOptions={false}
                      placeholder="Select vendor"
                      error={errors.vendor_name?.message}
                      {...form.register("vendor_name")}
                    />
                    <FormSelect
                      label="Purchase Order Number"
                      options={PURCHASE_ORDERS}
                      sortOptions={false}
                      placeholder="Select PO (optional)"
                      {...form.register("po_number")}
                    />
                    <FormInput
                      label="Invoice Number"
                      required
                      placeholder="e.g. TE-2026-0587"
                      error={errors.invoice_number?.message}
                      {...form.register("invoice_number")}
                    />
                    <FormInput
                      label="Invoice ID"
                      value={invoiceId}
                      disabled
                    />
                  </div>
                </div>

                {/* Invoice Details sub-section */}
                <div className="border-t border-brand-border pt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Invoice Details</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <FormInput
                        label="Title / Purpose"
                        required
                        placeholder="e.g. Diesel supply — May batch"
                        error={errors.title?.message}
                        {...form.register("title")}
                      />
                    </div>
                    <FormSelect
                      label="Currency"
                      required
                      options={CURRENCY_OPTIONS}
                      sortOptions={false}
                      placeholder="Select currency"
                      error={errors.currency?.message}
                      {...form.register("currency")}
                    />
                    <FormInput
                      label="Gross Amount"
                      type="number"
                      required
                      placeholder="0.00"
                      error={errors.gross_amount?.message}
                      {...form.register("gross_amount")}
                    />
                    <FormInput
                      label="VAT / WHT Amount"
                      type="number"
                      placeholder="0.00 (optional)"
                      {...form.register("tax_amount")}
                    />
                    <FormInput
                      label="Net Payable"
                      type="number"
                      required
                      placeholder="0.00"
                      error={errors.net_amount?.message}
                      {...form.register("net_amount")}
                    />
                    <div className="md:col-span-2">
                      <FormTextarea
                        label="Description of Goods / Services"
                        placeholder="What was supplied or performed?"
                        rows={3}
                        error={errors.description?.message}
                        {...form.register("description")}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FileDropzone
                        label="Supporting Documents"
                        value={supportingFiles}
                        onChange={setSupportingFiles}
                        accept="image/*,.pdf,.doc,.docx"
                        maxFiles={10}
                        hint="Attach the scanned or digital invoice and any supporting documents (optional)"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </FormSection>

            <section className="rounded-xl border border-brand-border bg-gray-50 px-5 py-4">
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
            </section>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
                Submit for Approval
              </Button>
              <Button type="button" variant="ghost" className="ml-auto" onClick={goBack}>
                Cancel
              </Button>
            </div>
          </form>
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
              onClick={() => { form.reset(); setSupportingFiles([]); setView("form"); }}
            >
              Submit Another
            </Button>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">{title}</h2>
      {children}
    </section>
  );
}
