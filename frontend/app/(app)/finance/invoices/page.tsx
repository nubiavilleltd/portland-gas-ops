"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
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
import { formatNumber } from "@/lib/utils/format-number";
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

type View = "list" | "form";

export default function InvoicesPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<InvoiceRequest[]>(() =>
    SEED_INVOICES.filter((item) => item.requester === CURRENT_USER.name)
  );
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [invoiceId] = useState(() => genRef("IID"));

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  const watchGross = form.watch("gross_amount");
  const watchTax   = form.watch("tax_amount");
  const watchNet   = form.watch("net_amount");
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
    toast.success(`Invoice submitted successfully — Reference: ${ref}`);
    form.reset();
    setSupportingFiles([]);
    setTimeout(() => location.reload(), 800);
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
  }

  return (
    <AppLayout pageTitle="Invoice Processing">

      {/* ── LIST ── */}
      {view === "list" && (
        <>
          <PageHeader
            title="Invoice Processing"
            description="Manage supplier invoices and payment approvals"
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => setView("form")}>
                New Invoice
              </Button>
            }
            className="mb-6"
          />
          <div className="w-full overflow-hidden">
            <DataTable
              columns={invoiceColumns}
              data={items}
              rowHref={(row) => `/finance/invoices/${row.id}`}
              emptyMessage="No invoices yet"
              emptyDescription="Submit your first invoice to get started"
            />
          </div>
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

            <FormSection title="Requester Details" description="Your employee information for this invoice request.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name"  value={CURRENT_USER.name} disabled />
                <FormInput label="Department"       value={CURRENT_USER.department} disabled />
                <FormInput label="Job Title / Role" value={CURRENT_USER.role} disabled />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            <FormSection title="Request Details" description="Vendor and invoice details for this payment request.">
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
                      required
                      placeholder="0.00"
                      error={errors.gross_amount?.message}
                      {...form.register("gross_amount", {
                        onBlur: (e) => {
                          const rawValue = e.target.value.replace(/,/g, "");
                          const numValue = parseFloat(rawValue) || 0;
                          e.target.value = formatNumber(numValue);
                        },
                      })}
                    />
                    <FormInput
                      label="VAT / WHT Amount"
                      placeholder="0.00 (optional)"
                      {...form.register("tax_amount", {
                        onBlur: (e) => {
                          const rawValue = e.target.value.replace(/,/g, "");
                          const numValue = parseFloat(rawValue) || 0;
                          e.target.value = formatNumber(numValue);
                        },
                      })}
                    />
                    <FormInput
                      label="Net Payable"
                      required
                      placeholder="0.00"
                      error={errors.net_amount?.message}
                      {...form.register("net_amount", {
                        onBlur: (e) => {
                          const rawValue = e.target.value.replace(/,/g, "");
                          const numValue = parseFloat(rawValue) || 0;
                          e.target.value = formatNumber(numValue);
                        },
                      })}
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

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
                Submit for Approval
              </Button>
            </div>
          </form>
        </>
      )}

    </AppLayout>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 pt-5 pb-6">
        {children}
      </div>
    </section>
  );
}
